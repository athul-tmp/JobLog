using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

public interface IAnalyticsService
{
    Task<DashboardAnalyticsDto> GetDashboardAnalytics(int userId);
}

public class AnalyticsService : IAnalyticsService
{
    // "Needs attention" thresholds
    public const int NoReplyDays = 30;          // Companies often take weeks, so only flag long silences (suggest marking as Ghosted)
    public const int InterviewStalledDays = 7;  // No update for a week at an interview stage is worth a follow-up

    // Interview stages in order, with their flow chart node keys
    private static readonly (string Status, string Node)[] InterviewStages =
    {
        ("Screening Interview", "screening"),
        ("Mid-stage Interview", "midStage"),
        ("Final Interview", "final"),
    };

    private readonly ApplicationDbContext _dbContext;

    public AnalyticsService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardAnalyticsDto> GetDashboardAnalytics(int userId)
    {
        var applications = await _dbContext.JobApplications
            .Where(a => a.UserId == userId)
            .Include(a => a.StatusHistory)
            .ToListAsync();

        var now = DateTime.UtcNow;

        if (!applications.Any())
        {
            return new DashboardAnalyticsDto(0, 0, 0, 0, 0, 0, 0, 0,
                new List<MonthlyApplications>(), new List<ApplicationsPerDay>(), new List<FlowLink>(),
                new List<AttentionItem>(), new List<SourceBreakdown>(), new ResponseTimes(null, 0, null, 0));
        }

        // Analytics to show
        var totalApplications = applications.Count;
        var totalOffers = applications.Count(a => a.Status == "Offer");
        var totalRejections = applications.Count(a => a.Status == "Rejected");
        var totalGhosted = applications.Count(a => a.Status == "Ghosted");
        var totalPending = applications.Count(a => a.Status == "Applied");
        var totalInterviews = applications.Count(a => IsInterviewStage(a.Status));

        // Monthly Trend
        DateTime today = now.Date; // DateApplied is stored in UTC
        DateTime currentMonthStart = new DateTime(today.Year, today.Month, 1);
        DateTime previousMonthStart = currentMonthStart.AddMonths(-1);

        // Filter applications to include only the current and previous month
        var recentApplications = applications
            .Where(a => a.DateApplied >= previousMonthStart)
            .ToList();

        var monthlyTrend = recentApplications
            .GroupBy(a => new { a.DateApplied.Year, a.DateApplied.Month })
            .Select(g => new MonthlyApplications(
                MonthYear: $"{new DateTime(g.Key.Year, g.Key.Month, 1):MMM yyyy}",
                Count: g.Count()
            ))
            .OrderBy(m => DateTime.ParseExact(m.MonthYear, "MMM yyyy", null)) // Sort by date
            .ToList();

        // Same days of last month as have passed this month (capped at last month's length)
        int daysToCompare = Math.Min(today.Day, DateTime.DaysInMonth(previousMonthStart.Year, previousMonthStart.Month));
        var previousMonthToDateCount = applications
            .Count(a => a.DateApplied >= previousMonthStart && a.DateApplied < previousMonthStart.AddDays(daysToCompare));

        // Filter for current month's applications
        var currentMonthApplications = applications
            .Where(a => a.DateApplied >= currentMonthStart)
            .ToList();

        // Group by Day, including days with no applications (count 0) up to today
        var countsByDay = currentMonthApplications
            .GroupBy(a => a.DateApplied.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var applicationsPerDay = Enumerable.Range(0, (today - currentMonthStart).Days + 1)
            .Select(offset => currentMonthStart.AddDays(offset))
            .Select(day => new ApplicationsPerDay(
                Date: day.ToString("MMM dd"),
                Count: countsByDay.GetValueOrDefault(day)
            ))
            .ToList();

        // Return Final DTO
        return new DashboardAnalyticsDto(
            TotalApplications: totalApplications,
            TotalOffers: totalOffers,
            TotalRejections: totalRejections,
            TotalPending: totalPending,
            TotalInterviews: totalInterviews,
            TotalGhosted: totalGhosted,
            PreviousMonthToDateCount: previousMonthToDateCount,
            PreviousMonthToDateDays: daysToCompare,
            MonthlyTrend: monthlyTrend,
            ApplicationsPerDay: applicationsPerDay,
            ApplicationFlow: BuildApplicationFlow(applications),
            NeedsAttention: BuildNeedsAttention(applications, now),
            Sources: BuildSources(applications),
            ResponseTimes: BuildResponseTimes(applications)
        );
    }

    private static bool IsInterviewStage(string status) => InterviewStages.Any(s => s.Status == status);

    private static bool HadInterview(JobApplication application) =>
        application.StatusHistory.Any(h => IsInterviewStage(h.Status)) || IsInterviewStage(application.Status);

    // Flow chart: each application follows applications -> interview stages it reached (in order) -> where it is now,
    // so every node's inflow equals its outflow
    private static List<FlowLink> BuildApplicationFlow(List<JobApplication> applications)
    {
        var counts = new Dictionary<(string From, string To), int>();

        foreach (var application in applications)
        {
            var stagesReached = InterviewStages
                .Where(s => application.Status == s.Status || application.StatusHistory.Any(h => h.Status == s.Status))
                .Select(s => s.Node)
                .ToList();
            var interviewed = stagesReached.Count > 0;

            var outcome = application.Status switch
            {
                "Offer" => "offer",
                "Rejected" => interviewed ? "rejected" : "rejectedNoInterview",
                "Ghosted" => interviewed ? "ghosted" : "ghostedNoInterview",
                _ when IsInterviewStage(application.Status) => "inProgress",
                _ => "awaiting",
            };

            var path = new List<string> { "applications" };
            path.AddRange(stagesReached);
            path.Add(outcome);

            for (var i = 0; i < path.Count - 1; i++)
            {
                var link = (path[i], path[i + 1]);
                counts[link] = counts.GetValueOrDefault(link) + 1;
            }
        }

        return counts.Select(c => new FlowLink(c.Key.From, c.Key.To, c.Value)).ToList();
    }

    // Applications worth acting on: stalled interviews (follow up) first, then long silences (likely ghosted)
    private static List<AttentionItem> BuildNeedsAttention(List<JobApplication> applications, DateTime now)
    {
        var items = new List<AttentionItem>();

        foreach (var application in applications)
        {
            if (application.Status == "Applied")
            {
                var days = (int)(now - application.DateApplied).TotalDays;
                if (days >= NoReplyDays)
                {
                    items.Add(ToAttentionItem(application, "NoReply", days));
                }
            }
            else if (IsInterviewStage(application.Status))
            {
                var lastUpdate = application.StatusHistory.Any()
                    ? application.StatusHistory.Max(h => h.ChangeDate)
                    : application.DateApplied;
                var days = (int)(now - lastUpdate).TotalDays;
                if (days >= InterviewStalledDays)
                {
                    items.Add(ToAttentionItem(application, "InterviewStalled", days));
                }
            }
        }

        return items
            .OrderBy(i => i.Reason == "InterviewStalled" ? 0 : 1)
            .ThenByDescending(i => i.DaysSinceUpdate)
            .ToList();
    }

    private static AttentionItem ToAttentionItem(JobApplication application, string reason, int days) =>
        new(application.Id, application.ApplicationNo, application.Company, application.Role,
            application.Status, reason, days, application.JobPostingURL);

    // Job board per application, from the job posting URL
    public static string SourceFor(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return "No link";
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return "Company site / other";
        }

        var host = uri.Host.ToLowerInvariant();
        if (host.Contains("linkedin.")) return "LinkedIn";
        if (host.Contains("seek.")) return "Seek";
        if (host.Contains("indeed.")) return "Indeed";
        if (host.Contains("glassdoor.")) return "Glassdoor";
        return "Company site / other";
    }

    private static List<SourceBreakdown> BuildSources(List<JobApplication> applications)
    {
        return applications
            .GroupBy(a => SourceFor(a.JobPostingURL))
            .Select(g => new SourceBreakdown(g.Key, g.Count(), g.Count(HadInterview)))
            .OrderByDescending(s => s.Applications)
            .ToList();
    }

    // A "reply" is the first interview, offer or rejection (ghosting is the absence of a reply)
    private static ResponseTimes BuildResponseTimes(List<JobApplication> applications)
    {
        var daysToReply = new List<double>();
        var daysToInterview = new List<double>();

        foreach (var application in applications)
        {
            var firstReply = application.StatusHistory
                .Where(h => IsInterviewStage(h.Status) || h.Status == "Offer" || h.Status == "Rejected")
                .OrderBy(h => h.ChangeDate)
                .FirstOrDefault();
            if (firstReply != null)
            {
                daysToReply.Add(Math.Max(0, (firstReply.ChangeDate - application.DateApplied).TotalDays));
            }

            var firstInterview = application.StatusHistory
                .Where(h => IsInterviewStage(h.Status))
                .OrderBy(h => h.ChangeDate)
                .FirstOrDefault();
            if (firstInterview != null)
            {
                daysToInterview.Add(Math.Max(0, (firstInterview.ChangeDate - application.DateApplied).TotalDays));
            }
        }

        return new ResponseTimes(Median(daysToReply), daysToReply.Count, Median(daysToInterview), daysToInterview.Count);
    }

    private static double? Median(List<double> values)
    {
        if (values.Count == 0)
        {
            return null;
        }

        var sorted = values.OrderBy(v => v).ToList();
        var middle = sorted.Count / 2;
        var median = sorted.Count % 2 == 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
        return Math.Round(median, 1);
    }
}

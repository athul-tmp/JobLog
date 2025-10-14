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

    if (!applications.Any())
    {
      return new DashboardAnalyticsDto(0, 0, 0, 0, 0, 0, 0, 0, new List<StatusBreakdown>(), new List<MonthlyApplications>(), new List<InterviewBreakdown>());
    }

    // Analytics to show
    var totalApplications = applications.Count;
    var totalOffers = applications.Count(a => a.Status == "Offer");
    var totalRejections = applications.Count(a => a.Status == "Rejected");
    var totalGhosted = applications.Count(a => a.Status == "Ghosted");
    var totalPending = applications.Count(a => a.Status == "Applied");

    // Interview count = sum of all specific interview stages
    var totalInterviews = applications.Count(a =>
        a.Status == "OA Interview" ||
        a.Status == "Interview" ||
        a.Status == "Final Interview");

    // Interviewed but Rejected/Ghosted 
    var interviewedAndRejected = applications
        .Count(a => a.Status == "Rejected" && a.StatusHistory
            .Any(h => h.Status.Contains("Interview")));

    var interviewedAndGhosted = applications
        .Count(a => a.Status == "Ghosted" && a.StatusHistory
            .Any(h => h.Status.Contains("Interview")));

    //  Stage Breakdown 
    var stageBreakdown = applications
        .GroupBy(a => a.Status)
        .Select(g => new StatusBreakdown(g.Key, g.Count()))
        .ToList();

    // Filter applications that are currently in any interview stage
    var interviewApplications = applications.Where(a =>
        a.Status == "OA Interview" ||
        a.Status == "Interview" ||
        a.Status == "Final Interview").ToList();

    // Group these interviews by their specific status value
    var interviewTypeBreakdown = interviewApplications
        .GroupBy(a => a.Status)
        .Select(g => new InterviewBreakdown(
            Type: g.Key,
            Count: g.Count()
        ))
        .ToList();

    // Monthly Trend 
    DateTime today = DateTime.Today;
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

    // Return Final DTO
    return new DashboardAnalyticsDto(
        TotalApplications: totalApplications,
        TotalOffers: totalOffers,
        TotalRejections: totalRejections,
        TotalPending: totalPending,
        TotalInterviews: totalInterviews,
        TotalGhosted: totalGhosted,
        InterviewedAndRejected: interviewedAndRejected,
        InterviewedAndGhosted: interviewedAndGhosted,
        StageBreakdown: stageBreakdown,
        MonthlyTrend: monthlyTrend,
        InterviewTypeBreakdown: interviewTypeBreakdown
    );
  }
}
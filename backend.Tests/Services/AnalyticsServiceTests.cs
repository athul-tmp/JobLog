using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services;

public class AnalyticsServiceTests
{
  private ApplicationDbContext CreateDbContext()
  {
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
      .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
      .Options;

    return new ApplicationDbContext(options);
  }

  [Fact]
  public async Task GetDashboardAnalytics_ReturnsAllZeros_WhenNoApplicationsExist()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    Assert.Equal(0, result.TotalApplications);
    Assert.Equal(0, result.TotalOffers);
    Assert.Equal(0, result.TotalRejections);
  }

  [Fact]
  public async Task GetDashboardAnalytics_CountsBasicStatuses_Correctly()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co2",
      Role = "Developer",
      Status = "Screening Interview",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 2
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co3",
      Role = "Developer",
      Status = "Offer",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 3
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co4",
      Role = "Developer",
      Status = "Rejected",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 4
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co5",
      Role = "Developer",
      Status = "Ghosted",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 5
    });
    dbContext.SaveChanges();
    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    Assert.Equal(5, result.TotalApplications);
    Assert.Equal(1, result.TotalOffers);
    Assert.Equal(1, result.TotalRejections);
    Assert.Equal(1, result.TotalPending);
    Assert.Equal(1, result.TotalInterviews);
    Assert.Equal(1, result.TotalGhosted);
  }

  [Fact]
  public async Task GetDashboardAnalytics_ExcludesOldApplications_FromMonthlyTrend()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Recent Co", Role = "Dev", Status = "Applied",
      DateApplied = DateTime.UtcNow, ApplicationNo = 1
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Old Co", Role = "Dev", Status = "Applied",
      DateApplied = DateTime.UtcNow.AddMonths(-5), ApplicationNo = 2
    });
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    var totalInMonthlyTrend = result.MonthlyTrend.Sum(m => m.Count);
    Assert.Equal(1, totalInMonthlyTrend);
  }

  [Fact]
  public async Task GetDashboardAnalytics_IncludesEveryDayOfCurrentMonth_WithZeroForDaysWithoutApplications()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var now = DateTime.UtcNow;
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Today Co1", Role = "Dev", Status = "Applied",
      DateApplied = now, ApplicationNo = 1
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Today Co2", Role = "Dev", Status = "Applied",
      DateApplied = now, ApplicationNo = 2
    });
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert: one entry per day from the 1st to today, zero except today
    Assert.Equal(now.Day, result.ApplicationsPerDay.Count);
    Assert.Equal(now.ToString("MMM dd"), result.ApplicationsPerDay.Last().Date);
    Assert.Equal(2, result.ApplicationsPerDay.Last().Count);
    Assert.All(result.ApplicationsPerDay.SkipLast(1), day => Assert.Equal(0, day.Count));
  }

  [Fact]
  public async Task GetDashboardAnalytics_ComparesAgainstSameDaysOfPreviousMonth()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var today = DateTime.UtcNow.Date;
    var previousMonthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-1);

    // Inside the comparison window (1st of last month) and just outside it (the day after today's day number)
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Early Co", Role = "Dev", Status = "Applied",
      DateApplied = previousMonthStart.AddHours(10), ApplicationNo = 1
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Later Co", Role = "Dev", Status = "Applied",
      DateApplied = previousMonthStart.AddDays(today.Day).AddHours(10), ApplicationNo = 2
    });
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    Assert.Equal(1, result.PreviousMonthToDateCount);
  }

  // Adds an application with the given status and history; each history entry is (status, days after applying)
  private static JobApplication AddApplication(ApplicationDbContext dbContext, int appNo, string status, DateTime applied,
    string? url = null, params (string Status, double DaysAfter)[] history)
  {
    var application = new JobApplication
    {
      UserId = 1, Company = $"Co{appNo}", Role = "Dev", Status = status,
      DateApplied = applied, ApplicationNo = appNo, JobPostingURL = url
    };
    application.StatusHistory.Add(new JobStatusHistory { JobApplicationId = 0, Status = "Applied", ChangeDate = applied });
    foreach (var (stage, daysAfter) in history)
    {
      application.StatusHistory.Add(new JobStatusHistory { JobApplicationId = 0, Status = stage, ChangeDate = applied.AddDays(daysAfter) });
    }
    dbContext.JobApplications.Add(application);
    return application;
  }

  [Fact]
  public async Task GetDashboardAnalytics_BuildsBalancedApplicationFlow_ThroughInterviewStages()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var applied = DateTime.UtcNow.AddDays(-20);
    AddApplication(dbContext, 1, "Applied", applied);
    AddApplication(dbContext, 2, "Rejected", applied, null, ("Rejected", 2));
    AddApplication(dbContext, 3, "Rejected", applied, null, ("Screening Interview", 2), ("Rejected", 4));
    AddApplication(dbContext, 4, "Offer", applied, null, ("Screening Interview", 2), ("Mid-stage Interview", 4), ("Final Interview", 6), ("Offer", 8));
    AddApplication(dbContext, 5, "Mid-stage Interview", applied, null, ("Screening Interview", 2), ("Mid-stage Interview", 4));
    AddApplication(dbContext, 6, "Ghosted", applied, null, ("Final Interview", 3), ("Ghosted", 10)); // skipped earlier stages
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var flow = (await service.GetDashboardAnalytics(1)).ApplicationFlow;
    int Count(string from, string to) => flow.SingleOrDefault(l => l.From == from && l.To == to)?.Count ?? 0;

    // Assert
    Assert.Equal(1, Count("applications", "awaiting"));
    Assert.Equal(1, Count("applications", "rejectedNoInterview"));
    Assert.Equal(3, Count("applications", "screening"));
    Assert.Equal(1, Count("applications", "final"));
    Assert.Equal(1, Count("screening", "rejected"));
    Assert.Equal(2, Count("screening", "midStage"));
    Assert.Equal(1, Count("midStage", "inProgress"));
    Assert.Equal(1, Count("midStage", "final"));
    Assert.Equal(1, Count("final", "offer"));
    Assert.Equal(1, Count("final", "ghosted"));

    // Every intermediate node balances: inflow == outflow
    foreach (var node in new[] { "screening", "midStage", "final" })
    {
      Assert.Equal(flow.Where(l => l.To == node).Sum(l => l.Count), flow.Where(l => l.From == node).Sum(l => l.Count));
    }
    Assert.Equal(6, flow.Where(l => l.From == "applications").Sum(l => l.Count));
  }

  [Fact]
  public async Task GetDashboardAnalytics_FlagsLongSilencesAndStalledInterviews()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var now = DateTime.UtcNow;
    AddApplication(dbContext, 1, "Applied", now.AddDays(-(AnalyticsService.NoReplyDays + 5)));             // flagged: no reply
    AddApplication(dbContext, 2, "Applied", now.AddDays(-(AnalyticsService.NoReplyDays - 5)));             // too recent
    AddApplication(dbContext, 3, "Screening Interview", now.AddDays(-20), null, ("Screening Interview", 5)); // flagged: 15 days stalled
    AddApplication(dbContext, 4, "Final Interview", now.AddDays(-5), null, ("Final Interview", 3));         // updated 2 days ago
    AddApplication(dbContext, 5, "Rejected", now.AddDays(-60), null, ("Rejected", 3));                      // closed, never flagged
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var items = (await service.GetDashboardAnalytics(1)).NeedsAttention;

    // Assert: stalled interviews come first
    Assert.Equal(2, items.Count);
    Assert.Equal("InterviewStalled", items[0].Reason);
    Assert.Equal("Co3", items[0].Company);
    Assert.Equal(15, items[0].DaysSinceUpdate);
    Assert.Equal("NoReply", items[1].Reason);
    Assert.Equal("Co1", items[1].Company);
  }

  [Theory]
  [InlineData("https://www.linkedin.com/jobs/view/123", "LinkedIn")]
  [InlineData("https://www.seek.com.au/job/456", "Seek")]
  [InlineData("https://au.indeed.com/viewjob?jk=abc", "Indeed")]
  [InlineData("https://careers.example.com/jobs/1", "Company site / other")]
  [InlineData(null, "No link")]
  [InlineData("", "No link")]
  public void SourceFor_ClassifiesJobBoards(string? url, string expected)
  {
    Assert.Equal(expected, AnalyticsService.SourceFor(url));
  }

  [Fact]
  public async Task GetDashboardAnalytics_CountsApplicationsAndInterviewsPerSource()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var applied = DateTime.UtcNow.AddDays(-10);
    AddApplication(dbContext, 1, "Applied", applied, "https://www.linkedin.com/jobs/view/1");
    AddApplication(dbContext, 2, "Screening Interview", applied, "https://www.linkedin.com/jobs/view/2", ("Screening Interview", 2));
    AddApplication(dbContext, 3, "Applied", applied, "https://www.seek.com.au/job/3");
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var sources = (await service.GetDashboardAnalytics(1)).Sources;

    // Assert
    var linkedIn = sources.Single(s => s.Source == "LinkedIn");
    Assert.Equal(2, linkedIn.Applications);
    Assert.Equal(1, linkedIn.Interviews);
    Assert.Equal("LinkedIn", sources[0].Source); // ordered by applications
    Assert.Equal(0, sources.Single(s => s.Source == "Seek").Interviews);
  }

  [Fact]
  public async Task GetDashboardAnalytics_CalculatesMedianResponseTimes_IgnoringGhosting()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var applied = DateTime.UtcNow.AddDays(-40);
    AddApplication(dbContext, 1, "Rejected", applied, null, ("Rejected", 4));
    AddApplication(dbContext, 2, "Final Interview", applied, null, ("Screening Interview", 10), ("Final Interview", 20));
    AddApplication(dbContext, 3, "Offer", applied, null, ("Screening Interview", 6), ("Offer", 15));
    AddApplication(dbContext, 4, "Ghosted", applied, null, ("Ghosted", 30)); // not a reply
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var times = (await service.GetDashboardAnalytics(1)).ResponseTimes;

    // Assert: replies after 4, 6, 10 days; interviews after 6, 10 days
    Assert.Equal(3, times.RepliesCounted);
    Assert.Equal(6, times.MedianDaysToFirstReply);
    Assert.Equal(2, times.InterviewsCounted);
    Assert.Equal(8, times.MedianDaysToFirstInterview);
  }
}

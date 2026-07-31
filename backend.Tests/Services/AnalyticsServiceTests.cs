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
  public async Task GetDashboardAnalytics_CountsPastInterviews_FromHistory()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var application = new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Offer",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    };
    dbContext.JobApplications.Add(application);
    dbContext.SaveChanges();

    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Applied",
      ChangeDate = DateTime.UtcNow.AddDays(-3)
    });
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Screening Interview",
      ChangeDate = DateTime.UtcNow.AddDays(-2)
    });
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Offer",
      ChangeDate = DateTime.UtcNow
    });
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    Assert.Equal(1, result.TotalPastInterviews);
  }

  [Fact]
  public async Task GetDashboardAnalytics_CountsInterviewedAndRejectedOrGhosted_Correctly()
  {
    // Arrange
    var dbContext = CreateDbContext();

    var rejectedApp = new JobApplication
    {
      UserId = 1,
      Company = "Rejected Co",
      Role = "Developer",
      Status = "Rejected",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    };
    var ghostedApp = new JobApplication
    {
      UserId = 1,
      Company = "Ghosted Co",
      Role = "Developer",
      Status = "Ghosted",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 2
    };
    var rejectedNoInterviewApp = new JobApplication
    {
      UserId = 1,
      Company = "Rejected No Interview Co",
      Role = "Developer",
      Status = "Rejected",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 3
    };
    dbContext.JobApplications.AddRange(rejectedApp, ghostedApp, rejectedNoInterviewApp);
    dbContext.SaveChanges();

    // rejectedApp went through an interview stage before being rejected
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = rejectedApp.Id,
      Status = "Screening Interview",
      ChangeDate = DateTime.UtcNow.AddDays(-2)
    });
    // ghostedApp also went through an interview stage
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = ghostedApp.Id,
      Status = "Mid-stage Interview",
      ChangeDate = DateTime.UtcNow.AddDays(-1)
    });
    // rejectedNoInterviewApp was rejected with NO interview stage in its history
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = rejectedNoInterviewApp.Id,
      Status = "Applied",
      ChangeDate = DateTime.UtcNow.AddDays(-1)
    });
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    Assert.Equal(1, result.InterviewedAndRejected);
    Assert.Equal(1, result.InterviewedAndGhosted);
  }

  [Fact]
  public async Task GetDashboardAnalytics_GroupsInterviewTypeBreakdown_Correctly()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Co1", Role = "Dev", Status = "Screening Interview",
      DateApplied = DateTime.UtcNow, ApplicationNo = 1
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Co2", Role = "Dev", Status = "Screening Interview",
      DateApplied = DateTime.UtcNow, ApplicationNo = 2
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1, Company = "Co3", Role = "Dev", Status = "Final Interview",
      DateApplied = DateTime.UtcNow, ApplicationNo = 3
    });
    dbContext.SaveChanges();

    var service = new AnalyticsService(dbContext);

    // Act
    var result = await service.GetDashboardAnalytics(1);

    // Assert
    var screeningGroup = result.InterviewTypeBreakdown.Single(b => b.Type == "Screening Interview");
    var finalGroup = result.InterviewTypeBreakdown.Single(b => b.Type == "Final Interview");

    Assert.Equal(2, screeningGroup.Count);
    Assert.Equal(1, finalGroup.Count);
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
}
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
}
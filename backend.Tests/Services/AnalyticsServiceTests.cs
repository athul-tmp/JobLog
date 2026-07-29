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
}
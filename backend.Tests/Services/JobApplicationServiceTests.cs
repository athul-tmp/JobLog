using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.InMemory;
using Xunit;

namespace backend.Tests.Services;

public class JobApplicationServiceTests
{
  // Helper to build in memory database for testing
  private ApplicationDbContext CreateDbContext()
    {
      var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        .Options;

      return new ApplicationDbContext(options);
    }

  [Fact]
  public async Task CreateApplication_SetsApplicationNoToOne_WhenUserHasNoExistingApplications()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationCreateRequest("Test Co", "Developer", null, null);

    // Act
    var result = await service.CreateApplication(1, request);

    // Assert
    Assert.Equal(1, result.ApplicationNo);
  }

  [Fact]
  public async Task CreateApplication_IncrementsApplicationNo_WhenUserHasExistingApplications()
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
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 2
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationCreateRequest("Test Co", "Developer", null, null);

    // Act
    var result = await service.CreateApplication(1, request);

    // Assert
    Assert.Equal(3, result.ApplicationNo);
  }

  [Fact]
  public async Task UpdateApplication_ThrowsKeyNotFoundException_WhenApplicationNotFound()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationUpdateRequest(1, "Test Company", null, null, null, null);

    // Act + Assert
    await Assert.ThrowsAsync<KeyNotFoundException>(() => service.UpdateApplication(1, request));
  }

  [Fact]
  public async Task UpdateApplication_ThrowsInvalidOperationException_ForInvalidStatusValue()
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
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationUpdateRequest(1, null, null, null,"NotRealStatus", null);

    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateApplication(1, request));
  }

  [Fact]
  public async Task UpdateApplication_ThrowsInvalidOperationException_WhenCurrentStatusIsEndState()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Rejected",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationUpdateRequest(1, null, null, null,"Applied", null);
    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateApplication(1, request));
  }

  [Fact]
  public async Task UpdateApplication_ThrowsInvalidOperationException_WhenMovingBackToApplied()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Screening Interview",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationUpdateRequest(1, null, null, null,"Applied", null);
    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateApplication(1, request));
  }

  [Fact]
  public async Task UpdateApplication_ThrowsInvalidOperationException_WhenMovingBackwardInInterviewStages()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Final Interview",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);
    var request = new JobApplicationUpdateRequest(1, null, null, null,"Screening Interview", null);
    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateApplication(1, request));
  }
}
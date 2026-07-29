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

  [Fact]
  public async Task UpdateApplication_SucceedsAndUpdatesStatus_ForValidForwardTransition()
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
    var request = new JobApplicationUpdateRequest(1, null, null, null, "Screening Interview", null);

    // Act
    var result = await service.UpdateApplication(1, request);

    // Assert
    Assert.Equal("Screening Interview", result.Status);
  }

  [Fact]
  public async Task UpdateApplication_LogsStatusHistory_WhenStatusChanges()
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
    var request = new JobApplicationUpdateRequest(1, null, null, null, "Screening Interview", null);

    // Act
    var result = await service.UpdateApplication(1, request);

    // Assert
    var historyEntry = dbContext.JobStatusHistories
      .SingleOrDefault(h => h.JobApplicationId == result.Id && h.Status == "Screening Interview");

    Assert.NotNull(historyEntry);
  }

  [Fact]
  public async Task DeleteAllUserApplications_ThrowsKeyNotFoundException_WhenUserDoesNotExist()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var service = new JobApplicationService(dbContext);
    
    // Act + Assert
    await Assert.ThrowsAsync<KeyNotFoundException>(() => service.DeleteAllUserApplications(1, "PasswordDoesNotMatter"));
  }

  [Fact]
  public async Task DeleteAllUserApplications_ThrowsUnauthorizedAccessException_WhenPasswordIncorrect()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Id = 1,
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.DeleteAllUserApplications(1, "incorrect-password"));
  }

  [Fact]
  public async Task DeleteAllUserApplications_DeletesAllApplications_WhenPasswordCorrect()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Id = 1,
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
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

    // Act
    await service.DeleteAllUserApplications(1, "correct-password");

    // Assert
    Assert.Empty(dbContext.JobApplications.Where(a => a.UserId == 1));
  }

  [Fact]
  public async Task DeleteAllUserApplications_DoesNothing_WhenUserHasNoApplications()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Id = 1,
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);

    // Act
    await service.DeleteAllUserApplications(1, "correct-password");

    // Assert
    Assert.Empty(dbContext.JobApplications.Where(a => a.UserId == 1));
  }

  [Fact]
  public async Task UndoLastStatusChange_ThrowsKeyNotFoundException_WhenApplicationNotFound()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var service = new JobApplicationService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<KeyNotFoundException>(() => service.UndoLastStatusChange(1, 1));
  }

  [Fact]
  public async Task UndoLastStatusChange_ThrowsInvalidOperationException_WhenOnlyInitialStatusExists()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var application = new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    };
    dbContext.JobApplications.Add(application);
    dbContext.SaveChanges();

    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Applied",
      ChangeDate = DateTime.UtcNow
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.UndoLastStatusChange(1, 1));
  }

  [Fact]
  public async Task UndoLastStatusChange_RevertsToPrecedingStatus_WhenMultipleHistoryEntriesExist()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var application = new JobApplication
    {
      UserId = 1,
      Company = "Test Co1",
      Role = "Developer",
      Status = "Screening Interview",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    };
    dbContext.JobApplications.Add(application);
    dbContext.SaveChanges();

    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Applied",
      ChangeDate = DateTime.UtcNow.AddDays(-1)
    });
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Screening Interview",
      ChangeDate = DateTime.UtcNow
    });
    dbContext.SaveChanges();

    var service = new JobApplicationService(dbContext);

    // Act
    var result = await service.UndoLastStatusChange(application.Id, 1);

    // Assert
    Assert.Equal("Applied", result.Status);
    Assert.Single(dbContext.JobStatusHistories.Where(h => h.JobApplicationId == application.Id));
  }
}
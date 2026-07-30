using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace backend.Tests.Services;

public class UserServiceTests
{
  private ApplicationDbContext CreateDbContext()
  {
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
      .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
      .Options;

    return new ApplicationDbContext(options);
  }

  private UserService CreateUserService(ApplicationDbContext dbContext, Mock<IEmailService>? mockEmailService = null)
  {
    mockEmailService ??= new Mock<IEmailService>();
    var mockConfig = new Mock<IConfiguration>();

    return new UserService(dbContext, mockEmailService.Object, mockConfig.Object);
  }
 
  [Fact]
  public async Task AuthenticateUser_ReturnsNull_WhenPasswordIncorrect()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act
    var result = await service.AuthenticateUser("test@example.com", "wrong-password");

    // Assert
    Assert.Null(result);
  }

  [Fact]
  public async Task AuthenticateUser_ReturnsUser_WhenPasswordCorrect()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act
    var result = await service.AuthenticateUser("test@example.com", "correct-password");

    // Assert
    Assert.NotNull(result);
    Assert.Equal("test@example.com", result!.Email);
  }

  [Fact]
  public async Task DeleteUser_RemovesUserAndTheirApplications()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var user = new User
    {
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = user.Id,
      Company = "Test Co",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act
    await service.DeleteUser(user.Id, "correct-password");

    // Assert
    Assert.Null(await dbContext.Users.FindAsync(user.Id));
    Assert.Empty(dbContext.JobApplications.Where(a => a.UserId == user.Id));
  }

  [Fact]
  public async Task ResetPassword_ThrowsInvalidOperationException_WhenTokenExpired()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("old-password"),
      FirstName = "Test",
      PasswordResetToken = BCrypt.Net.BCrypt.HashPassword("reset-token"),
      ResetTokenExpires = DateTime.UtcNow.AddHours(-1) // already expired
    });
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.ResetPassword("test@example.com", "reset-token", "new-password"));
  }

  [Fact]
  public async Task CompleteRegistration_ThrowsInvalidOperationException_WhenVerificationExpired()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.EmailVerifications.Add(new EmailVerification
    {
      Email = "test@example.com",
      Token = BCrypt.Net.BCrypt.HashPassword("verify-token"),
      ExpiryDate = DateTime.UtcNow.AddHours(-1), // already expired
      Purpose = "Registration",
      UserId = null
    });
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.CompleteRegistration("test@example.com", "verify-token", "Test", "password123"));
  }

  [Fact]
  public async Task ForgotPassword_DoesNotSendEmail_WhenUserDoesNotExist()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var mockEmailService = new Mock<IEmailService>();
    var service = CreateUserService(dbContext, mockEmailService);

    // Act
    await service.ForgotPassword("doesnotexist@example.com");

    // Assert
    mockEmailService.Verify(e => e.SendPasswordResetEmail(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
  }

  [Fact]
  public async Task InitiateRegistration_ThrowsInvalidOperationException_WhenEmailAlreadyRegistered()
  {
    // Arrange
    var dbContext = CreateDbContext();
    dbContext.Users.Add(new User
    {
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.InitiateRegistration("test@example.com"));
  }

  [Fact]
  public async Task InitiateEmailChange_ThrowsInvalidOperationException_WhenNewEmailAlreadyInUse()
  {
    // Arrange
    var dbContext = CreateDbContext();
    var user = new User
    {
      Email = "test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    };
    var otherUser = new User
    {
      Email = "taken@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("some-password"),
      FirstName = "Other"
    };
    dbContext.Users.AddRange(user, otherUser);
    dbContext.SaveChanges();

    var service = CreateUserService(dbContext);

    // Act + Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() => service.InitiateEmailChange(user.Id, "correct-password", "taken@example.com"));
  }
}
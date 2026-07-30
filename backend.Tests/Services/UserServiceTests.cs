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

  private UserService CreateUserService(ApplicationDbContext dbContext)
  {
    var mockEmailService = new Mock<IEmailService>();
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
}
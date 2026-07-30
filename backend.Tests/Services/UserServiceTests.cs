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
}
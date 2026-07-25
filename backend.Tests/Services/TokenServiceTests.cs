using backend.Models;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace backend.Tests.Services;

public class TokenServiceTests
{

  // Helper to create Token via TokenService using mock configuration
  private TokenService CreateTokenService()
  {
    var mockConfig = new Mock<IConfiguration>();
    mockConfig.Setup(c => c["Jwt:Key"]).Returns("this-is-a-fake-test-secret-key-with-enough-length-123456");
    mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
    mockConfig.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

    return new TokenService(mockConfig.Object);
  }

  // Helper to set up User
  private User CreateUser(string email)
  {
    return new User
    {
      Id = 1,
      Email = email,
      PasswordHash = "irrelevant-for-this-test",
      FirstName = "irrelevant-for-this-test"
    };
  }

  [Fact]
  public void CreateToken_ReturnsNonEmptyToken_ForNormalUser()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var user = CreateUser("test@example.com");

    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    Assert.False(string.IsNullOrEmpty(result.Token));
  }

  [Fact]
  public void CreateToken_SetsIsDemoUserFalse_ForNormalUser()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var user = CreateUser("test@example.com");

    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    Assert.False(result.IsDemoUser);
  }

  [Fact]
  public void CreateToken_SetsIsDemoUserTrue_ForDemoUser()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var user = CreateUser("demo@joblog.com");

    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    Assert.True(result.IsDemoUser);
  }

}
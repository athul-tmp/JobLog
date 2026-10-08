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
  private User CreateUser(string email, bool isDemo = false)
  {
    return new User
    {
      Id = 1,
      Email = email,
      PasswordHash = "irrelevant-for-this-test",
      FirstName = "irrelevant-for-this-test",
      IsDemo = isDemo,
      DemoExpiresAt = isDemo ? DateTime.UtcNow.AddMinutes(30) : null
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
  public void CreateToken_GivesThirtyDayExpiry_ForNormalUser()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var user = CreateUser("test@example.com");
    var before = DateTime.UtcNow;

    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    var expectedExpiry = before.AddDays(30);
    var difference = (result.Expiry - expectedExpiry).Duration();
    Assert.True(difference < TimeSpan.FromSeconds(2));
  }

  [Fact]
  public void CreateToken_ExpiresWithDemoAccount_ForDemoUser()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var user = CreateUser("demo-123@demo.joblog.invalid", isDemo: true);

    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    Assert.Equal(user.DemoExpiresAt, result.Expiry);
  }

  [Fact]
  public void CreateToken_IncludesDemoClaim_OnlyForDemoUser()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();

    // Act
    var demoToken = handler.ReadJwtToken(tokenService.CreateToken(CreateUser("demo-123@demo.joblog.invalid", isDemo: true)).Token);
    var regularToken = handler.ReadJwtToken(tokenService.CreateToken(CreateUser("test@example.com")).Token);

    // Assert
    Assert.Contains(demoToken.Claims, c => c.Type == backend.Helpers.DemoUserHelper.IsDemoClaim && c.Value == "true");
    Assert.DoesNotContain(regularToken.Claims, c => c.Type == backend.Helpers.DemoUserHelper.IsDemoClaim);
  }

  [Fact]
  public void CreateToken_IncludesUsersTokenVersionClaim()
  {
    // Arrange
    var tokenService = CreateTokenService();
    var user = CreateUser("test@example.com");
    user.TokenVersion = 3;

    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    var jwt = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().ReadJwtToken(result.Token);
    Assert.Equal("3", jwt.Claims.Single(c => c.Type == TokenService.TokenVersionClaim).Value);
  }

  [Fact]
  public void CreateToken_ThrowsInvalidOperationException_WhenJwtKeyMissing()
  {
    // Arrange
    var mockConfig = new Mock<IConfiguration>();
    mockConfig.Setup(c => c["Jwt:Key"]).Returns((string?)null);
    mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
    mockConfig.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

    var tokenService = new TokenService(mockConfig.Object);
    var user = CreateUser("test@example.com");

    // Act + Assert
    Assert.Throws<InvalidOperationException>(() => tokenService.CreateToken(user));
  }
}

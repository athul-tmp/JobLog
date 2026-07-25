using backend.Models;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace backend.Tests.Services;

public class TokenServiceTests
{

  [Fact]
  public void CreateToken_ReturnsNonEmptyToken_ForNormalUser()
  {
    // Arrange
    var mockConfig = new Mock<IConfiguration>();
    mockConfig.Setup(c => c["Jwt:Key"]).Returns("this-is-a-fake-test-secret-key-with-enough-length-123456");
    mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
    mockConfig.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

    var tokenService = new TokenService(mockConfig.Object);

    var user = new User
    {
      Id = 1,
      Email = "test@example.com",
      PasswordHash = "irrelevant-for-this-test",
      FirstName = "Athul"
    };
    // Act
    var result = tokenService.CreateToken(user);

    // Assert
    Assert.False(string.IsNullOrEmpty(result.Token));
  }

}
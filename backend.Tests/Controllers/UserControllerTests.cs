using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests.Controllers;

public class UserControllerTests : IClassFixture<CustomWebApplicationFactory>
{
  private readonly CustomWebApplicationFactory _factory;

  public UserControllerTests(CustomWebApplicationFactory factory)
  {
    _factory = factory;
  }

  // --- Login ---

  [Fact]
  public async Task Login_ReturnsOkWithToken_ForCorrectCredentials()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    dbContext.Users.Add(new User
    {
      Email = "login-test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var client = _factory.CreateClient();
    var request = new UserLoginRequest("login-test@example.com", "correct-password");

    // Act
    var response = await client.PostAsJsonAsync("/api/User/login", request);

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    Assert.False(string.IsNullOrEmpty(body.RootElement.GetProperty("token").GetString()));
  }

  [Fact]
  public async Task Login_ReturnsUnauthorized_ForIncorrectPassword()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    dbContext.Users.Add(new User
    {
      Email = "login-test2@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    });
    dbContext.SaveChanges();

    var client = _factory.CreateClient();
    var request = new UserLoginRequest("login-test2@example.com", "wrong-password");

    // Act
    var response = await client.PostAsJsonAsync("/api/User/login", request);

    // Assert
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
  }
}
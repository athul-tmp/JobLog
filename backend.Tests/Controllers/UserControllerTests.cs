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

  // --- Logout ---

  [Fact]
  public async Task Logout_ReturnsOk_WithNoAuthRequired()
  {
    // Arrange
    var client = _factory.CreateClient();

    // Act
    var response = await client.PostAsync("/api/User/logout", null);

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  // --- UpdateName + UpdatePassword ---

  [Fact]
  public async Task UpdateName_ReturnsOk_ForAuthenticatedUserWithCorrectPassword()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = new User
    {
      Email = "updatename-test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "OldName"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    var request = new UpdateNameRequest("correct-password", "NewName");

    // Act
    var response = await client.PutAsJsonAsync("/api/User/updateName", request);

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  [Fact]
  public async Task UpdatePassword_ReturnsOk_ForAuthenticatedUserWithCorrectPassword()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = new User
    {
      Email = "updatepassword-test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    var request = new UpdatePasswordRequest("correct-password", "NewPassw0rd!");

    // Act
    var response = await client.PutAsJsonAsync("/api/User/updatePassword", request);

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  // --- Delete Account ---

  [Fact]
  public async Task DeleteAccount_ReturnsOk_AndRemovesUser_ForCorrectPassword()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = new User
    {
      Email = "delete-test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    var request = new DeleteAccountRequest("correct-password");

    // Act
    var response = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/User/delete")
    {
      Content = JsonContent.Create(request)
    });

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.Null(await dbContext.Users.FindAsync(user.Id));
  }

  // --- Verify Password ---

  [Fact]
  public async Task VerifyPassword_ReturnsOk_ForAuthenticatedUserWithCorrectPassword()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = new User
    {
      Email = "verifypassword-test@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    var request = new VerifyPasswordRequest("correct-password");

    // Act
    var response = await client.PostAsJsonAsync("/api/User/verifyPassword", request);

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }
}
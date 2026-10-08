using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Helpers;
using backend.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace backend.Tests.Controllers;

public class SessionTests : IClassFixture<CustomWebApplicationFactory>
{
  private const string Password = "Correct-password1!";
  private readonly CustomWebApplicationFactory _factory;

  public SessionTests(CustomWebApplicationFactory factory)
  {
    _factory = factory;
  }

  private static (User user, string token) CreateUserWithToken(WebApplicationFactory<Program> factory, string email)
  {
    using var scope = factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = dbContext.Users.SingleOrDefault(u => u.Email == email);
    if (user == null)
    {
      user = new User
      {
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password),
        FirstName = "Test"
      };
      dbContext.Users.Add(user);
      dbContext.SaveChanges();
    }

    return (user, tokenService.CreateToken(user).Token);
  }

  private static HttpClient CreateClient(WebApplicationFactory<Program> factory, string token)
  {
    var client = factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    return client;
  }

  // --- Revocation ---

  [Fact]
  public async Task OldToken_IsRejected_AfterPasswordChange()
  {
    // Arrange
    var (_, token) = CreateUserWithToken(_factory, $"revoke-{Guid.NewGuid()}@example.com");
    var client = CreateClient(_factory, token);

    // Act
    var change = await client.PutAsJsonAsync("/api/User/updatePassword", new UpdatePasswordRequest(Password, "New-password1!"));
    var afterChange = await client.GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.OK, change.StatusCode);
    Assert.Equal(HttpStatusCode.Unauthorized, afterChange.StatusCode);
  }

  [Fact]
  public async Task Token_IsRejected_AfterUserDeleted()
  {
    // Arrange
    var (user, token) = CreateUserWithToken(_factory, $"deleted-{Guid.NewGuid()}@example.com");
    using (var scope = _factory.Services.CreateScope())
    {
      var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      dbContext.Users.Remove(dbContext.Users.Single(u => u.Id == user.Id));
      dbContext.SaveChanges();
    }

    // Act
    var response = await CreateClient(_factory, token).GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
  }

  [Fact]
  public async Task TokenWithoutVersionClaim_IsAccepted_ForExistingSessions()
  {
    // Arrange: a token shaped like those issued before token versioning existed
    var (user, _) = CreateUserWithToken(_factory, $"legacy-{Guid.NewGuid()}@example.com");
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("this-is-a-fake-test-secret-key-with-enough-length-123456"));
    var legacyToken = new JwtSecurityTokenHandler().WriteToken(new JwtSecurityTokenHandler().CreateToken(new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(new[]
      {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email)
      }),
      Expires = DateTime.UtcNow.AddDays(7),
      Issuer = "TestIssuer",
      Audience = "TestAudience",
      SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
    }));

    // Act
    var response = await CreateClient(_factory, legacyToken).GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  // --- Sliding session ---

  [Fact]
  public async Task FreshToken_IsNotRefreshed()
  {
    // Arrange
    var (_, token) = CreateUserWithToken(_factory, $"fresh-{Guid.NewGuid()}@example.com");

    // Act
    var response = await CreateClient(_factory, token).GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.False(response.Headers.Contains(AuthSessionHelper.RefreshedTokenHeader));
  }

  [Fact]
  public async Task AgedToken_IsRefreshed_ViaHeaderAndCookie_AndNewTokenWorks()
  {
    // Arrange: treat every token as old enough to refresh
    var refreshingFactory = _factory.WithWebHostBuilder(builder => builder.UseSetting("Jwt:RefreshAfterHours", "0"));
    var (_, token) = CreateUserWithToken(refreshingFactory, $"aged-{Guid.NewGuid()}@example.com");

    // Act
    var response = await CreateClient(refreshingFactory, token).GetAsync("/api/JobApplication/all");
    var refreshedToken = response.Headers.GetValues(AuthSessionHelper.RefreshedTokenHeader).Single();
    var withRefreshed = await CreateClient(refreshingFactory, refreshedToken).GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.Contains(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith($"{AuthSessionHelper.AuthCookieName}="));
    Assert.Equal(HttpStatusCode.OK, withRefreshed.StatusCode);
  }

  [Fact]
  public async Task HealthPing_RefreshesAgedToken()
  {
    // Arrange
    var refreshingFactory = _factory.WithWebHostBuilder(builder => builder.UseSetting("Jwt:RefreshAfterHours", "0"));
    var (_, token) = CreateUserWithToken(refreshingFactory, $"ping-{Guid.NewGuid()}@example.com");

    // Act
    var response = await CreateClient(refreshingFactory, token).GetAsync("/api/health");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.True(response.Headers.Contains(AuthSessionHelper.RefreshedTokenHeader));
  }

  [Fact]
  public async Task DemoToken_IsNeverRefreshed()
  {
    // Arrange
    var refreshingFactory = _factory.WithWebHostBuilder(builder => builder.UseSetting("Jwt:RefreshAfterHours", "0"));
    var start = await refreshingFactory.CreateClient().PostAsync("/api/Demo/start", null);
    var token = (await start.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("token").GetString()!;

    // Act
    var response = await CreateClient(refreshingFactory, token).GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.False(response.Headers.Contains(AuthSessionHelper.RefreshedTokenHeader));
  }
}

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using backend.Data;
using backend.Helpers;
using backend.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests.Controllers;

public class SecurityTests : IClassFixture<CustomWebApplicationFactory>
{
  private readonly CustomWebApplicationFactory _factory;

  public SecurityTests(CustomWebApplicationFactory factory)
  {
    _factory = factory;
  }

  private HttpClient CreateClientFor(string email)
  {
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = dbContext.Users.SingleOrDefault(u => u.Email == email);
    if (user == null)
    {
      user = new User
      {
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Correct-password1!"),
        FirstName = "Test"
      };
      dbContext.Users.Add(user);
      dbContext.SaveChanges();
    }

    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenService.CreateToken(user).Token);
    return client;
  }

  // --- Demo account guard ---

  [Fact]
  public async Task DemoUser_CannotChangePassword()
  {
    // Arrange
    var client = CreateClientFor(DemoUserHelper.DemoEmail);
    var request = new UpdatePasswordRequest("Correct-password1!", "New-password1!");

    // Act
    var response = await client.PutAsJsonAsync("/api/User/updatePassword", request);

    // Assert
    Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
  }

  [Fact]
  public async Task DemoUser_CannotDeleteAccountOrClearData()
  {
    // Arrange
    var client = CreateClientFor(DemoUserHelper.DemoEmail);
    var body = JsonContent.Create(new { currentPassword = "Correct-password1!" });

    // Act
    var deleteAccount = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/User/delete") { Content = body });
    var clearData = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/JobApplication/all") { Content = JsonContent.Create(new { currentPassword = "Correct-password1!" }) });

    // Assert
    Assert.Equal(HttpStatusCode.Forbidden, deleteAccount.StatusCode);
    Assert.Equal(HttpStatusCode.Forbidden, clearData.StatusCode);
  }

  [Fact]
  public async Task RegularUser_IsNotBlockedByDemoGuard()
  {
    // Arrange
    var client = CreateClientFor($"regular-{Guid.NewGuid()}@example.com");

    // Act
    var response = await client.PostAsJsonAsync("/api/User/verifyPassword", new VerifyPasswordRequest("Correct-password1!"));

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  // --- Input validation ---

  [Theory]
  [InlineData("javascript:alert(1)")]
  [InlineData("data:text/html,<script>alert(1)</script>")]
  [InlineData("not a url")]
  public async Task CreateApplication_RejectsNonHttpUrls(string url)
  {
    // Arrange
    var client = CreateClientFor($"url-{Guid.NewGuid()}@example.com");

    // Act
    var response = await client.PostAsJsonAsync("/api/JobApplication", new JobApplicationCreateRequest("Co", "Dev", url, null));

    // Assert
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
  }

  [Fact]
  public async Task CreateApplication_RejectsOverlongNotes()
  {
    // Arrange
    var client = CreateClientFor($"notes-{Guid.NewGuid()}@example.com");
    var notes = new string('x', ValidationHelper.MaxNotesLength + 1);

    // Act
    var response = await client.PostAsJsonAsync("/api/JobApplication", new JobApplicationCreateRequest("Co", "Dev", null, notes));

    // Assert
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
  }

  [Fact]
  public async Task CreateApplication_AssignsSequentialApplicationNumbers()
  {
    // Arrange
    var client = CreateClientFor($"seq-{Guid.NewGuid()}@example.com");

    // Act
    await client.PostAsJsonAsync("/api/JobApplication", new JobApplicationCreateRequest("A", "Dev", "https://example.com/job", null));
    var second = await client.PostAsJsonAsync("/api/JobApplication", new JobApplicationCreateRequest("B", "Dev", null, null));
    var created = await second.Content.ReadFromJsonAsync<backend.DTOs.JobApplicationDto>();

    // Assert
    Assert.Equal(HttpStatusCode.Created, second.StatusCode);
    Assert.Equal(2, created!.ApplicationNo);
    Assert.Single(created.StatusHistory);
  }

  // --- Rate limiting ---

  [Fact]
  public async Task Login_ReturnsTooManyRequests_AfterLimitExceeded()
  {
    // Arrange
    var limitedFactory = _factory.WithWebHostBuilder(builder =>
      builder.UseSetting("RateLimiting:AuthPermitLimit", "2"));
    var client = limitedFactory.CreateClient();
    var request = new UserLoginRequest("nobody@example.com", "wrong-password");

    // Act
    await client.PostAsJsonAsync("/api/User/login", request);
    await client.PostAsJsonAsync("/api/User/login", request);
    var third = await client.PostAsJsonAsync("/api/User/login", request);

    // Assert
    Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
  }

  [Fact]
  public async Task RateLimit_UsesForwardedClientIp_AndIgnoresSpoofedValues()
  {
    // Arrange: simulate Azure Container Apps ingress, which appends the real client IP to X-Forwarded-For
    var limitedFactory = _factory.WithWebHostBuilder(builder =>
      builder.UseSetting("RateLimiting:AuthPermitLimit", "1"));
    var client = limitedFactory.CreateClient();

    async Task<HttpStatusCode> LoginFrom(string forwardedFor)
    {
      var message = new HttpRequestMessage(HttpMethod.Post, "/api/User/login")
      {
        Content = JsonContent.Create(new UserLoginRequest("nobody@example.com", "wrong-password"))
      };
      message.Headers.Add("X-Forwarded-For", forwardedFor);
      return (await client.SendAsync(message)).StatusCode;
    }

    // Act
    var firstFromA = await LoginFrom("203.0.113.10");
    var secondFromA = await LoginFrom("203.0.113.10");
    var firstFromB = await LoginFrom("198.51.100.20");
    var spoofedFromA = await LoginFrom("192.0.2.99, 203.0.113.10"); // client-supplied value, real IP appended

    // Assert
    Assert.NotEqual(HttpStatusCode.TooManyRequests, firstFromA);
    Assert.Equal(HttpStatusCode.TooManyRequests, secondFromA);       // same client is limited
    Assert.NotEqual(HttpStatusCode.TooManyRequests, firstFromB);     // other clients have their own bucket
    Assert.Equal(HttpStatusCode.TooManyRequests, spoofedFromA);      // spoofing the header doesn't reset the limit
  }

  // --- Health ---

  [Fact]
  public async Task Health_ReturnsOk_WithoutAuth()
  {
    // Arrange
    var client = _factory.CreateClient();

    // Act
    var response = await client.GetAsync("/api/health");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }
}

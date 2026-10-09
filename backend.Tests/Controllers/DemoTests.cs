using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests.Controllers;

public class DemoTests : IClassFixture<CustomWebApplicationFactory>
{
  private readonly CustomWebApplicationFactory _factory;

  public DemoTests(CustomWebApplicationFactory factory)
  {
    _factory = factory;
  }

  private async Task<(HttpClient client, JsonElement body)> StartDemo()
  {
    var response = await _factory.CreateClient().PostAsync("/api/Demo/start", null);
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    var body = await response.Content.ReadFromJsonAsync<JsonElement>();
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
    return (client, body);
  }

  [Fact]
  public async Task StartDemo_ReturnsDemoSession_WithCookie()
  {
    // Act
    var response = await _factory.CreateClient().PostAsync("/api/Demo/start", null);
    var body = await response.Content.ReadFromJsonAsync<JsonElement>();

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.True(body.GetProperty("isDemo").GetBoolean());
    Assert.False(string.IsNullOrEmpty(body.GetProperty("tokenExpiration").GetString()));
    Assert.Contains(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith($"{AuthSessionHelper.AuthCookieName}="));
  }

  [Fact]
  public async Task StartDemo_SeedsApplications_WithConsistentHistory()
  {
    // Arrange
    var (client, _) = await StartDemo();

    // Act
    var applications = await client.GetFromJsonAsync<List<JobApplicationDto>>("/api/JobApplication/all");

    // Assert
    Assert.Equal(DemoService.SeedApplicationCount, applications!.Count);
    foreach (var application in applications)
    {
      var history = application.StatusHistory.OrderBy(h => h.ChangeDate).ToList();
      Assert.Equal("Applied", history.First().Status);
      Assert.Equal(application.Status, history.Last().Status);
      Assert.Equal(application.DateApplied, history.First().ChangeDate);
      Assert.True(history.Last().ChangeDate <= DateTime.UtcNow);
    }
  }

  [Fact]
  public async Task StartDemo_SeedsDailyTrend_WithMultipleApplicationsOnSomeDays()
  {
    // Arrange
    var (client, _) = await StartDemo();

    // Act
    var applications = (await client.GetFromJsonAsync<List<JobApplicationDto>>("/api/JobApplication/all"))!;
    var perDay = applications.GroupBy(a => a.DateApplied.Date).Select(g => g.Count()).ToList();

    // Assert
    Assert.Contains(perDay, count => count > 1);
    Assert.Contains(applications, a => a.DateApplied.Date == DateTime.UtcNow.Date); // today always has data
    Assert.All(applications, a => Assert.True(a.DateApplied <= DateTime.UtcNow));
  }

  [Fact]
  public async Task StartDemo_SeedsDataForEveryDashboardSection()
  {
    // Arrange
    var (client, _) = await StartDemo();

    // Act
    var stats = await client.GetFromJsonAsync<DashboardAnalyticsDto>("/api/Analytics/summary");

    // Assert
    Assert.Contains(stats!.NeedsAttention, i => i.Reason == "NoReply");
    Assert.Contains(stats.NeedsAttention, i => i.Reason == "InterviewStalled");
    Assert.True(stats.Sources.Count >= 3);
    Assert.DoesNotContain(stats.Sources, s => s.Source == "No link");
    Assert.NotNull(stats.ResponseTimes.MedianDaysToFirstReply);
    Assert.Contains(stats.ApplicationFlow, l => l.From == "screening" && l.To == "midStage");
  }

  [Fact]
  public async Task DemoSessions_AreIsolatedFromEachOther()
  {
    // Arrange
    var (first, _) = await StartDemo();
    var (second, _) = await StartDemo();

    // Act
    await first.PostAsJsonAsync("/api/JobApplication", new JobApplicationCreateRequest("Only In First", "Dev", null, null));
    var firstApps = await first.GetFromJsonAsync<List<JobApplicationDto>>("/api/JobApplication/all");
    var secondApps = await second.GetFromJsonAsync<List<JobApplicationDto>>("/api/JobApplication/all");

    // Assert
    Assert.Contains(firstApps!, a => a.Company == "Only In First");
    Assert.DoesNotContain(secondApps!, a => a.Company == "Only In First");
    Assert.Equal(DemoService.SeedApplicationCount, secondApps!.Count);
  }

  [Fact]
  public async Task DemoToken_IsRejected_OnceDemoAccountExpires()
  {
    // Arrange
    var (client, body) = await StartDemo();
    var email = body.GetProperty("email").GetString();
    using (var scope = _factory.Services.CreateScope())
    {
      var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      var user = dbContext.Users.Single(u => u.Email == email);
      user.DemoExpiresAt = DateTime.UtcNow.AddMinutes(-1);
      dbContext.SaveChanges();
    }

    // Act
    var response = await client.GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
  }

  [Fact]
  public async Task DeleteExpiredDemoUsers_RemovesOnlyExpiredDemoAccountsAndTheirData()
  {
    // Arrange
    var (_, expiredBody) = await StartDemo();
    var (_, activeBody) = await StartDemo();
    var expiredEmail = expiredBody.GetProperty("email").GetString();
    var activeEmail = activeBody.GetProperty("email").GetString();

    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var expiredUser = dbContext.Users.Single(u => u.Email == expiredEmail);
    expiredUser.DemoExpiresAt = DateTime.UtcNow.AddMinutes(-1);
    dbContext.SaveChanges();
    var expiredUserId = expiredUser.Id;

    // Act
    await scope.ServiceProvider.GetRequiredService<IDemoService>().DeleteExpiredDemoUsers();

    // Assert
    dbContext.ChangeTracker.Clear();
    Assert.False(dbContext.Users.Any(u => u.Email == expiredEmail));
    Assert.False(dbContext.JobApplications.Any(a => a.UserId == expiredUserId));
    Assert.True(dbContext.Users.Any(u => u.Email == activeEmail));
  }

  [Fact]
  public async Task StartDemo_IsRateLimited()
  {
    // Arrange
    var limitedFactory = _factory.WithWebHostBuilder(builder =>
      builder.UseSetting("RateLimiting:DemoPermitLimit", "2"));
    var client = limitedFactory.CreateClient();

    // Act
    await client.PostAsync("/api/Demo/start", null);
    await client.PostAsync("/api/Demo/start", null);
    var third = await client.PostAsync("/api/Demo/start", null);

    // Assert
    Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
  }
}

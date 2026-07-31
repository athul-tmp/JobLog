using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests.Controllers;

public class AnalyticsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
  private readonly CustomWebApplicationFactory _factory;

  public AnalyticsControllerTests(CustomWebApplicationFactory factory)
  {
    _factory = factory;
  }

  [Fact]
  public async Task GetSummaryStats_ReturnsOk_ForAuthenticatedUser()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = new User
    {
      Email = "analytics-test@example.com",
      PasswordHash = "irrelevant-for-this-test",
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);

    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    // Act
    var response = await client.GetAsync("/api/Analytics/summary");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }
}
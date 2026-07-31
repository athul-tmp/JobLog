using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests.Controllers;

public class JobApplicationControllerTests : IClassFixture<CustomWebApplicationFactory>
{
  private readonly CustomWebApplicationFactory _factory;

  public JobApplicationControllerTests(CustomWebApplicationFactory factory)
  {
    _factory = factory;
  }

  private (HttpClient client, User user) CreateAuthenticatedClient(ApplicationDbContext dbContext, ITokenService tokenService)
  {
    var user = new User
    {
      Email = $"test-{Guid.NewGuid()}@example.com",
      PasswordHash = "irrelevant-for-this-test",
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);

    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    return (client, user);
  }

  [Fact]
  public async Task CreateApplication_ReturnsCreated_ForValidRequest()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var (client, _) = CreateAuthenticatedClient(dbContext, tokenService);

    var request = new JobApplicationCreateRequest("Test Co", "Developer", null, null);

    // Act
    var response = await client.PostAsJsonAsync("/api/JobApplication", request);

    // Assert
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
  }

  [Fact]
  public async Task UpdateApplication_ReturnsBadRequest_ForInvalidStatusValue()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var (client, user) = CreateAuthenticatedClient(dbContext, tokenService);

    var application = new JobApplication
    {
      UserId = user.Id,
      Company = "Test Co",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    };
    dbContext.JobApplications.Add(application);
    dbContext.SaveChanges();

    var request = new JobApplicationUpdateRequest(application.Id, null, null, null, "NotRealStatus", null);

    // Act
    var response = await client.PutAsJsonAsync("/api/JobApplication", request);

    // Assert
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
  }
}
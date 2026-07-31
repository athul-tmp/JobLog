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

  [Fact]
  public async Task GetAllUserApplications_ReturnsOnlyRequestingUsersApplications()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var (client, user) = CreateAuthenticatedClient(dbContext, tokenService);

    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = user.Id,
      Company = "My Co1",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = user.Id,
      Company = "My Co2",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 2
    });

    // Another user's application which should NOT show up in the response
    var otherUser = new User
    {
      Email = $"other-{Guid.NewGuid()}@example.com",
      PasswordHash = "irrelevant-for-this-test",
      FirstName = "Other"
    };
    dbContext.Users.Add(otherUser);
    dbContext.SaveChanges();

    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = otherUser.Id,
      Company = "Someone Else's Co",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.SaveChanges();

    // Act
    var response = await client.GetAsync("/api/JobApplication/all");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    var applications = await response.Content.ReadFromJsonAsync<List<JobApplicationDto>>();
    Assert.NotNull(applications);
    Assert.Equal(2, applications!.Count);
    Assert.DoesNotContain(applications, a => a.Company == "Someone Else's Co");
  }

  [Fact]
  public async Task DeleteAllUserApplications_ReturnsOk_WhenPasswordCorrect()
  {
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var user = new User
    {
      Email = $"test-{Guid.NewGuid()}@example.com",
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
      FirstName = "Test"
    };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();

    dbContext.JobApplications.Add(new JobApplication
    {
      UserId = user.Id,
      Company = "Test Co",
      Role = "Developer",
      Status = "Applied",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    });
    dbContext.SaveChanges();

    var tokenResult = tokenService.CreateToken(user);
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);

    var request = new DeleteDataRequest("correct-password");

    // Act
    var response = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/JobApplication/all")
    {
      Content = JsonContent.Create(request)
    });

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.Empty(dbContext.JobApplications.Where(a => a.UserId == user.Id));
  }

  [Fact]
  public async Task UndoLastStatusChange_ReturnsOk_AndRevertsStatus()
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
      Status = "Screening Interview",
      DateApplied = DateTime.UtcNow,
      ApplicationNo = 1
    };
    dbContext.JobApplications.Add(application);
    dbContext.SaveChanges();

    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Applied",
      ChangeDate = DateTime.UtcNow.AddDays(-1)
    });
    dbContext.JobStatusHistories.Add(new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = "Screening Interview",
      ChangeDate = DateTime.UtcNow
    });
    dbContext.SaveChanges();

    // Act
    var response = await client.PostAsync($"/api/JobApplication/undo/{application.Id}", null);

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    var updatedApplication = await response.Content.ReadFromJsonAsync<JobApplicationDto>();
    Assert.NotNull(updatedApplication);
    Assert.Equal("Applied", updatedApplication!.Status);
  }
}
using backend.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace backend.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
  // One database per factory (i.e. per test class). xUnit runs test classes in parallel, and a shared
  // in-memory database let classes race on the same rows (the in-memory provider ignores unique indexes).
  private readonly string _databaseName = $"IntegrationTestDb-{Guid.NewGuid()}";

  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    builder.UseSetting("Jwt:Key", "this-is-a-fake-test-secret-key-with-enough-length-123456");
    builder.UseSetting("Jwt:Issuer", "TestIssuer");
    builder.UseSetting("Jwt:Audience", "TestAudience");

    // All test requests share one client IP, so lift limits out of the way (rate limiting has its own tests)
    builder.UseSetting("RateLimiting:AuthPermitLimit", "10000");
    builder.UseSetting("RateLimiting:EmailPermitLimit", "10000");
    builder.UseSetting("RateLimiting:GlobalPermitLimit", "10000");

    builder.ConfigureServices(services =>
    {
      // Remove the real Postgres DbContext registration
      var descriptor = services.SingleOrDefault(
        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
      if (descriptor != null)
      {
        services.Remove(descriptor);
      }

      // Replace it with the in-memory provider
      services.AddDbContext<ApplicationDbContext>(options =>
      {
        options.UseInMemoryDatabase(_databaseName);
      });
    });
  }
}
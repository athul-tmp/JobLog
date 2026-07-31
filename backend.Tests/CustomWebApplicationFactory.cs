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
  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    builder.ConfigureAppConfiguration((context, config) =>
    {
      var testConfig = new Dictionary<string, string?>
      {
        { "Jwt:Key", "this-is-a-fake-test-secret-key-with-enough-length-123456" },
        { "Jwt:Issuer", "TestIssuer" },
        { "Jwt:Audience", "TestAudience" }
      };
      config.AddInMemoryCollection(testConfig);
    });

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
        options.UseInMemoryDatabase("IntegrationTestDb");
      });
    });
  }
}
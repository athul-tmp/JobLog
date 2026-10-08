using System.Security.Cryptography;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

public interface IDemoService
{
  Task<User> CreateDemoUser();
  Task<int> DeleteExpiredDemoUsers();
}

public class DemoService : IDemoService
{
  public static readonly TimeSpan DemoLifetime = TimeSpan.FromMinutes(30);

  // Seed applications for every demo account. Dates are relative to "now" so the dashboard
  // always looks current: AppliedDaysAgo, then each later stage as days after applying.
  private record SeedStage(string Status, int DaysAfterApplied);
  private record SeedApplication(string Company, string Role, int AppliedDaysAgo, params SeedStage[] Stages);

  private static readonly SeedApplication[] SeedApplications =
  {
    new("Tesla", "Firmware Engineer", 50, new SeedStage("Ghosted", 30)),
    new("Amazon", "Cloud Solutions", 45,
        new SeedStage("Screening Interview", 3), new SeedStage("Mid-stage Interview", 7),
        new SeedStage("Final Interview", 12), new SeedStage("Offer", 18)),
    new("Netflix", "UI Designer", 40, new SeedStage("Rejected", 3)),
    new("Meta", "Product Manager", 35, new SeedStage("Screening Interview", 4), new SeedStage("Ghosted", 20)),
    new("Microsoft", "Frontend Dev", 30,
        new SeedStage("Screening Interview", 4), new SeedStage("Mid-stage Interview", 8), new SeedStage("Final Interview", 13)),
    new("Airbnb", "Backend Lead", 28,
        new SeedStage("Screening Interview", 5), new SeedStage("Mid-stage Interview", 9), new SeedStage("Rejected", 14)),
    new("Stripe", "Fullstack Engineer", 21, new SeedStage("Screening Interview", 4), new SeedStage("Mid-stage Interview", 10)),
    new("Apple", "iOS Developer", 12, new SeedStage("Screening Interview", 5)),
    new("Uber", "Data Scientist", 6),
    new("Google", "Software Engineer", 2),
  };

  public static int SeedApplicationCount => SeedApplications.Length;

  private readonly ApplicationDbContext _dbContext;

  public DemoService(ApplicationDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  // Creates a fresh, isolated demo account seeded with sample applications
  public async Task<User> CreateDemoUser()
  {
    var now = DateTime.UtcNow;

    var user = new User
    {
      Email = $"demo-{Guid.NewGuid():N}@demo.joblog.invalid",
      // Random unguessable password: demo accounts can only be entered through the demo endpoint.
      // Low work factor is fine because the secret is never stored or reused.
      PasswordHash = BCrypt.Net.BCrypt.HashPassword(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)), workFactor: 4),
      FirstName = "Demo",
      IsDemo = true,
      DemoExpiresAt = now.Add(DemoLifetime)
    };

    var applicationNo = 1;
    foreach (var seed in SeedApplications)
    {
      // Spread times of day so same-day entries don't collide
      var appliedAt = now.Date.AddDays(-seed.AppliedDaysAgo).AddHours(9 + applicationNo % 8);

      var application = new JobApplication
      {
        UserId = 0, // Set by EF through the User navigation
        User = user,
        Company = seed.Company,
        Role = seed.Role,
        Status = seed.Stages.Length > 0 ? seed.Stages[^1].Status : "Applied",
        DateApplied = appliedAt,
        ApplicationNo = applicationNo++
      };

      application.StatusHistory.Add(new JobStatusHistory { JobApplicationId = 0, Status = "Applied", ChangeDate = appliedAt });
      foreach (var stage in seed.Stages)
      {
        application.StatusHistory.Add(new JobStatusHistory
        {
          JobApplicationId = 0,
          Status = stage.Status,
          ChangeDate = appliedAt.AddDays(stage.DaysAfterApplied).AddHours(2)
        });
      }

      user.JobApplications.Add(application);
    }

    _dbContext.Users.Add(user);
    await _dbContext.SaveChangesAsync();

    return user;
  }

  // Deletes demo accounts (and their applications/history) whose session has ended
  public async Task<int> DeleteExpiredDemoUsers()
  {
    var now = DateTime.UtcNow;

    var expiredUsers = await _dbContext.Users
        .Where(u => u.IsDemo && u.DemoExpiresAt <= now)
        .Include(u => u.JobApplications)
            .ThenInclude(a => a.StatusHistory)
        .ToListAsync();

    if (expiredUsers.Count == 0)
    {
      return 0;
    }

    _dbContext.Users.RemoveRange(expiredUsers);
    await _dbContext.SaveChangesAsync();

    return expiredUsers.Count;
  }
}

// Periodically removes expired demo accounts
public class DemoCleanupService : BackgroundService
{
  private readonly IServiceScopeFactory _scopeFactory;
  private readonly ILogger<DemoCleanupService> _logger;
  private readonly TimeSpan _interval;

  public DemoCleanupService(IServiceScopeFactory scopeFactory, ILogger<DemoCleanupService> logger, IConfiguration config)
  {
    _scopeFactory = scopeFactory;
    _logger = logger;
    _interval = TimeSpan.FromMinutes(config.GetValue("Demo:CleanupIntervalMinutes", 10.0));
  }

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    using var timer = new PeriodicTimer(_interval);

    do
    {
      try
      {
        using var scope = _scopeFactory.CreateScope();
        var demoService = scope.ServiceProvider.GetRequiredService<IDemoService>();
        var deleted = await demoService.DeleteExpiredDemoUsers();

        if (deleted > 0)
        {
          _logger.LogInformation("Deleted {Count} expired demo account(s).", deleted);
        }
      }
      catch (Exception ex)
      {
        // Another replica may have deleted the same accounts; the next run catches anything left over
        _logger.LogWarning(ex, "Demo cleanup run failed.");
      }
    }
    while (await timer.WaitForNextTickAsync(stoppingToken));
  }
}

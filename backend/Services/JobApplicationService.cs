using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

public interface IJobApplicationService
{
  Task<JobApplication> CreateApplication(int userId, JobApplicationCreateRequest request);
  Task<List<JobApplication>> GetAllUserApplications(int userId);
  Task<JobApplication?> GetApplicationById(int applicationId, int userId);
  Task<JobApplication> UpdateApplication(int userId, JobApplicationUpdateRequest request);
  Task DeleteApplication(int applicationId, int userId);
}

public class JobApplicationService : IJobApplicationService
{
  private readonly ApplicationDbContext _dbContext;

  public JobApplicationService(ApplicationDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  // Create job application
  public async Task<JobApplication> CreateApplication(int userId, JobApplicationCreateRequest request)
  {
    var application = new JobApplication
    {
      UserId = userId,
      Company = request.Company,
      Role = request.Role,
      Status = request.Status,
      JobPostingURL = request.JobPostingURL,
      Notes = request.Notes,
      DateApplied = DateTime.UtcNow
    };

    _dbContext.JobApplications.Add(application);
    await _dbContext.SaveChangesAsync();

    // Log job status
    var initialHistory = new JobStatusHistory
    {
      JobApplicationId = application.Id,
      Status = application.Status,
      ChangeDate = application.DateApplied
    };
    _dbContext.JobStatusHistories.Add(initialHistory);
    await _dbContext.SaveChangesAsync();

    return application;
  }

  // Get all user's job applications
  public Task<List<JobApplication>> GetAllUserApplications(int userId)
  {
    return _dbContext.JobApplications
        .Where(a => a.UserId == userId)
        .Include(a => a.StatusHistory)
        .ToListAsync();
  }

  // Get a single application
  public Task<JobApplication?> GetApplicationById(int applicationId, int userId)
  {
    return _dbContext.JobApplications
        .Where(a => a.UserId == userId)
        .Include(a => a.StatusHistory)
        .SingleOrDefaultAsync(a => a.Id == applicationId);
  }

  // Update a job application
  public async Task<JobApplication> UpdateApplication(int userId, JobApplicationUpdateRequest request)
  {
    var application = await GetApplicationById(request.Id, userId);

    if (application == null)
    {
      throw new KeyNotFoundException("Job Application not found or does not belong to user.");
    }

    // Check if the status has changed
    var statusChanged = request.Status != null && application.Status != request.Status;

    // Update properties
    if (request.Notes != null)
    {
      application.Notes = request.Notes;
    }
    if (request.Status != null)
    {
      application.Status = request.Status;
    }

    // Log status change
    if (statusChanged)
    {
      var history = new JobStatusHistory
      {
        JobApplicationId = application.Id,
        Status = application.Status,
        ChangeDate = DateTime.UtcNow
      };
      _dbContext.JobStatusHistories.Add(history);
    }

    await _dbContext.SaveChangesAsync();
    return application;
  }

  // Delete job application
  public async Task DeleteApplication(int applicationId, int userId)
  {
    var application = await GetApplicationById(applicationId, userId);

    if (application == null)
    {
      throw new KeyNotFoundException("Job Application not found or does not belong to user.");
    }

    _dbContext.JobApplications.Remove(application);
    await _dbContext.SaveChangesAsync();
  }
}

// Used for creating a new job application
public record JobApplicationCreateRequest(
    string Company,
    string Role,
    string Status,
    string JobPostingURL,
    string? Notes
);

// Used for updating an existing job application
public record JobApplicationUpdateRequest(
    int Id,
    string? Status,
    string? Notes
);
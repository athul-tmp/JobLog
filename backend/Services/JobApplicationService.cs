using backend.Data;
using backend.Models;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;
using backend.Helpers;

public interface IJobApplicationService
{
  Task<JobApplication> CreateApplication(int userId, JobApplicationCreateRequest request);
  Task<List<JobApplicationDto>> GetAllUserApplications(int userId);
  Task<JobApplication?> GetApplicationById(int applicationId, int userId);
  Task<JobApplication> UpdateApplication(int userId, JobApplicationUpdateRequest request);
  Task DeleteAllUserApplications(int userId, string currentPassword);
  Task<JobApplication> UndoLastStatusChange(int applicationId, int userId);
}

public class JobApplicationService : IJobApplicationService
{
  private readonly ApplicationDbContext _dbContext;

  // Application stages ranking for validation
  private static readonly Dictionary<string, int> StatusRank = new()
  {
      { "Applied", 1 }, { "OA Interview", 2 }, { "Mid-stage Interview", 3 },
      { "Final Interview", 4 }, { "Offer", 5 }, { "Rejected", 6 }, { "Ghosted", 7 }
  };
  private static readonly List<string> ProgressionStates = new() { "OA Interview", "Mid-stage Interview", "Final Interview" };
  private static readonly List<string> DefinitiveEndStates = new() { "Offer", "Rejected" };

  public JobApplicationService(ApplicationDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  // Helper to map Entity to DTO 
  private JobApplicationDto MapToDto(JobApplication entity)
  {
    return new JobApplicationDto(
        entity.Id,
        entity.ApplicationNo,
        entity.Company,
        entity.Role,
        entity.Status,
        entity.JobPostingURL,
        entity.Notes,
        entity.DateApplied,
        entity.StatusHistory
            .Select(h => new JobStatusHistoryDto(h.Id, h.Status, h.ChangeDate))
            .OrderBy(h => h.ChangeDate)
            .ToList()
    );
  }

  // Create job application
  public async Task<JobApplication> CreateApplication(int userId, JobApplicationCreateRequest request)
  {
    // Calculate next application number
    var currentApplicationCount = await _dbContext.JobApplications.CountAsync(a => a.UserId == userId);

    var application = new JobApplication
    {
      UserId = userId,
      Company = request.Company,
      Role = request.Role,
      Status = "Applied",
      JobPostingURL = request.JobPostingURL,
      Notes = request.Notes,
      DateApplied = DateTime.UtcNow,
      ApplicationNo = currentApplicationCount + 1
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

    return (await GetApplicationById(application.Id, userId))!;
  }

  // Get all user's job applications
  public async Task<List<JobApplicationDto>> GetAllUserApplications(int userId)
  {
    var applications = await _dbContext.JobApplications
        .Where(a => a.UserId == userId)
        .Include(a => a.StatusHistory)
        .ToListAsync();

    return applications.Select(a => MapToDto(a)).ToList();
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

    var statusChanged = false;

    // Status validation block
    if (request.Status != null && application.Status != request.Status)
    {
      var currentStatus = application.Status;
      var newStatus = request.Status;

      if (!StatusRank.ContainsKey(newStatus))
      {
        throw new InvalidOperationException($"Invalid status value: {newStatus}.");
      }

      // Block status movement back to applied 
      if (newStatus == "Applied")
      {
        throw new InvalidOperationException("Cannot move status back to 'Applied' from any progressed stage.");
      }

      // Block status movement out of end states (Offer / Rejected)
      if (DefinitiveEndStates.Contains(currentStatus))
      {
        if (!DefinitiveEndStates.Contains(newStatus))
        {
          throw new InvalidOperationException($"Cannot move application out of definitive end state: {currentStatus}. Only transition between Offer and Rejected is allowed.");
        }
      }

      // Block backward progression within interviews
      if (ProgressionStates.Contains(currentStatus) && ProgressionStates.Contains(newStatus))
      {
        var currentRank = StatusRank[currentStatus];
        var newRank = StatusRank[newStatus];

        if (newRank < currentRank)
        {
          throw new InvalidOperationException($"Cannot move backward from {currentStatus} to {newStatus}.");
        }
      }

      statusChanged = true;
    }

    // Update all editable properties
    if (request.Company != null) application.Company = request.Company;
    if (request.Role != null) application.Role = request.Role;
    if (request.JobPostingURL != null) application.JobPostingURL = request.JobPostingURL;
    if (request.Notes != null) application.Notes = request.Notes;


    // Log status change
    if (statusChanged)
    {
      application.Status = request.Status!;

      var history = new JobStatusHistory
      {
        JobApplicationId = application.Id,
        Status = application.Status,
        ChangeDate = DateTime.UtcNow
      };
      _dbContext.JobStatusHistories.Add(history);
    }

    await _dbContext.SaveChangesAsync();

    return (await GetApplicationById(application.Id, userId))!;
  }

  // Delete all job application
  public async Task DeleteAllUserApplications(int userId, string currentPassword)
  {
    await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);

    var applications = await _dbContext.JobApplications
        .Where(a => a.UserId == userId)
        .ToListAsync();

    if (!applications.Any())
    {
      return; // Nothing to delete
    }

    var jobApplicationIds = applications.Select(a => a.Id).ToList();

    var historiesToDelete = await _dbContext.JobStatusHistories
        .Where(h => jobApplicationIds.Contains(h.JobApplicationId))
        .ToListAsync();

    _dbContext.JobStatusHistories.RemoveRange(historiesToDelete);

    // Delete parent records 
    _dbContext.JobApplications.RemoveRange(applications);

    await _dbContext.SaveChangesAsync();
  }

  // Undo a status change
  public async Task<JobApplication> UndoLastStatusChange(int applicationId, int userId)
  {
    var application = await GetApplicationById(applicationId, userId);

    if (application == null)
    {
      throw new KeyNotFoundException("Job Application not found or does not belong to user.");
    }

    var history = application.StatusHistory.OrderByDescending(h => h.ChangeDate).ToList();

    if (history.Count <= 1)
    {
      throw new InvalidOperationException("Cannot undo the status change. This is the application's initial status.");
    }

    var lastHistoryEntry = history.First();
    var precedingStatus = history.Skip(1).First().Status;

    _dbContext.JobStatusHistories.Remove(lastHistoryEntry);
    application.Status = precedingStatus;

    await _dbContext.SaveChangesAsync();

    return (await GetApplicationById(application.Id, userId))!;
  }
}

// Used for creating a new job application
public record JobApplicationCreateRequest(
    string Company,
    string Role,
    string? JobPostingURL,
    string? Notes
);

// Used for updating an existing job application
public record JobApplicationUpdateRequest(
    int Id,
    string? Company,
    string? Role,
    string? JobPostingURL,
    string? Status,
    string? Notes
);
using backend.Models;

namespace backend.DTOs
{
  public record JobApplicationDto(
      int Id,
      string Company,
      string Role,
      string Status,
      string JobPostingURL,
      string? Notes,
      DateTime DateApplied,
      List<JobStatusHistoryDto> StatusHistory
  )
  {
    
    public static JobApplicationDto FromEntity(JobApplication application)
    {
      return new JobApplicationDto(
          application.Id,
          application.Company,
          application.Role,
          application.Status,
          application.JobPostingURL,
          application.Notes,
          application.DateApplied,
          application.StatusHistory
              .Select(h => new JobStatusHistoryDto(h.Id, h.Status, h.ChangeDate))
              .ToList()
      );
    }
  }
}
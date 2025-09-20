namespace backend.Models
{
  public class JobApplication
  {
    public int Id { get; set; }
    public required string Company { get; set; }
    public required string Role { get; set; }
    public required string Status { get; set; }
    public required string JobPostingURL { get; set; }
    public string? Notes { get; set; }
    public required DateTime DateApplied { get; set; }
    public required int UserId { get; set; }
    public required User User { get; set; }
    public ICollection<JobStatusHistory> StatusHistory { get; set; } = new List<JobStatusHistory>();
  }
}
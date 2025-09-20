namespace backend.Models
{
  public class User
  {
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
  }
}
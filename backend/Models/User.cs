namespace backend.Models
{
  public class User
  {
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FirstName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? PasswordResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
  }
}
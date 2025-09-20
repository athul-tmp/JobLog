namespace backend.Models
{
  public class JobStatusHistory
  {
    public int Id { get; set; }
    public required string Status { get; set; }
    public DateTime ChangeDate { get; set; } = DateTime.UtcNow;
    public required int JobApplicationId { get; set; }
    public required JobApplication JobApplication { get; set; }
  }
}
namespace backend.Models
{
  public class EmailVerification
  {
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string Token { get; set; }
    public DateTime ExpiryDate { get; set; } = DateTime.UtcNow.AddHours(1);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  }
}
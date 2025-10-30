using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
  public class ApplicationDbContext : DbContext
  {
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<JobApplication> JobApplications { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<JobStatusHistory> JobStatusHistories { get; set; }
    public DbSet<EmailVerification> EmailVerifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      modelBuilder.Entity<JobApplication>()
          .HasOne(j => j.User)
          .WithMany(u => u.JobApplications)
          .HasForeignKey(j => j.UserId);

      modelBuilder.Entity<JobStatusHistory>()
          .HasOne(h => h.JobApplication)
          .WithMany(j => j.StatusHistory)
          .HasForeignKey(h => h.JobApplicationId)
          .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<EmailVerification>()
          .HasOne(ev => ev.User)
          .WithMany()
          .HasForeignKey(ev => ev.UserId)
          .IsRequired(false)
          .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
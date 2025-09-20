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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      modelBuilder.Entity<JobApplication>()
          .HasOne(j => j.User)
          .WithMany(u => u.JobApplications)
          .HasForeignKey(j => j.UserId);

      modelBuilder.Entity<JobStatusHistory>()
          .HasOne(h => h.JobApplication)
          .WithMany(j => j.StatusHistory)
          .HasForeignKey(h => h.JobApplicationId);
    }
  }
}
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using backend.Helpers;

public interface IUserService
{
  Task<User?> GetUserByEmail(string email);
  Task<User> RegisterUser(string email, string password, string firstName);
  Task<User?> AuthenticateUser(string email, string password);
  Task UpdateUserName(int userId, string currentPassword, string newFirstName);
  Task UpdateUserEmail(int userId, string currentPassword, string newEmail);
  Task UpdateUserPassword(int userId, string currentPassword, string newPassword);
  Task DeleteUser(int userId, string currentPassword);
  Task VerifyUserPassword(int userId, string currentPassword);
}

public class UserService : IUserService
{
  private readonly ApplicationDbContext _dbContext;

  public UserService(ApplicationDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  // Get user
  public Task<User?> GetUserByEmail(string email)
  {
    return _dbContext.Users.SingleOrDefaultAsync(u => u.Email == email);
  }

  // Register a user
  public async Task<User> RegisterUser(string email, string password, string firstName)
  {
    // Check for duplicate 
    if (await GetUserByEmail(email) != null)
    {
      throw new InvalidOperationException("Email address is already in use.");
    }

    // Hash the password 
    var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

    // Create the new User 
    var user = new User
    {
      Email = email,
      PasswordHash = passwordHash,
      FirstName = firstName
    };

    // Save to the database
    _dbContext.Users.Add(user);
    await _dbContext.SaveChangesAsync();
    return user;
  }

  // Authentication
  public async Task<User?> AuthenticateUser(string email, string password)
  {
    var user = await GetUserByEmail(email);

    // Check if user exists
    if (user == null)
    {
      return null;
    }

    // Verify the password against the stored hash
    if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
    {
      return null; // Authentication fail
    }

    return user; // Authentication success
  }

  // Update User Name
  public async Task UpdateUserName(int userId, string currentPassword, string newFirstName)
  {
    var user = await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);

    user.FirstName = newFirstName;

    _dbContext.Users.Update(user);
    await _dbContext.SaveChangesAsync();
  }

  // Update User Email
  public async Task UpdateUserEmail(int userId, string currentPassword, string newEmail)
  {
    var user = await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);

    // Check if new email is already in use
    if (await _dbContext.Users.AnyAsync(u => u.Email == newEmail && u.Id != userId))
    {
      throw new InvalidOperationException("This email is already in use by another account.");
    }

    user.Email = newEmail;

    _dbContext.Users.Update(user);
    await _dbContext.SaveChangesAsync();
  }

  // Update User Password
  public async Task UpdateUserPassword(int userId, string currentPassword, string newPassword)
  {
    var user = await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);

    // Re-hash the new password
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

    _dbContext.Users.Update(user);
    await _dbContext.SaveChangesAsync();
  }

  // Delete User Account
  public async Task DeleteUser(int userId, string currentPassword)
  {
    var user = await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);

    // Delete all JobStatusHistory records
    var jobApplicationIds = await _dbContext.JobApplications
                                            .Where(ja => ja.UserId == userId)
                                            .Select(ja => ja.Id)
                                            .ToListAsync();

    if (jobApplicationIds.Any())
    {
      var historiesToDelete = await _dbContext.JobStatusHistories
                                              .Where(h => jobApplicationIds.Contains(h.JobApplicationId))
                                              .ToListAsync();
      _dbContext.JobStatusHistories.RemoveRange(historiesToDelete);
    }

    // Delete all JobApplication records
    var applicationsToDelete = await _dbContext.JobApplications
                                               .Where(ja => ja.UserId == userId)
                                               .ToListAsync();
    _dbContext.JobApplications.RemoveRange(applicationsToDelete);

    // Remove the user 
    _dbContext.Users.Remove(user);

    // Save all changes
    await _dbContext.SaveChangesAsync();
  }

  // To Verify Password
  public async Task VerifyUserPassword(int userId, string currentPassword)
  {
    await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);
  }

}
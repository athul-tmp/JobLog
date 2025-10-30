using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using backend.Helpers;
using System.Security.Cryptography;

public interface IUserService
{
  Task<User?> GetUserByEmail(string email);
  Task<User?> AuthenticateUser(string email, string password);
  Task UpdateUserName(int userId, string currentPassword, string newFirstName);
  Task InitiateEmailChange(int userId, string currentPassword, string newEmail);
  Task<string> CompleteEmailChange(int userId, string token);
  Task UpdateUserPassword(int userId, string currentPassword, string newPassword);
  Task DeleteUser(int userId, string currentPassword);
  Task VerifyUserPassword(int userId, string currentPassword);
  Task ForgotPassword(string email);
  Task ResetPassword(string email, string token, string newPassword);
  Task InitiateRegistration(string email);
  Task<User> CompleteRegistration(string email, string token, string firstName, string password);
}

public class UserService : IUserService
{
  private readonly ApplicationDbContext _dbContext;
  private readonly IEmailService _emailService;
  private readonly IConfiguration _config;

  public UserService(ApplicationDbContext dbContext, IEmailService emailService, IConfiguration config)
  {
    _dbContext = dbContext;
    _emailService = emailService;
    _config = config;
  }

  // Get user
  public Task<User?> GetUserByEmail(string email)
  {
    return _dbContext.Users.SingleOrDefaultAsync(u => u.Email == email);
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

  // To handle forgot password request
  public async Task ForgotPassword(string email)
  {
    var user = await GetUserByEmail(email);

    if (user == null)
    {
      return;
    }

    // Generate a secure and short-lived token
    var tokenBytes = RandomNumberGenerator.GetBytes(32);
    var token = Convert.ToBase64String(tokenBytes);

    // Hash and store the token
    var hashedToken = BCrypt.Net.BCrypt.HashPassword(token);

    // Token expires in 1 hour
    var expiry = DateTime.UtcNow.AddHours(1);

    user.PasswordResetToken = hashedToken;
    user.ResetTokenExpires = expiry;

    await _dbContext.SaveChangesAsync();

    // Reset link for the frontend
    var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:3000"; // Fallback to local
    var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

    // Send the email
    await _emailService.SendPasswordResetEmail(user.Email, user.FirstName, resetLink);
  }

  // To handle password reset
  public async Task ResetPassword(string email, string token, string newPassword)
  {
    var user = await GetUserByEmail(email);

    // Basic checks
    if (user == null || user.PasswordResetToken == null || user.ResetTokenExpires == null)
    {
      throw new InvalidOperationException("Invalid or expired reset request.");
    }

    // Check token expiration
    if (user.ResetTokenExpires.Value < DateTime.UtcNow)
    {
      throw new InvalidOperationException("The password reset link has expired.");
    }

    // Verify the provided token against the stored hash
    if (!BCrypt.Net.BCrypt.Verify(token, user.PasswordResetToken))
    {
      throw new UnauthorizedAccessException("Invalid password reset token.");
    }

    // Reset password
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

    // Clear the reset token to prevent reuse
    user.PasswordResetToken = null;
    user.ResetTokenExpires = null;

    _dbContext.Users.Update(user);
    await _dbContext.SaveChangesAsync();
  }

  // Initiate Registration
  public async Task InitiateRegistration(string email)
  {
    if (await GetUserByEmail(email) != null)
    {
      throw new InvalidOperationException("Email address is already registered. Please log in.");
    }
    // Clean old tokens for this email
    _dbContext.EmailVerifications.RemoveRange(_dbContext.EmailVerifications.Where(v => v.Email == email));

    // Generate token
    var tokenBytes = RandomNumberGenerator.GetBytes(32);
    var rawToken = Convert.ToBase64String(tokenBytes);
    var hashedToken = BCrypt.Net.BCrypt.HashPassword(rawToken);

    var verificationRecord = new EmailVerification
    {
      Email = email,
      Token = hashedToken,
      ExpiryDate = DateTime.UtcNow.AddHours(1),
      Purpose = "Registration",
      UserId = null
    };

    _dbContext.EmailVerifications.Add(verificationRecord);
    await _dbContext.SaveChangesAsync();

    // Create the final verification link
    var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:3000";
    var verificationLink = $"{frontendUrl}/complete-registration?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(rawToken)}";

    await _emailService.SendVerificationEmail(email, verificationLink);
  }

  // Complete Registration
  public async Task<User> CompleteRegistration(string email, string token, string firstName, string password)
  {
    var record = await _dbContext.EmailVerifications
      .SingleOrDefaultAsync(v => v.Email == email && v.Purpose == "Registration");

    // Validation checks
    if (record == null || record.ExpiryDate < DateTime.UtcNow)
    {
      if (record != null) _dbContext.EmailVerifications.Remove(record);
      throw new InvalidOperationException("Verification link is invalid or has expired.");
    }

    if (!BCrypt.Net.BCrypt.Verify(token, record.Token))
    {
      throw new UnauthorizedAccessException("Invalid verification token.");
    }

    // Everything is valid then create the user
    var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);
    var newUser = new User
    {
      Email = email,
      PasswordHash = passwordHash,
      FirstName = firstName,
      CreatedAt = DateTime.UtcNow
    };

    _dbContext.Users.Add(newUser);
    _dbContext.EmailVerifications.Remove(record);

    await _dbContext.SaveChangesAsync();
    return newUser;
  }

  // Initiate Email Change
  public async Task InitiateEmailChange(int userId, string currentPassword, string newEmail)
  {
    var user = await UserValidationHelper.GetAndValidateUser(_dbContext, userId, currentPassword);

    // Check if the new email is already in use
    if (await _dbContext.Users.AnyAsync(u => u.Email == newEmail && u.Id != userId))
    {
      throw new InvalidOperationException("This email is already in use by another account.");
    }

    // Clear any existing pending email change verifications for this user
    var existingVerifications = await _dbContext.EmailVerifications
        .Where(ev => ev.UserId == userId && ev.Purpose == "EmailChange")
        .ToListAsync();

    _dbContext.EmailVerifications.RemoveRange(existingVerifications);

    // Generate and hash the token
    var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    var hashedToken = BCrypt.Net.BCrypt.HashPassword(rawToken);

    // Create and save the new verification record
    var verification = new EmailVerification
    {
      UserId = userId,
      Email = newEmail,
      Token = hashedToken,
      ExpiryDate = DateTime.UtcNow.AddHours(1),
      Purpose = "EmailChange"
    };

    _dbContext.EmailVerifications.Add(verification);
    await _dbContext.SaveChangesAsync();

    // Send the verification email to the new email
    var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:3000";
    var verificationLink = $"{frontendUrl}/verify-email-change?userId={userId}&token={Uri.EscapeDataString(rawToken)}";

    await _emailService.SendEmailChangeVerification(newEmail, verificationLink);
  }

  // Complete Email Change
  public async Task<string> CompleteEmailChange(int userId, string token)
  {
    // Find the verification record for this user and purpose
    var verification = await _dbContext.EmailVerifications
        .Where(ev => ev.UserId == userId && ev.Purpose == "EmailChange")
        .OrderByDescending(ev => ev.CreatedAt)
        .FirstOrDefaultAsync();

    if (verification == null)
    {
      throw new InvalidOperationException("Invalid or incomplete email change request. Please restart the process.");
    }

    if (verification.ExpiryDate < DateTime.UtcNow)
    {
      _dbContext.EmailVerifications.Remove(verification);
      await _dbContext.SaveChangesAsync();
      throw new InvalidOperationException("The email change verification link has expired.");
    }

    if (!BCrypt.Net.BCrypt.Verify(token, verification.Token))
    {
      _dbContext.EmailVerifications.Remove(verification);
      await _dbContext.SaveChangesAsync();
      throw new UnauthorizedAccessException("Invalid email change verification token.");
    }

    var user = await _dbContext.Users.FindAsync(userId);
    if (user == null)
    {
      throw new Exception("User account not found during completion.");
    }

    var oldEmail = user.Email;
    var newEmail = verification.Email;

    user.Email = newEmail;

    // Clean up and save changes
    _dbContext.Users.Update(user);
    _dbContext.EmailVerifications.Remove(verification);
    await _dbContext.SaveChangesAsync();

    // Send notification to the old email address
    await _emailService.SendEmailChangeNotification(oldEmail, newEmail);

    return oldEmail;
  }
}
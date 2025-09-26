using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

public interface IUserService
{
  Task<User?> GetUserByEmail(string email);
  Task<User> RegisterUser(string email, string password);
  Task<User?> AuthenticateUser(string email, string password);
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
  public async Task<User> RegisterUser(string email, string password)
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
      PasswordHash = passwordHash
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
}
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace backend.Helpers
{
  public static class UserValidationHelper
  {
    public static async Task<User> GetAndValidateUser(
        ApplicationDbContext dbContext,
        int userId,
        string currentPassword)
    {
      var user = await dbContext.Users.FindAsync(userId);

      if (user == null)
      {
        // This shouldn't happen if the JWT is valid
        throw new KeyNotFoundException("User not found.");
      }

      // Check if the provided password matches the stored hash
      if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
      {
        throw new UnauthorizedAccessException("Invalid current password provided.");
      }

      return user;
    }
  }
}
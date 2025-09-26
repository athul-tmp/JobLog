using System.Text.RegularExpressions;

public static class ValidationHelper
{
  // Regex for a strong password:
  // (?=.*?[A-Z])         - At least one uppercase letter
  // (?=.*?[a-z])         - At least one lowercase letter
  // (?=.*?[0-9])         - At least one digit 
  // (?=.*?[#?!@$%^&*-])  - At least one special character
  // .{8,}                - Minimum length of 8 characters (of any type)
  private const string StrongPasswordPattern = @"^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$";

  // Regex for email format
  private const string EmailPattern = @"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$";

  public static bool IsStrongPassword(string password)
  {
    return Regex.IsMatch(password, StrongPasswordPattern);
  }

  public static bool IsValidEmailFormat(string email)
  {
    return Regex.IsMatch(email, EmailPattern);
  }
}
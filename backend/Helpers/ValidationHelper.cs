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

  // Field length limits
  public const int MaxFirstNameLength = 100;
  public const int MaxCompanyLength = 200;
  public const int MaxRoleLength = 200;
  public const int MaxUrlLength = 2048;
  public const int MaxNotesLength = 5000;

  public static bool IsStrongPassword(string password)
  {
    return Regex.IsMatch(password, StrongPasswordPattern);
  }

  public static bool IsValidEmailFormat(string email)
  {
    return Regex.IsMatch(email, EmailPattern);
  }

  // Only absolute http(s) URLs, so links can't carry javascript: or data: payloads
  public static bool IsValidJobPostingUrl(string? url)
  {
    if (string.IsNullOrWhiteSpace(url))
    {
      return true; // Optional field
    }

    return url.Length <= MaxUrlLength
      && Uri.TryCreate(url, UriKind.Absolute, out var uri)
      && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
  }

  // Returns an error message if any job application field is invalid, otherwise null
  public static string? ValidateJobApplicationFields(string? company, string? role, string? url, string? notes)
  {
    if (company != null && company.Length > MaxCompanyLength)
    {
      return $"Company must be {MaxCompanyLength} characters or fewer.";
    }
    if (role != null && role.Length > MaxRoleLength)
    {
      return $"Role must be {MaxRoleLength} characters or fewer.";
    }
    if (!IsValidJobPostingUrl(url))
    {
      return $"Job posting URL must be a valid http(s) link of {MaxUrlLength} characters or fewer.";
    }
    if (notes != null && notes.Length > MaxNotesLength)
    {
      return $"Notes must be {MaxNotesLength} characters or fewer.";
    }
    return null;
  }
}
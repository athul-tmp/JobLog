using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

using static ValidationHelper;
using System.Security.Claims;
using backend.Helpers;

[ApiController]
[Route("api/[controller]")] // Route: /api/User
public class UserController : ControllerBase
{
  private readonly IUserService _userService;
  private readonly ITokenService _tokenService;
  private readonly IJobApplicationService _jobApplicationService;

  public UserController(IUserService userService, ITokenService tokenService, IJobApplicationService jobApplicationService)
  {
    _userService = userService;
    _tokenService = tokenService;
    _jobApplicationService = jobApplicationService;
  }

  // Helper to set the JWT in an HttpOnly cookie
  private void SetAuthCookie(string token, DateTime? expiryTime = null)
  {
    var cookieOptions = new CookieOptions
    {
      HttpOnly = true,
      Secure = false,   // IMPORTANT: true for production (https), false for local (http)
      SameSite = SameSiteMode.Strict,
      Expires = expiryTime ?? DateTime.UtcNow.AddDays(7)
    };

    Response.Cookies.Append("joblog_jwt_token", token, cookieOptions);
  }

  // Helper to clear the auth cookie
  private void ClearAuthCookie()
  {
    Response.Cookies.Delete("joblog_jwt_token");
  }

  // Helper to get User ID
  private int GetUserId()
  {
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

    if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
    {
      throw new UnauthorizedAccessException("User ID claim is missing or invalid.");
    }
    return userId;
  }

  // Registration Endpoint | Route: POST /api/User/register
  [HttpPost("register")]
  public async Task<IActionResult> RegisterUser([FromBody] UserRegistrationRequest request)
  {
    // Input validations
    // Check for empty
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FirstName))
    {
      return BadRequest(new { message = "First name, email and password are required." });
    }

    // Password validation
    if (!IsStrongPassword(request.Password))
    {
      return BadRequest(new
      {
        message = "Password does not meet the strength requirements.",
        details = "Must be at least 8 characters, include uppercase, lowercase, a number, and a special character."
      });
    }

    // Email validation
    if (!IsValidEmailFormat(request.Email))
    {
      return BadRequest(new { message = "Email format is invalid." });
    }

    // Save user 
    try
    {
      await _userService.RegisterUser(request.Email, request.Password, request.FirstName);

      return CreatedAtAction(nameof(RegisterUser), new
      {
        message = "Registration successful. Please log in."
      });
    }
    catch (InvalidOperationException ex)
    {
      // "Email already in use" exception
      return Conflict(new { message = ex.Message });
    }
  }

  // Login Endpoint | Route: POST /api/User/login
  [HttpPost("login")]
  public async Task<IActionResult> LoginUser([FromBody] UserLoginRequest request)
  {
    // Input validation
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
      return BadRequest(new { message = "Email and password are required." });
    }

    // Email validation
    if (!IsValidEmailFormat(request.Email))
    {
      return BadRequest(new { message = "Email format is invalid." });
    }

    var user = await _userService.AuthenticateUser(request.Email, request.Password);

    if (user == null)
    {
      // Authentication failed
      return Unauthorized(new { message = "Invalid email or password." });
    }

    // Demo account reset
    const string DEMO_EMAIL = "demo@joblog.com";
    var isDemoUser = user.Email.Equals(DEMO_EMAIL, StringComparison.OrdinalIgnoreCase);

    // Calculate Expiration Time
    DateTime tokenExpiryTime = isDemoUser
        ? DateTime.UtcNow.AddMinutes(30) // 30 minutes
        : DateTime.UtcNow.AddDays(7);   // 7 days

    if (isDemoUser)
    {
      await _jobApplicationService.ResetDemoApplications(user.Id);
    }

    // JWT 
    var token = _tokenService.CreateToken(user);

    // Set the JWT as an HttpOnly cookie
    SetAuthCookie(token);

    return Ok(new
    {
      message = "Login successful",
      email = user.Email,
      firstName = user.FirstName,
      // Return ISO 8601 string for frontend countdown only if it's the demo user
      tokenExpiration = isDemoUser ? tokenExpiryTime.ToString("o") : null
    });
  }

  // Logout Endpoint | Route: POST /api/User/logout
  [HttpPost("logout")]
  public IActionResult Logout()
  {
    // Clear the JWT cookie
    ClearAuthCookie();

    return Ok(new { message = "Logout successful. Cookie cleared." });
  }

  // Update User Name | Route: PUT /api/User/updateName
  [Authorize]
  [HttpPut("updateName")]
  public async Task<IActionResult> UpdateName([FromBody] UpdateNameRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.NewFirstName) || string.IsNullOrWhiteSpace(request.CurrentPassword))
    {
      return BadRequest(new { message = "New First Name and Current Password are required." });
    }

    try
    {
      var userId = GetUserId();
      await _userService.UpdateUserName(userId, request.CurrentPassword, request.NewFirstName);

      return Ok(new { message = "First name updated successfully. Please refresh the page." });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid current password." });
    }
    catch (KeyNotFoundException)
    {
      return NotFound(new { message = "User not found." });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while updating the name." });
    }
  }

  // Update User Email | Route: PUT /api/User/updateEmail
  [Authorize]
  [HttpPut("updateEmail")]
  public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.NewEmail) || string.IsNullOrWhiteSpace(request.CurrentPassword))
    {
      return BadRequest(new { message = "New Email and Current Password are required." });
    }
    if (!IsValidEmailFormat(request.NewEmail))
    {
      return BadRequest(new { message = "New email format is invalid." });
    }

    try
    {
      var userId = GetUserId();
      await _userService.UpdateUserEmail(userId, request.CurrentPassword, request.NewEmail);

      return Ok(new { message = "Email updated successfully. You will be logged out to re-authenticate." });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid current password." });
    }
    catch (InvalidOperationException ex)
    {
      return Conflict(new { message = ex.Message }); // e.g., "Email already in use"
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while updating the email." });
    }
  }

  // Update User Password | Route: PUT /api/User/updatePassword
  [Authorize]
  [HttpPut("updatePassword")]
  public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.NewPassword) || string.IsNullOrWhiteSpace(request.CurrentPassword))
    {
      return BadRequest(new { message = "New Password and Current Password are required." });
    }
    if (!IsStrongPassword(request.NewPassword))
    {
      return BadRequest(new { message = "New password does not meet strength requirements." });
    }

    try
    {
      var userId = GetUserId();
      await _userService.UpdateUserPassword(userId, request.CurrentPassword, request.NewPassword);

      // Clear the auth cookie to force re-login
      ClearAuthCookie();

      return Ok(new { message = "Password updated successfully. Session cleared." });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid current password." });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while updating the password." });
    }
  }

  // Delete Account | Route: DELETE /api/User/delete
  [Authorize]
  [HttpDelete("delete")]
  public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.CurrentPassword))
    {
      return BadRequest(new { message = "Current Password is required for account deletion." });
    }

    try
    {
      var userId = GetUserId();
      await _userService.DeleteUser(userId, request.CurrentPassword);

      // Clear the auth cookie after deletion
      ClearAuthCookie();

      return Ok(new { message = "Account successfully deleted. You have been logged out." });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid current password." });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred during account deletion." });
    }
  }

  // Verify current password | Route: POST /api/User/verifyPassword
  [Authorize]
  [HttpPost("verifyPassword")]
  public async Task<IActionResult> VerifyPassword([FromBody] VerifyPasswordRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.CurrentPassword))
    {
      return BadRequest(new { message = "Current password is required." });
    }

    try
    {
      var userId = GetUserId();
      await _userService.VerifyUserPassword(userId, request.CurrentPassword);

      return Ok(new { message = "Password successfully verified." });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid current password." });
    }
    catch (KeyNotFoundException)
    {
      return NotFound(new { message = "User not found." });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred during verification." });
    }
  }
}

public record UserRegistrationRequest(string FirstName, string Email, string Password);
public record UserLoginRequest(string Email, string Password);
public record UpdateNameRequest(string CurrentPassword, string NewFirstName);
public record UpdateEmailRequest(string CurrentPassword, string NewEmail);
public record UpdatePasswordRequest(string CurrentPassword, string NewPassword);
public record DeleteAccountRequest(string CurrentPassword);
public record VerifyPasswordRequest(string CurrentPassword);
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

using static ValidationHelper;
using System.Security.Claims;
using backend.Helpers;
using Microsoft.Extensions.Hosting;

[ApiController]
[Route("api/[controller]")] // Route: /api/User
public class UserController : ControllerBase
{
  private readonly IUserService _userService;
  private readonly ITokenService _tokenService;
  private readonly IJobApplicationService _jobApplicationService;
  private readonly IHostEnvironment _env;

  public UserController(IUserService userService, ITokenService tokenService, IJobApplicationService jobApplicationService, IHostEnvironment env)
  {
    _userService = userService;
    _tokenService = tokenService;
    _jobApplicationService = jobApplicationService;
    _env = env;
  }

  // Helper to set the JWT in an HttpOnly cookie
  private void SetAuthCookie(string token, DateTime? expiryTime = null)
  {
    bool isDevelopment = _env.IsDevelopment();
    var cookieOptions = new CookieOptions
    {
      HttpOnly = true,
      Secure = !isDevelopment,
      SameSite = isDevelopment ? SameSiteMode.Strict : SameSiteMode.None,
      Expires = expiryTime ?? DateTimeOffset.UtcNow.AddDays(7),
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
    SetAuthCookie(token, tokenExpiryTime);

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

  // Initiate email change | ROUTE: POST /api/User/inititate-email-change
  [Authorize]
  [HttpPost("initiate-email-change")]
  public async Task<IActionResult> InitiateEmailChange([FromBody] InitiateEmailChangeRequest request)
  {
    if (!IsValidEmailFormat(request.NewEmail))
    {
      return BadRequest(new { message = "New email format is invalid." });
    }

    try
    {
      var userId = GetUserId();
      await _userService.InitiateEmailChange(userId, request.CurrentPassword, request.NewEmail);

      return Ok(new
      {
        message = $"A verification link has been sent to {request.NewEmail}. Please check your inbox to confirm the change."
      });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid current password provided." });
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An unexpected error occurred while initiating the email change." });
    }
  }

  // Complete email change | ROUTE: POST /api/User/complete-email-change
  [HttpPost("complete-email-change")]
  [AllowAnonymous]
  public async Task<IActionResult> CompleteEmailChange([FromBody] CompleteEmailChangeRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Token) || request.UserId <= 0)
    {
      return BadRequest(new { message = "User ID and token are required." });
    }

    try
    {
      var oldEmail = await _userService.CompleteEmailChange(request.UserId, request.Token);

      ClearAuthCookie();

      return Ok(new
      {
        message = "Email successfully changed. You must log in again with your new email.",
        oldEmail = oldEmail
      });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid email change verification token." });
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An unexpected error occurred during email change confirmation." });
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

  // Forgot Password Endpoint | Route: POST /api/User/forgotPassword
  [HttpPost("forgotPassword")]
  [AllowAnonymous]
  public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Email))
    {
      return BadRequest(new { message = "Email is required." });
    }

    if (!IsValidEmailFormat(request.Email))
    {
      return BadRequest(new { message = "Email format is invalid." });
    }

    try
    {
      await _userService.ForgotPassword(request.Email);

      return Ok(new
      {
        message = "If an account exists for this email, a password reset link has been sent."
      });
    }
    catch (Exception)
    {
      return Ok(new
      {
        message = "If an account exists for this email, a password reset link has been sent."
      });
    }
  }

  // Reset Password Endpoint | Route: POST /api/User/resetPassword
  [HttpPost("resetPassword")]
  [AllowAnonymous]
  public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
    {
      return BadRequest(new { message = "Email, token, and new password are required." });
    }

    // Password strength validation
    if (!IsStrongPassword(request.NewPassword))
    {
      return BadRequest(new
      {
        message = "Password does not meet the strength requirements.",
        details = "Must be at least 8 characters, include uppercase, lowercase, a number, and a special character."
      });
    }

    try
    {
      await _userService.ResetPassword(request.Email, request.Token, request.NewPassword);

      return Ok(new { message = "Password successfully reset. You can now log in." });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid or expired reset token." });
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while resetting the password." });
    }
  }

  // Initiate registration Endpoint | Route: POST /api/User/initiate-registration
  [HttpPost("initiate-registration")]
  [AllowAnonymous]
  public async Task<IActionResult> InitiateRegistration([FromBody] InitiateRegistrationRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Email) || !IsValidEmailFormat(request.Email))
    {
      return BadRequest(new { message = "Valid email is required." });
    }

    try
    {
      await _userService.InitiateRegistration(request.Email);

      return Ok(new
      {
        message = "A verification link has been sent to your email. Please check your inbox to continue registration."
      });
    }
    catch (InvalidOperationException ex)
    {
      return Ok(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while initiating registration." });
    }
  }

  // Complete registration Endpoint | Route: POST /api/User/complete-registration
  [HttpPost("complete-registration")]
  [AllowAnonymous]
  public async Task<IActionResult> CompleteRegistration([FromBody] CompleteRegistrationRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) ||
        string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.Password))
    {
      return BadRequest(new { message = "All fields are required." });
    }

    if (!IsStrongPassword(request.Password))
    {
      return BadRequest(new
      {
        message = "Password does not meet the strength requirements.",
      });
    }

    try
    {
      await _userService.CompleteRegistration(request.Email, request.Token, request.FirstName, request.Password);

      return CreatedAtAction(nameof(CompleteRegistration), new
      {
        message = "Registration successful! You can now log in."
      });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized(new { message = "Invalid or expired verification token." });
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An unexpected error occurred during final registration." });
    }
  }
}

public record UserLoginRequest(string Email, string Password);
public record UpdateNameRequest(string CurrentPassword, string NewFirstName);
public record UpdateEmailRequest(string CurrentPassword, string NewEmail);
public record UpdatePasswordRequest(string CurrentPassword, string NewPassword);
public record DeleteAccountRequest(string CurrentPassword);
public record VerifyPasswordRequest(string CurrentPassword);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record InitiateRegistrationRequest(string Email);
public record CompleteRegistrationRequest(string Email, string Token, string FirstName, string Password);
public record InitiateEmailChangeRequest(string CurrentPassword, string NewEmail);
public record CompleteEmailChangeRequest(int UserId, string Token);
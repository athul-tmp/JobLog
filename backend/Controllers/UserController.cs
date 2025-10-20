using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

using static ValidationHelper;

[ApiController]
[Route("api/[controller]")] // Route: /api/User
public class UserController : ControllerBase
{
  private readonly IUserService _userService;
  private readonly ITokenService _tokenService;

  public UserController(IUserService userService, ITokenService tokenService)
  {
    _userService = userService;
    _tokenService = tokenService;
  }

  // Helper to set the JWT in an HttpOnly cookie
  private void SetAuthCookie(string token)
  {
    var cookieOptions = new CookieOptions
    {
      HttpOnly = true,
      Secure = false,   // IMPORTANT: true for production (https), false for local (http)
      SameSite = SameSiteMode.Strict,
      Expires = DateTime.UtcNow.AddDays(7)
    };

    Response.Cookies.Append("joblog_jwt_token", token, cookieOptions);
  }

  // Helper to clear the auth cookie
  private void ClearAuthCookie()
  {
    Response.Cookies.Delete("joblog_jwt_token");
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

    // JWT 
    var token = _tokenService.CreateToken(user);

    // Set the JWT as an HttpOnly cookie
    SetAuthCookie(token);

    return Ok(new
    {
      message = "Login successful",
      email = user.Email,
      firstName = user.FirstName,
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
}

public record UserRegistrationRequest(string FirstName, string Email, string Password);
public record UserLoginRequest(string Email, string Password);
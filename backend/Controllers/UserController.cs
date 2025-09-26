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

  // Registration Endpoint | Route: POST /api/User/register
  [HttpPost("register")]
  public async Task<IActionResult> RegisterUser([FromBody] UserRegistrationRequest request)
  {
    // Input validations
    // Check for empty
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
      return BadRequest(new { message = "Email and password are required." });
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
      var user = await _userService.RegisterUser(request.Email, request.Password);

      return CreatedAtAction(nameof(RegisterUser), new
      {
        userId = user.Id,
        email = user.Email
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

    return Ok(new
    {
      message = "Login successful",
      userId = user.Id,
      token = token
    });
  }
}

public record UserRegistrationRequest(string Email, string Password);
public record UserLoginRequest(string Email, string Password);
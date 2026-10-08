using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using backend.Helpers;

[ApiController]
[Route("api/[controller]")] // Route: /api/Demo
public class DemoController : ControllerBase
{
  private readonly IDemoService _demoService;
  private readonly ITokenService _tokenService;
  private readonly IHostEnvironment _env;

  public DemoController(IDemoService demoService, ITokenService tokenService, IHostEnvironment env)
  {
    _demoService = demoService;
    _tokenService = tokenService;
    _env = env;
  }

  // Start a private demo session | Route: POST /api/Demo/start
  [HttpPost("start")]
  [AllowAnonymous]
  [EnableRateLimiting(RateLimitPolicies.Demo)]
  public async Task<IActionResult> StartDemo()
  {
    try
    {
      var user = await _demoService.CreateDemoUser();
      var tokenResult = _tokenService.CreateToken(user);

      AuthSessionHelper.SetAuthCookie(Response, tokenResult.Token, tokenResult.Expiry, _env.IsDevelopment());

      return Ok(new
      {
        message = "Demo session started",
        email = user.Email,
        firstName = user.FirstName,
        token = tokenResult.Token,
        tokenExpiration = tokenResult.Expiry.ToString("o"),
        isDemo = true
      });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "Could not start a demo session. Please try again." });
    }
  }
}

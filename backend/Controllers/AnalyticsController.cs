using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
  private readonly IAnalyticsService _analyticsService;

  public AnalyticsController(IAnalyticsService analyticsService)
  {
    _analyticsService = analyticsService;
  }

  // Get user ID from JWT
  private int GetUserId()
  {
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

    if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
    {
      throw new UnauthorizedAccessException("User ID claim is missing or invalid.");
    }
    return userId;
  }

  // GET /api/Analytics/summary
  [HttpGet("summary")]
  public async Task<IActionResult> GetSummaryStats()
  {
    try
    {
      var userId = GetUserId();
      var stats = await _analyticsService.GetDashboardAnalytics(userId);

      return Ok(stats);
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while calculating analytics." });
    }
  }
}
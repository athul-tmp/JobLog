using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize] // JWT Auth
[ApiController]
[Route("api/[controller]")] // Route: /api/JobApplication
public class JobApplicationController : ControllerBase
{
  private readonly IJobApplicationService _jobApplicationService;

  public JobApplicationController(IJobApplicationService jobApplicationService)
  {
    _jobApplicationService = jobApplicationService;
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

  // Get all job applications | Route: GET /api/JobApplication
  [HttpGet]
  public async Task<IActionResult> GetAllUserApplications()
  {
    try
    {
      var userId = GetUserId();
      var applications = await _jobApplicationService.GetAllUserApplications(userId);

      return Ok(applications);
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while retrieving applications." });
    }
  }

  // Create job application | Route: POST /api/JobApplication
  [HttpPost]
  public async Task<IActionResult> CreateApplication([FromBody] JobApplicationCreateRequest request)
  {
    // Input validation to check for missing required fields
    if (string.IsNullOrWhiteSpace(request.Company) || string.IsNullOrWhiteSpace(request.Role))
    {
      return BadRequest(new { message = "Company and Role are required fields." });
    }

    try
    {
      var userId = GetUserId();
      var newApplication = await _jobApplicationService.CreateApplication(userId, request);

      return CreatedAtAction(nameof(GetAllUserApplications), new { id = newApplication.Id }, newApplication);
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred while creating the application." });
    }
  }

  // Update job application | Route: PUT /api/JobApplication
  [HttpPut]
  public async Task<IActionResult> UpdateApplication([FromBody] JobApplicationUpdateRequest request)
  {
    try
    {
      var userId = GetUserId();
      var updatedApplication = await _jobApplicationService.UpdateApplication(userId, request);

      return Ok(updatedApplication);
    }
    catch (KeyNotFoundException)
    {
      return NotFound(new { message = "Job Application not found or access denied." });
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred during update." });
    }
  }

  // Delete job application | Route: DELETE /api/JobApplication/{id}
  [HttpDelete("{id}")]
  public async Task<IActionResult> DeleteApplication(int id)
  {
    try
    {
      var userId = GetUserId();
      await _jobApplicationService.DeleteApplication(id, userId);

      return NoContent();
    }
    catch (KeyNotFoundException)
    {
      return NotFound(new { message = "Job Application not found or access denied." });
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(new { message = ex.Message });
    }
    catch (Exception)
    {
      return StatusCode(500, new { message = "An error occurred during deletion." });
    }
  }
}
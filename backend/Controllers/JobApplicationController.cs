using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.DTOs;
using backend.Models;

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
  [HttpGet("all")]
  public async Task<IActionResult> GetAllUserApplications()
  {
    try
    {
      var userId = GetUserId();
      var applicationDtos = await _jobApplicationService.GetAllUserApplications(userId);

      return Ok(applicationDtos);
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

      var newApplicationDto = JobApplicationDto.FromEntity(newApplication);

      return CreatedAtAction(nameof(GetAllUserApplications), new { id = newApplicationDto.Id }, newApplicationDto);
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

  // Update job application | Route: PUT /api/JobApplication (FIXED)
  [HttpPut]
  public async Task<IActionResult> UpdateApplication([FromBody] JobApplicationUpdateRequest request)
  {
    try
    {
      var userId = GetUserId();
      var updatedApplication = await _jobApplicationService.UpdateApplication(userId, request);

      var updatedApplicationDto = JobApplicationDto.FromEntity(updatedApplication);

      return Ok(updatedApplicationDto);
    }
    catch (KeyNotFoundException)
    {
      return NotFound(new { message = "Job Application not found or access denied." });
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(new { message = ex.Message });
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

  // Delete all job applications | Route: DELETE /api/JobApplication/all
  [HttpDelete("all")]
  public async Task<IActionResult> DeleteAllUserApplications()
  {
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
    if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
    {
      return Unauthorized(new { message = "Invalid user ID claim." });
    }

    try
    {
      await _jobApplicationService.DeleteAllUserApplications(userId);

      return Ok(new { message = "All job applications have been successfully deleted." });
    }
    catch (Exception ex)
    {
      return StatusCode(500, new { message = "An error occurred while attempting to clear all application data.", error = ex.Message });
    }
  }

  // Undo previous status change | Route: POST /api/JobApplication/undo/{id}
  [HttpPost("undo/{id:int}")]
  public async Task<IActionResult> UndoLastStatusChange(int id)
  {
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
    if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
    {
      return Unauthorized(new { message = "Invalid user ID claim." });
    }

    try
    {
      var updatedApplication = await _jobApplicationService.UndoLastStatusChange(id, userId);

      var updatedApplicationDto = JobApplicationDto.FromEntity(updatedApplication);

      return Ok(updatedApplicationDto);
    }
    catch (KeyNotFoundException)
    {
      return NotFound(new { message = "Job Application not found or does not belong to user." });
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
      return StatusCode(500, new { message = "An error occurred while attempting to undo the last status change.", error = ex.Message });
    }
  }
}
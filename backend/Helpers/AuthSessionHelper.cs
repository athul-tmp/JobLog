using System.Security.Claims;
using backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

namespace backend.Helpers
{
  public static class AuthSessionHelper
  {
    // Runs after a JWT's signature and lifetime are validated:
    // rejects tokens issued before the user's sessions were revoked (TokenVersion bumped)
    public static async Task OnTokenValidated(TokenValidatedContext context)
    {
      var principal = context.Principal;
      if (principal == null || !int.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
      {
        context.Fail("User ID claim is missing or invalid.");
        return;
      }

      var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
      var user = await dbContext.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId);

      // Tokens issued before token versioning existed carry no claim and count as version 0
      var tokenVersion = int.TryParse(principal.FindFirst(TokenService.TokenVersionClaim)?.Value, out var version) ? version : 0;

      if (user == null || user.TokenVersion != tokenVersion)
      {
        context.Fail("Session is no longer valid.");
        return;
      }
    }
  }
}

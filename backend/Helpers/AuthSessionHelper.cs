using System.Security.Claims;
using backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

namespace backend.Helpers
{
  public static class AuthSessionHelper
  {
    public const string AuthCookieName = "joblog_jwt_token";

    // Response header carrying a renewed token for non-cookie clients (browser extension)
    public const string RefreshedTokenHeader = "X-Refreshed-Token";

    // Sets the JWT in an HttpOnly cookie
    public static void SetAuthCookie(HttpResponse response, string token, DateTime expiry, bool isDevelopment)
    {
      response.Cookies.Append(AuthCookieName, token, new CookieOptions
      {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = SameSiteMode.Strict,
        Expires = expiry,
        Path = "/"
      });
    }

    public static void ClearAuthCookie(HttpResponse response)
    {
      response.Cookies.Delete(AuthCookieName);
    }

    // Runs after a JWT's signature and lifetime are validated:
    // 1. Rejects tokens issued before the user's sessions were revoked (TokenVersion bumped)
    // 2. Re-issues the token once it's older than Jwt:RefreshAfterHours, so active users stay logged in
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

      // Sliding session: demo sessions stay fixed, SignalR connections are skipped
      if (DemoUserHelper.IsDemoEmail(user.Email) || !context.HttpContext.Request.Path.StartsWithSegments("/api"))
      {
        return;
      }

      var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
      var refreshAfter = TimeSpan.FromHours(config.GetValue("Jwt:RefreshAfterHours", 24.0));
      var issuedAt = context.SecurityToken.ValidFrom;

      if (DateTime.UtcNow - issuedAt < refreshAfter)
      {
        return;
      }

      var tokenService = context.HttpContext.RequestServices.GetRequiredService<ITokenService>();
      var environment = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
      var refreshed = tokenService.CreateToken(user);

      SetAuthCookie(context.HttpContext.Response, refreshed.Token, refreshed.Expiry, environment.IsDevelopment());
      context.HttpContext.Response.Headers[RefreshedTokenHeader] = refreshed.Token;
    }
  }
}

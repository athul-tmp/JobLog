using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Helpers
{
  public static class DemoUserHelper
  {
    public const string DemoEmail = "demo@joblog.com";

    public static bool IsDemoEmail(string? email)
    {
      return email != null && email.Trim().Equals(DemoEmail, StringComparison.OrdinalIgnoreCase);
    }
  }

  // Blocks the shared demo account from destructive or account-changing actions
  [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
  public class BlockDemoUserAttribute : ActionFilterAttribute
  {
    public override void OnActionExecuting(ActionExecutingContext context)
    {
      var email = context.HttpContext.User.FindFirst(ClaimTypes.Email)?.Value
        ?? context.HttpContext.User.FindFirst("email")?.Value;

      if (DemoUserHelper.IsDemoEmail(email))
      {
        context.Result = new ObjectResult(new { message = "This action is disabled for the demo account." })
        {
          StatusCode = StatusCodes.Status403Forbidden
        };
      }
    }
  }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Helpers
{
  public static class DemoUserHelper
  {
    // JWT claim present (value "true") on tokens issued to demo accounts
    public const string IsDemoClaim = "is_demo";
  }

  // Blocks demo accounts from destructive or account-changing actions
  [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
  public class BlockDemoUserAttribute : ActionFilterAttribute
  {
    public override void OnActionExecuting(ActionExecutingContext context)
    {
      if (context.HttpContext.User.HasClaim(DemoUserHelper.IsDemoClaim, "true"))
      {
        context.Result = new ObjectResult(new { message = "This action is disabled for the demo account." })
        {
          StatusCode = StatusCodes.Status403Forbidden
        };
      }
    }
  }
}

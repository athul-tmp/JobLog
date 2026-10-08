namespace backend.Helpers
{
  public static class RateLimitPolicies
  {
    // Password-checking endpoints (login, re-verification, token redemption)
    public const string Auth = "auth";

    // Endpoints that send an email
    public const string Email = "email";

    // Creating a demo account (each one writes seed data)
    public const string Demo = "demo";
  }
}

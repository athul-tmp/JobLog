using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Helpers;
using backend.Models;
using Microsoft.IdentityModel.Tokens;

public record TokenResult(string Token, DateTime Expiry, bool IsDemoUser);
public interface ITokenService
{
  TokenResult CreateToken(User user);
}

public class TokenService : ITokenService
{
  // Claim holding the user's TokenVersion at the time the token was issued
  public const string TokenVersionClaim = "token_version";

  public static readonly TimeSpan SessionLifetime = TimeSpan.FromDays(30);
  public static readonly TimeSpan DemoSessionLifetime = TimeSpan.FromMinutes(30);

  private readonly IConfiguration _config;

  public TokenService(IConfiguration config)
  {
    _config = config;
  }

  public TokenResult CreateToken(User user)
  {
    // Secret key
    var secretKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Secret Key not configured.");
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

    // Payload containing user ID, email and token version
    var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(TokenVersionClaim, user.TokenVersion.ToString()),
        };

    // Demo-specific expiration
    var isDemoUser = DemoUserHelper.IsDemoEmail(user.Email);

    var expiryTime = DateTime.UtcNow.Add(isDemoUser
        ? DemoSessionLifetime // Short fixed expiry for demo (30 min)
        : SessionLifetime);   // Registered users (30 days, extended while active)

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(claims), // Data
      Expires = expiryTime,
      SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature), // Signature
      Issuer = _config["Jwt:Issuer"],
      Audience = _config["Jwt:Audience"]
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);

    return new TokenResult(tokenHandler.WriteToken(token), expiryTime, isDemoUser);
  }
}

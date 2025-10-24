using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.IdentityModel.Tokens;

public interface ITokenService
{
  string CreateToken(User user);
}

public class TokenService : ITokenService
{
  private readonly IConfiguration _config;

  public TokenService(IConfiguration config)
  {
    _config = config;
  }

  public string CreateToken(User user)
  {
    // Secret key
    var secretKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Secret Key not configured.");
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

    // Payload containing user ID and email
    var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
        };

    // Demo-specific expiration
    const string DEMO_EMAIL = "demo@joblog.com";
    var isDemoUser = user.Email.Equals(DEMO_EMAIL, StringComparison.OrdinalIgnoreCase);

    var expiryTime = isDemoUser
        ? DateTime.UtcNow.AddMinutes(30) // Short expiry for demo (30 min)
        : DateTime.UtcNow.AddDays(7);   // Normal expiry for registered users (7 days)

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

    return tokenHandler.WriteToken(token);
  }
}
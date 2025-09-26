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

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(claims), // Data
      Expires = DateTime.UtcNow.AddDays(7), // Expires in 1 week
      SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature), // Signature
      Issuer = _config["Jwt:Issuer"],
      Audience = _config["Jwt:Audience"]
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);

    return tokenHandler.WriteToken(token);
  }
}
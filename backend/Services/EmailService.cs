using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text;
using System.Text.Json;


public interface IEmailService
{
  Task<bool> SendPasswordResetEmail(string toEmail, string userName, string resetLink);
}

public class EmailService : IEmailService
{
  private readonly IConfiguration _config;
  private readonly IHttpClientFactory _clientFactory;

  private const string BrevoApiUrl = "https://api.brevo.com/v3/smtp/email";

  public EmailService(IConfiguration config, IHttpClientFactory clientFactory)
  {
    _config = config;
    _clientFactory = clientFactory;
  }

  public async Task<bool> SendPasswordResetEmail(string toEmail, string userName, string resetLink)
  {
    var apiKey = _config["Brevo:ApiKey"];
    var senderEmail = _config["Brevo:SenderEmail"];
    var senderName = _config["Brevo:SenderName"];

    if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(senderEmail))
    {
      return false;
    }

    // Request/email body
    var emailBody = new
    {
      sender = new { name = senderName, email = senderEmail },
      to = new[] { new { email = toEmail, name = userName } },
      subject = "JobLog Password Reset Request",
      htmlContent = $@"
                <html>
                <body>
                    <h2>Password Reset Request for JobLog</h2>
                    <p>Hi {userName},</p>
                    <p>You recently requested to reset the password for your JobLog account.</p>
                    <p>Please click the button below to choose a new password:</p>
                    <p><a href='{resetLink}' style='background-color: #7e22ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a></p>
                    <p>This link is only valid for 1 hour.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                </body>
                </html>
            "
    };

    // Send request
    using var client = _clientFactory.CreateClient();
    client.DefaultRequestHeaders.Add("api-key", apiKey);

    var content = new StringContent(JsonSerializer.Serialize(emailBody), Encoding.UTF8, "application/json");

    var response = await client.PostAsync(BrevoApiUrl, content);

    return response.IsSuccessStatusCode;
  }
}
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
        <html lang='en'>
        <head>
          <meta charset='UTF-8'>
          <meta name='viewport' content='width=device-width, initial-scale=1.0'>
          <title>Password Reset</title>
          <style>
              /* Basic reset styles for email clients */
              body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
              table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
              img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
              a {{ text-decoration: none; }}
              /* Styling for the main content */
              .container {{ max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333333; }}
              .logo-container {{ text-align: center; padding-bottom: 20px; }}
              .logo-img {{ height: 40px; width: 40px; }}
              .header-text {{ font-size: 24px; font-weight: bold; color: #7e22ce; margin-top: 10px; margin-bottom: 20px; text-align: center; }}
              .button {{ background-color: #7e22ce; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }}
          </style>
        </head>
        <body>
          <div class='container' style='max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333333; border: 1px solid #eeeeee; border-radius: 8px;'>

              <h1 class='header-text'>
                  Password Reset Request for <span style='color: #7e22ce;'>JobLog</span>
              </h1>
              
              <p style='margin-bottom: 20px;'>Hi {userName},</p>
              <p style='margin-bottom: 20px;'>You recently requested to reset the password for your JobLog account.</p>
              
              <table role='presentation' border='0' cellpadding='0' cellspacing='0' class='body' style='width: 100%;'>
                  <tr>
                      <td align='center' style='padding: 20px 0;'>
                          <a href='{resetLink}' class='button' style='background-color: #7e22ce; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>
                              Reset Password
                          </a>
                      </td>
                  </tr>
              </table>
              
              <p style='margin-top: 20px; font-size: 14px; color: #666666;'>This link is only valid for 1 hour.</p>
              <p style='font-size: 14px; color: #666666;'>If you did not request a password reset, please ignore this email.</p>
              
              <p style='margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 10px; font-size: 12px; color: #999999;'>
                  &copy; {DateTime.UtcNow.Year} JobLog. All rights reserved.
              </p>
          </div>
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
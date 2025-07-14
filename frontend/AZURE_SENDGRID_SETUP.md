# Azure + SendGrid Email Setup Guide

## Overview

This guide shows how to set up SendGrid email service with your Azure free plan for the Blood Sugar Tracker application.

## 🎯 Why SendGrid + Azure?

### **Benefits:**
- ✅ **Free Tier**: 100 emails/day (25,000/month)
- ✅ **Azure Native**: One-click deployment from Azure Marketplace
- ✅ **Excellent Deliverability**: Industry-leading email delivery
- ✅ **Easy Integration**: Simple API and SDKs
- ✅ **Templates**: Professional email templates
- ✅ **Analytics**: Email tracking and analytics

## 🛠️ Setup Steps

### Step 1: Create SendGrid Account via Azure Marketplace

1. **Go to Azure Portal**: https://portal.azure.com
2. **Search for SendGrid**: In the search bar, type "SendGrid"
3. **Select SendGrid**: Choose "SendGrid Email Delivery"
4. **Create Resource**:
   - **Subscription**: Your free Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `bloodsugartracker-sendgrid`
   - **Pricing Plan**: **Free** (100 emails/day)
   - **Location**: Choose closest to your users
   - **Contact Information**: Your email and company details

### Step 2: Get SendGrid API Key

1. **Go to SendGrid Dashboard**: After creation, click "Manage"
2. **Navigate to Settings**: → API Keys
3. **Create API Key**:
   - **Name**: `BloodSugarTracker-API`
   - **Permissions**: **Full Access** (or **Restricted Access** with Mail Send)
4. **Copy API Key**: Save this securely (you won't see it again)

### Step 3: Configure Backend (.NET)

#### Install SendGrid NuGet Package
```bash
# In your backend project
dotnet add package SendGrid
```

#### Create Email Service
```csharp
// Backend/Services/EmailService.cs
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _apiKey = _configuration["SendGrid:ApiKey"];
        _fromEmail = _configuration["SendGrid:FromEmail"];
        _fromName = _configuration["SendGrid:FromName"];
    }

    public async Task<bool> SendVerificationEmailAsync(string email, string code)
    {
        try
        {
            var client = new SendGridClient(_apiKey);
            var from = new EmailAddress(_fromEmail, _fromName);
            var to = new EmailAddress(email);
            var subject = "Blood Sugar Tracker - Email Verification";
            
            var htmlContent = GetVerificationEmailTemplate(code);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, "", htmlContent);
            
            var response = await client.SendEmailAsync(msg);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Verification email sent successfully to {Email}", email);
                return true;
            }
            else
            {
                _logger.LogError("Failed to send email to {Email}. Status: {Status}", email, response.StatusCode);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception sending verification email to {Email}", email);
            return false;
        }
    }

    private string GetVerificationEmailTemplate(string code)
    {
        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Email Verification</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .code {{ background: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #667eea; }}
                .code-number {{ font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Blood Sugar Tracker</h1>
                    <p>Email Verification</p>
                </div>
                <div class='content'>
                    <h2>Hello!</h2>
                    <p>Thank you for registering with Blood Sugar Tracker. Please use the following verification code to complete your registration:</p>
                    
                    <div class='code'>
                        <div class='code-number'>{code}</div>
                    </div>
                    
                    <p><strong>This code will expire in 15 minutes.</strong></p>
                    
                    <p>If you didn't request this verification, please ignore this email.</p>
                    
                    <div class='footer'>
                        <p>Blood Sugar Tracker<br>
                        This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>";
    }
}
```

#### Add Configuration
```json
// Backend/appsettings.json
{
  "SendGrid": {
    "ApiKey": "YOUR_SENDGRID_API_KEY",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "Blood Sugar Tracker"
  }
}
```

```json
// Backend/appsettings.Development.json
{
  "SendGrid": {
    "ApiKey": "YOUR_SENDGRID_API_KEY",
    "FromEmail": "noreply@bloodsugartracker.dev",
    "FromName": "Blood Sugar Tracker (Dev)"
  }
}
```

#### Register Service
```csharp
// Backend/Program.cs
builder.Services.AddScoped<EmailService>();
```

### Step 4: Create API Endpoints

```csharp
// Backend/Controllers/AuthController.cs
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly EmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(EmailService emailService, ILogger<AuthController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("send-verification")]
    public async Task<IActionResult> SendVerification([FromBody] SendVerificationRequest request)
    {
        try
        {
            // Validate email
            if (string.IsNullOrEmpty(request.Email) || !IsValidEmail(request.Email))
            {
                return BadRequest(new { message = "Invalid email address" });
            }

            // Generate verification code
            var code = GenerateVerificationCode();
            
            // Store code in database/cache (implement this)
            await StoreVerificationCode(request.Email, code);

            // Send email
            var emailSent = await _emailService.SendVerificationEmailAsync(request.Email, code);
            
            if (emailSent)
            {
                return Ok(new { message = "Verification code sent successfully" });
            }
            else
            {
                return StatusCode(500, new { message = "Failed to send verification email" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending verification email");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
    {
        try
        {
            // Validate code from database/cache
            var isValid = await ValidateVerificationCode(request.Email, request.Code);
            
            if (isValid)
            {
                // Mark email as verified
                await MarkEmailAsVerified(request.Email);
                
                return Ok(new { message = "Email verified successfully" });
            }
            else
            {
                return BadRequest(new { message = "Invalid or expired verification code" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying code");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private string GenerateVerificationCode()
    {
        return new Random().Next(100000, 999999).ToString();
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    // Implement these methods based on your database setup
    private async Task StoreVerificationCode(string email, string code) { /* Implementation */ }
    private async Task<bool> ValidateVerificationCode(string email, string code) { /* Implementation */ }
    private async Task MarkEmailAsVerified(string email) { /* Implementation */ }
}

public class SendVerificationRequest
{
    public string Email { get; set; }
}

public class VerifyCodeRequest
{
    public string Email { get; set; }
    public string Code { get; set; }
}
```

### Step 5: Update Frontend Configuration

```javascript
// frontend/.env.production
REACT_APP_API_URL=https://your-azure-app.azurewebsites.net
REACT_APP_EMAIL_SERVICE=sendgrid
```

## 🔒 Security Best Practices

### 1. **Environment Variables**
```bash
# Never commit API keys to source control
# Use Azure Key Vault for production
# Use User Secrets for development
```

### 2. **Rate Limiting**
```csharp
// Implement rate limiting in your API
// Max 5 verification emails per hour per email
// Max 10 verification attempts per hour per IP
```

### 3. **Email Validation**
```csharp
// Validate email format
// Check for disposable email domains
// Implement DNS MX record validation
```

## 📊 Monitoring

### SendGrid Dashboard Features:
- ✅ **Email Activity**: Track sent, delivered, opened emails
- ✅ **Bounce Management**: Handle bounced emails
- ✅ **Spam Reports**: Monitor spam complaints
- ✅ **API Usage**: Track API calls and limits

### Azure Application Insights:
```csharp
// Add telemetry to track email operations
_telemetryClient.TrackEvent("EmailSent", new Dictionary<string, string>
{
    ["email"] = email,
    ["type"] = "verification"
});
```

## 💰 Cost Management

### SendGrid Free Tier Limits:
- **100 emails/day** (3,000/month)
- **Perfect for development and small applications**
- **Upgrade when you exceed limits**

### Azure Free Tier Benefits:
- ✅ **No additional cost** for SendGrid integration
- ✅ **Azure Functions** for serverless email processing
- ✅ **Azure Storage** for email templates
- ✅ **Application Insights** for monitoring

## 🚨 Troubleshooting

### Common Issues:
1. **API Key Issues**: Ensure API key has proper permissions
2. **Email Not Sending**: Check SendGrid dashboard for errors
3. **Rate Limiting**: Monitor your daily email usage
4. **Spam Filters**: Set up SPF/DKIM records for better deliverability

### Debug Steps:
1. Check SendGrid dashboard for email status
2. Verify API key permissions
3. Test with SendGrid's email testing tool
4. Check Azure Application Insights for errors

## 📋 Setup Checklist

- [ ] Create SendGrid account via Azure Marketplace
- [ ] Get API key from SendGrid dashboard
- [ ] Install SendGrid NuGet package
- [ ] Create EmailService class
- [ ] Add configuration to appsettings.json
- [ ] Create API endpoints
- [ ] Update frontend environment variables
- [ ] Test email sending
- [ ] Implement rate limiting
- [ ] Set up monitoring
- [ ] Configure SPF/DKIM records (optional)

This setup provides a professional, scalable email solution that works perfectly with your Azure free plan! 
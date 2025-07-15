using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly IJwtService _jwtService;

    public AuthController(AppDbContext context, ILogger<AuthController> logger, IConfiguration configuration, IWebHostEnvironment environment, IJwtService jwtService)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
        _jwtService = jwtService;
    }

    [HttpGet("login")]
    public IActionResult Login(string returnUrl = "/", bool rememberMe = false)
    {
        _logger.LogInformation("/api/auth/login hit with returnUrl={ReturnUrl}, rememberMe={RememberMe}", returnUrl, rememberMe);
        // Check if Google OAuth is configured
        var googleClientId = _configuration["Google:Client:ID"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        var googleClientSecret = _configuration["Google:Client:Secret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");
        
        _logger.LogInformation("Google OAuth configuration check - ClientId: {HasClientId}, ClientSecret: {HasClientSecret}, Environment: {Environment}", 
            !string.IsNullOrEmpty(googleClientId), 
            !string.IsNullOrEmpty(googleClientSecret), 
            _environment.EnvironmentName);
        
        if (string.IsNullOrEmpty(googleClientId) || string.IsNullOrEmpty(googleClientSecret))
        {
            _logger.LogError("Google OAuth is not configured. ClientId: {HasClientId}, ClientSecret: {HasClientSecret}", 
                !string.IsNullOrEmpty(googleClientId), 
                !string.IsNullOrEmpty(googleClientSecret));
            
            // Return a proper HTML error page for browser requests
            if (Request.Headers["Accept"].ToString().Contains("text/html"))
            {
                return Content(@"
                    <html>
                        <head><title>OAuth Configuration Error</title></head>
                        <body>
                            <h1>Google OAuth Not Configured</h1>
                            <p>The application is not properly configured for Google OAuth authentication.</p>
                            <p>Please contact the administrator to set up Google OAuth credentials.</p>
                            <p><a href='/login'>Back to Login</a></p>
                        </body>
                    </html>", "text/html");
            }
            
            return BadRequest(new { message = "Google OAuth is not configured. Please add Google:ClientId and Google:ClientSecret to your configuration." });
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/callback",
            Items =
            {
                { "returnUrl", returnUrl },
                { "correlationId", Guid.NewGuid().ToString() },
                { "rememberMe", rememberMe.ToString() }
            },
            // Ensure OAuth state is properly maintained
            IsPersistent = true,
            ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30)
        };

        // In production, ensure the redirect URI uses HTTPS
        if (!_environment.IsDevelopment())
        {
            var request = HttpContext.Request;
            var host = request.Host.Value ?? "localhost";
            var redirectUri = $"https://{host}/api/auth/callback";
            properties.RedirectUri = redirectUri;
        }

        _logger.LogInformation("Starting Google OAuth challenge with redirect URI: {RedirectUri}", properties.RedirectUri);

        try
        {
            // For testing: manually redirect to Google OAuth
            var googleOAuthUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
                $"client_id={Uri.EscapeDataString(googleClientId)}&" +
                $"redirect_uri={Uri.EscapeDataString(properties.RedirectUri)}&" +
                $"response_type=code&" +
                $"scope={Uri.EscapeDataString("openid email profile")}&" +
                $"state={Uri.EscapeDataString(properties.Items["correlationId"])}";
            
            _logger.LogInformation("Manual redirect to Google OAuth URL: {Url}", googleOAuthUrl);
            return Redirect(googleOAuthUrl);
            
            // Original code (commented out for testing):
            // return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initiate Google OAuth challenge");
            
            // Return a proper HTML error page for browser requests
            if (Request.Headers["Accept"].ToString().Contains("text/html"))
            {
                return Content($@"
                    <html>
                        <head><title>OAuth Error</title></head>
                        <body>
                            <h1>Google OAuth Error</h1>
                            <p>Failed to initiate Google OAuth authentication.</p>
                            <p>Error: {ex.Message}</p>
                            <p><a href='/login'>Back to Login</a></p>
                        </body>
                    </html>", "text/html");
            }
            
            return BadRequest(new { message = "Failed to initiate Google OAuth authentication", error = ex.Message });
        }
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback()
    {
        _logger.LogInformation("OAuth callback hit");
        // Authenticate the user
        var authenticateResult = await HttpContext.AuthenticateAsync();
        if (!authenticateResult.Succeeded || authenticateResult.Principal == null)
        {
            _logger.LogWarning("OAuth authentication failed or principal is null");
            // Handle failed authentication
            return Redirect("/login?error=oauth_failed");
        }

        // Extract user info from claims
        string email = null;
        string name = null;

        var emailClaim = authenticateResult.Principal.FindFirst(ClaimTypes.Email);
        if (emailClaim != null)
            email = emailClaim.Value;

        var nameClaim = authenticateResult.Principal.FindFirst(ClaimTypes.Name);
        if (nameClaim != null)
            name = nameClaim.Value;

        _logger.LogInformation("OAuth callback claims: email={Email}, name={Name}", email, name);

        if (string.IsNullOrEmpty(email))
        {
            _logger.LogWarning("OAuth callback missing email claim");
            return Redirect("/login?error=missing_email");
        }

        // (Optional) Create or update user in your database
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            _logger.LogInformation("Creating new user: {Email}, {Name}", email, name);
            user = new User { Email = email ?? string.Empty, Name = name ?? string.Empty };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else
        {
            _logger.LogInformation("Found existing user: {Email}, {Name}", user.Email, user.Name);
        }

        // Generate JWT
        var jwt = _jwtService.GenerateToken(user, false);
        _logger.LogInformation("Generated JWT for user: {Email}", user.Email);

        // Set JWT as cookie
        Response.Cookies.Append("MedicalTracker.Auth.JWT", jwt, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
        _logger.LogInformation("Set JWT cookie for user: {Email}", user.Email);

        // Redirect to frontend (e.g., dashboard)
        _logger.LogInformation("Redirecting user {Email} to /", user.Email);
        return Redirect("/");
    }


    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Clear the JWT cookie
        Response.Cookies.Delete("MedicalTracker.Auth.JWT");
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        // Get token from Authorization header or cookie
        var token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "") 
                   ?? Request.Cookies["MedicalTracker.Auth.JWT"];
        
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized();
        }

        var email = _jwtService.GetUserEmailFromToken(token);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            return Unauthorized();
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name
        };

        return Ok(userDto);
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        var googleClientId = _configuration["Google:Client:ID"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        var googleClientSecret = _configuration["Google:Client:Secret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");
        _logger.LogInformation("googleClientId={gci}", googleClientId);
        return Ok(new 
        { 
            hasClientId = !string.IsNullOrEmpty(googleClientId),
            hasClientSecret = !string.IsNullOrEmpty(googleClientSecret),
            isAuthenticated = User.Identity?.IsAuthenticated ?? false,
            userAgent = Request.Headers["User-Agent"].ToString(),
            cookies = Request.Cookies.Keys.ToList(),
            environmentName = _environment.EnvironmentName
        });
    }
} 
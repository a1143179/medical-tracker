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
        // Check if Google OAuth is configured
        var googleClientId = _configuration["Google:Client:ID"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        var googleClientSecret = _configuration["Google:Client:Secret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");
        
        if (string.IsNullOrEmpty(googleClientId) || string.IsNullOrEmpty(googleClientSecret))
        {
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

        // Use the authentication middleware to challenge Google OAuth
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
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
            Name = user.Name,
            PreferredValueTypeId = user.PreferredValueTypeId
        };

        return Ok(userDto);
    }

    [HttpPut("preferred-value-type")]
    public async Task<IActionResult> UpdatePreferredValueType([FromBody] UpdatePreferredValueTypeDto dto)
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

        // Validate that the value type exists
        var valueType = await _context.ValueTypes.FirstOrDefaultAsync(vt => vt.Id == dto.PreferredValueTypeId);
        if (valueType == null)
        {
            return BadRequest(new { message = "Invalid value type ID" });
        }

        user.PreferredValueTypeId = dto.PreferredValueTypeId;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Preferred value type updated successfully" });
    }
} 
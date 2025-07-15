using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Backend.Models;

namespace Backend.Services;

public interface IJwtService
{
    string GenerateToken(User user, bool rememberMe = false);
    ClaimsPrincipal? ValidateToken(string token);
    string? GetUserEmailFromToken(string token);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IConfiguration configuration, ILogger<JwtService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateToken(User user, bool rememberMe = false)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
        var jwtIssuer = "https://medicaltracker.azurewebsites.net";
        var jwtAudience = "https://medicaltracker.azurewebsites.net";

        if (string.IsNullOrEmpty(jwtKey))
        {
            _logger.LogError("JWT configuration is missing. Key: {HasKey}", !string.IsNullOrEmpty(jwtKey));
            throw new InvalidOperationException("JWT configuration is incomplete");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name ?? user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("google_id", user.GoogleId ?? ""),
            new("remember_me", rememberMe.ToString().ToLower())
        };

        var expiresIn = rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(24);
        var expiresAt = DateTime.UtcNow.Add(expiresIn);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        
        _logger.LogInformation("Generated JWT token for user {Email}, expires: {ExpiresAt}, rememberMe: {RememberMe}", 
            user.Email, expiresAt, rememberMe);
        
        return tokenString;
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var jwtKey = _configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
            var jwtIssuer = "https://medicaltracker.azurewebsites.net";
            var jwtAudience = "https://medicaltracker.azurewebsites.net";

            if (string.IsNullOrEmpty(jwtKey))
            {
                _logger.LogWarning("JWT configuration is missing for token validation");
                return null;
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var tokenHandler = new JwtSecurityTokenHandler();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            
            _logger.LogDebug("JWT token validated successfully for user {Email}", 
                principal.FindFirst(ClaimTypes.Email)?.Value);
            
            return principal;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate JWT token");
            return null;
        }
    }

    public string? GetUserEmailFromToken(string token)
    {
        var principal = ValidateToken(token);
        return principal?.FindFirst(ClaimTypes.Email)?.Value;
    }
} 
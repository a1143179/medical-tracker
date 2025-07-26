using Xunit;
using Backend.Services;
using Backend.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Backend.Tests
{
    public class JwtServiceTests
    {
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;

        public JwtServiceTests()
        {
            // Create a test configuration with JWT settings
            var configBuilder = new ConfigurationBuilder();
            configBuilder.AddInMemoryCollection(new Dictionary<string, string>
            {
                {"Jwt:Key", "test-jwt-key-that-is-long-enough-for-testing-32-chars"},
                {"Jwt:Issuer", "https://test.medicaltracker.com"},
                {"Jwt:Audience", "https://test.medicaltracker.com"}
            });
            _configuration = configBuilder.Build();

            var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<JwtService>();
            var env = new TestWebHostEnvironment();
            
            _jwtService = new JwtService(_configuration, logger, env);
        }

        [Fact]
        public void GenerateToken_WithRememberMeTrue_ShouldExpireIn365Days()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                GoogleId = "google123"
            };

            // Act
            var token = _jwtService.GenerateToken(user, rememberMe: true);
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            // Assert
            Assert.NotNull(jwtToken);
            Assert.True(jwtToken.ValidTo > DateTime.UtcNow.AddDays(364));
            Assert.True(jwtToken.ValidTo < DateTime.UtcNow.AddDays(366));
        }

        [Fact]
        public void GenerateToken_WithRememberMeFalse_ShouldExpireIn24Hours()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                GoogleId = "google123"
            };

            // Act
            var token = _jwtService.GenerateToken(user, rememberMe: false);
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            // Assert
            Assert.NotNull(jwtToken);
            Assert.True(jwtToken.ValidTo > DateTime.UtcNow.AddHours(23));
            Assert.True(jwtToken.ValidTo < DateTime.UtcNow.AddHours(25));
        }

        [Fact]
        public void GenerateToken_ShouldIncludeRememberMeClaim()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                GoogleId = "google123"
            };

            // Act
            var token = _jwtService.GenerateToken(user, rememberMe: true);
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            // Assert
            var rememberMeClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "remember_me");
            Assert.NotNull(rememberMeClaim);
            Assert.Equal("true", rememberMeClaim.Value);
        }

        [Fact]
        public void GenerateToken_WithoutRememberMe_ShouldIncludeFalseRememberMeClaim()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                GoogleId = "google123"
            };

            // Act
            var token = _jwtService.GenerateToken(user, rememberMe: false);
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            // Assert
            var rememberMeClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "remember_me");
            Assert.NotNull(rememberMeClaim);
            Assert.Equal("false", rememberMeClaim.Value);
        }

        [Fact]
        public void ValidateToken_WithValidToken_ShouldReturnPrincipal()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                GoogleId = "google123"
            };
            var token = _jwtService.GenerateToken(user, rememberMe: true);

            // Act
            var principal = _jwtService.ValidateToken(token);

            // Assert
            Assert.NotNull(principal);
            var emailClaim = principal.FindFirst(ClaimTypes.Email);
            Assert.NotNull(emailClaim);
            Assert.Equal("test@example.com", emailClaim.Value);
        }

        [Fact]
        public void ValidateToken_WithExpiredToken_ShouldReturnNull()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                GoogleId = "google123"
            };

            // Create a token that expires immediately
            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new("google_id", user.GoogleId ?? ""),
                new("remember_me", "true")
            };

            var expiredToken = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(-1), // Expired 1 minute ago
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(expiredToken);

            // Act
            var principal = _jwtService.ValidateToken(tokenString);

            // Assert
            Assert.Null(principal);
        }

        private class TestWebHostEnvironment : IWebHostEnvironment
        {
            public string WebRootPath { get; set; } = "";
            public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
            public string EnvironmentName { get; set; } = "Test";
            public string ApplicationName { get; set; } = "TestApp";
            public string ContentRootPath { get; set; } = "";
            public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        }
    }
} 
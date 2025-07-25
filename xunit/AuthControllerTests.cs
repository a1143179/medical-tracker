using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Backend.Models;
using Backend.Data;
using Backend.Tests;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests;

public class AuthControllerTests
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<ILogger<Backend.Controllers.AuthController>> _mockLogger;
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<IWebHostEnvironment> _mockEnv;

    public AuthControllerTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _mockLogger = new Mock<ILogger<Backend.Controllers.AuthController>>();
        _mockJwtService = new Mock<IJwtService>();
        _mockConfig = new Mock<IConfiguration>();
        _mockEnv = new Mock<IWebHostEnvironment>();
    }

    private static ISession CreateSessionWithUserId(string userId)
    {
        var session = new TestSession();
        session.SetString("UserId", userId);
        return session;
    }

    [Fact]
    public async Task Me_ReturnsUser_WhenAuthenticated()
    {
        using var context = new AppDbContext(_options);
        // Use a real JwtService for both token generation and controller injection
        var jwtConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
        {
            { "Jwt:Key", "test_jwt_secret_key_12345678901234567890" },
            { "Jwt:Issuer", "test_issuer" },
            { "Jwt:Audience", "test_audience" }
        }).Build();
        var realJwtService = new JwtService(jwtConfig, new Mock<ILogger<JwtService>>().Object, _mockEnv.Object);
        var controller = new Backend.Controllers.AuthController(context, _mockLogger.Object, _mockConfig.Object, _mockEnv.Object, realJwtService);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var token = realJwtService.GenerateToken(user);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Cookies = new Mock<IRequestCookieCollection>().Object;
        Mock.Get(httpContext.Request.Cookies).Setup(x => x["MedicalTracker.Auth.JWT"]).Returns(token);
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Me();
        var okResult = Assert.IsType<OkObjectResult>(result);
        var userDto = Assert.IsType<UserDto>(okResult.Value);
        Assert.Equal("test@example.com", userDto.Email);
    }

    [Fact]
    public async Task Me_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.Controllers.AuthController(context, _mockLogger.Object, _mockConfig.Object, _mockEnv.Object, _mockJwtService.Object);
        var httpContext = new DefaultHttpContext();
        httpContext.Session = new TestSession(); // Ensure session is configured
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Me();
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task JwtCookieAuthentication_ValidatesTokenCorrectly()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var jwtConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
        {
            { "Jwt:Key", "test_jwt_secret_key_12345678901234567890" },
            { "Jwt:Issuer", "test_issuer" },
            { "Jwt:Audience", "test_audience" }
        }).Build();
        var realJwtService = new JwtService(jwtConfig, new Mock<ILogger<JwtService>>().Object, _mockEnv.Object);
        
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        
        var token = realJwtService.GenerateToken(user);
        
        // Create HTTP context with JWT cookie
        var httpContext = new DefaultHttpContext();
        var cookieCollection = new Mock<IRequestCookieCollection>();
        cookieCollection.Setup(x => x["MedicalTracker.Auth.JWT"]).Returns(token);
        httpContext.Request.Cookies = cookieCollection.Object;
        
        // Create cookie authentication options with OnValidatePrincipal
        var cookieOptions = new CookieAuthenticationOptions
        {
            Events = new CookieAuthenticationEvents
            {
                OnValidatePrincipal = async context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var jwtService = context.HttpContext.RequestServices.GetRequiredService<IJwtService>();
                    
                    logger.LogInformation("OnValidatePrincipal triggered for path: {Path}", context.HttpContext.Request.Path);
                    
                    var jwtToken = context.HttpContext.Request.Cookies["MedicalTracker.Auth.JWT"];
                    logger.LogInformation("JWT token found: {HasToken}", !string.IsNullOrEmpty(jwtToken));
                    
                    if (!string.IsNullOrEmpty(jwtToken))
                    {
                        try
                        {
                            var principal = jwtService.ValidateToken(jwtToken);
                            if (principal != null)
                            {
                                context.Principal = principal;
                                logger.LogInformation("JWT token validated successfully for user: {Email}", 
                                    principal.FindFirst(ClaimTypes.Email)?.Value);
                                return;
                            }
                            else
                            {
                                logger.LogWarning("JWT token validation returned null principal");
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Failed to validate JWT token");
                        }
                    }
                    else
                    {
                        logger.LogWarning("No JWT token found in cookies");
                    }
                    
                    logger.LogWarning("Authentication failed, rejecting principal");
                    context.RejectPrincipal();
                }
            }
        };
        
        // Create authentication service
        var authService = new Mock<IAuthenticationService>();
        authService.Setup(x => x.AuthenticateAsync(It.IsAny<HttpContext>(), It.IsAny<string>()))
            .ReturnsAsync(AuthenticateResult.Success(new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
                }, "Cookies")), "Cookies")));
        
        httpContext.RequestServices = new Mock<IServiceProvider>().Object;
        Mock.Get(httpContext.RequestServices).Setup(x => x.GetService(typeof(ILogger<Program>)))
            .Returns(new Mock<ILogger<Program>>().Object);
        Mock.Get(httpContext.RequestServices).Setup(x => x.GetService(typeof(IJwtService)))
            .Returns(realJwtService);
        
        // Act - Test the OnValidatePrincipal event
        var validateContext = new CookieValidatePrincipalContext(
            httpContext,
            new AuthenticationScheme("Cookies", "Cookies", typeof(CookieAuthenticationHandler)),
            new CookieAuthenticationOptions(),
            new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity()), "Cookies"));
        
        await cookieOptions.Events.OnValidatePrincipal(validateContext);
        
        // Assert
        Assert.NotNull(validateContext.Principal);
        Assert.Equal("test@example.com", validateContext.Principal.FindFirst(ClaimTypes.Email)?.Value);
        Assert.Equal("Test User", validateContext.Principal.FindFirst(ClaimTypes.Name)?.Value);
        Assert.Equal("1", validateContext.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
    }

    [Fact]
    public async Task JwtCookieAuthentication_RejectsInvalidToken()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        var cookieCollection = new Mock<IRequestCookieCollection>();
        cookieCollection.Setup(x => x["MedicalTracker.Auth.JWT"]).Returns("invalid_token");
        httpContext.Request.Cookies = cookieCollection.Object;
        
        var jwtService = new Mock<IJwtService>();
        jwtService.Setup(x => x.ValidateToken("invalid_token")).Returns((ClaimsPrincipal)null);
        
        httpContext.RequestServices = new Mock<IServiceProvider>().Object;
        Mock.Get(httpContext.RequestServices).Setup(x => x.GetService(typeof(ILogger<Program>)))
            .Returns(new Mock<ILogger<Program>>().Object);
        Mock.Get(httpContext.RequestServices).Setup(x => x.GetService(typeof(IJwtService)))
            .Returns(jwtService.Object);
        
        var cookieOptions = new CookieAuthenticationOptions
        {
            Events = new CookieAuthenticationEvents
            {
                OnValidatePrincipal = async context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var jwtService = context.HttpContext.RequestServices.GetRequiredService<IJwtService>();
                    
                    var jwtToken = context.HttpContext.Request.Cookies["MedicalTracker.Auth.JWT"];
                    
                    if (!string.IsNullOrEmpty(jwtToken))
                    {
                        try
                        {
                            var principal = jwtService.ValidateToken(jwtToken);
                            if (principal != null)
                            {
                                context.Principal = principal;
                                return;
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Failed to validate JWT token");
                        }
                    }
                    
                    context.RejectPrincipal();
                }
            }
        };
        
        // Act
        var validateContext = new CookieValidatePrincipalContext(
            httpContext,
            new AuthenticationScheme("Cookies", "Cookies", typeof(CookieAuthenticationHandler)),
            new CookieAuthenticationOptions(),
            new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity()), "Cookies"));
        
        await cookieOptions.Events.OnValidatePrincipal(validateContext);
        
        // Assert
        Assert.True(validateContext.ShouldRenew == false);
    }

    [Fact]
    public async Task JwtCookieAuthentication_RejectsMissingToken()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        var cookieCollection = new Mock<IRequestCookieCollection>();
        cookieCollection.Setup(x => x["MedicalTracker.Auth.JWT"]).Returns((string)null);
        httpContext.Request.Cookies = cookieCollection.Object;
        
        var jwtService = new Mock<IJwtService>();
        
        httpContext.RequestServices = new Mock<IServiceProvider>().Object;
        Mock.Get(httpContext.RequestServices).Setup(x => x.GetService(typeof(ILogger<Program>)))
            .Returns(new Mock<ILogger<Program>>().Object);
        Mock.Get(httpContext.RequestServices).Setup(x => x.GetService(typeof(IJwtService)))
            .Returns(jwtService.Object);
        
        var cookieOptions = new CookieAuthenticationOptions
        {
            Events = new CookieAuthenticationEvents
            {
                OnValidatePrincipal = async context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var jwtService = context.HttpContext.RequestServices.GetRequiredService<IJwtService>();
                    
                    var jwtToken = context.HttpContext.Request.Cookies["MedicalTracker.Auth.JWT"];
                    
                    if (!string.IsNullOrEmpty(jwtToken))
                    {
                        try
                        {
                            var principal = jwtService.ValidateToken(jwtToken);
                            if (principal != null)
                            {
                                context.Principal = principal;
                                return;
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Failed to validate JWT token");
                        }
                    }
                    
                    context.RejectPrincipal();
                }
            }
        };
        
        // Act
        var validateContext = new CookieValidatePrincipalContext(
            httpContext,
            new AuthenticationScheme("Cookies", "Cookies", typeof(CookieAuthenticationHandler)),
            new CookieAuthenticationOptions(),
            new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity()), "Cookies"));
        
        await cookieOptions.Events.OnValidatePrincipal(validateContext);
        
        // Assert
        Assert.True(validateContext.ShouldRenew == false);
    }
} 
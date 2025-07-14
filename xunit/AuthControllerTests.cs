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

namespace Backend.Tests;

public class AuthControllerTests
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<ILogger<Backend.AuthController>> _mockLogger;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<IWebHostEnvironment> _mockEnv;

    public AuthControllerTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _mockLogger = new Mock<ILogger<Backend.AuthController>>();
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
        var controller = new Backend.AuthController(context, _mockLogger.Object, _mockConfig.Object, _mockEnv.Object);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
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
        var controller = new Backend.AuthController(context, _mockLogger.Object, _mockConfig.Object, _mockEnv.Object);
        var httpContext = new DefaultHttpContext();
        httpContext.Session = new TestSession(); // Ensure session is configured
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Me();
        Assert.IsType<UnauthorizedResult>(result);
    }
} 
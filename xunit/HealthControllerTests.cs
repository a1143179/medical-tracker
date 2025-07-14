using Xunit;
using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Tests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace Backend.Tests;

public class HealthControllerTests
{
    [Fact]
    public async Task Get_ReturnsOk()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "HealthTestDb")
            .Options;
        
        var context = new AppDbContext(options);
        var loggerMock = new Mock<ILogger<Backend.HealthController>>();
        
        var controller = new Backend.HealthController(context, loggerMock.Object);
        
        // Act
        var result = await controller.Get();
        
        // Assert
        Assert.IsType<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        Assert.NotNull(okResult);
        
        // Verify the health status contains expected properties
        var healthStatus = okResult.Value;
        Assert.NotNull(healthStatus);
    }

    [Fact]
    public async Task Ready_ReturnsOk_WhenDatabaseConnected()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "ReadyTestDb")
            .Options;
        
        var context = new AppDbContext(options);
        var loggerMock = new Mock<ILogger<Backend.HealthController>>();
        
        var controller = new Backend.HealthController(context, loggerMock.Object);
        
        // Act
        var result = await controller.Ready();
        
        // Assert
        Assert.IsType<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        Assert.NotNull(okResult);
        
        var readyStatus = okResult.Value;
        Assert.NotNull(readyStatus);
    }
} 
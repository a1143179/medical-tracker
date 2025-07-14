using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Backend.Models;
using Backend.DTOs;
using Backend.Data;
using Backend.Tests;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace Backend.Tests;

public class RecordsControllerTests
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<ILogger<Backend.RecordsController>> _mockLogger;

    public RecordsControllerTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _mockLogger = new Mock<ILogger<Backend.RecordsController>>();
    }

    private static ISession CreateSessionWithUserId(string userId)
    {
        var session = new TestSession();
        session.SetString("UserId", userId);
        return session;
    }

    [Fact]
    public async Task Get_ReturnsAllRecords_ForAuthenticatedUser()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var testRecords = new List<BloodSugarRecord>
        {
            new() { Id = 1, Level = 12.0, MeasurementTime = DateTime.UtcNow, Notes = "Test 1", UserId = 1 },
            new() { Id = 2, Level = 14.0, MeasurementTime = DateTime.UtcNow.AddHours(-1), Notes = "Test 2", UserId = 1 }
        };
        await context.BloodSugarRecords.AddRangeAsync(testRecords);
        await context.SaveChangesAsync();
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Get();
        var okResult = Assert.IsType<OkObjectResult>(result);
        var records = Assert.IsType<List<BloodSugarRecord>>(okResult.Value);
        Assert.Equal(2, records.Count);
    }

    [Fact]
    public async Task Post_WithValidRecord_ReturnsCreatedRecord()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var newRecord = new CreateBloodSugarRecordDto
        {
            Level = 13.0,
            MeasurementTime = DateTime.UtcNow,
            Notes = "New test record"
        };
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Post(newRecord);
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var record = Assert.IsType<BloodSugarRecord>(createdResult.Value);
        Assert.Equal(13.0, record.Level);
        Assert.Equal("New test record", record.Notes);
        Assert.Equal(201, createdResult.StatusCode);
    }

    [Fact]
    public async Task Post_WithInvalidLevel_ReturnsBadRequest()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var invalidRecord = new CreateBloodSugarRecordDto
        {
            Level = 0, // Invalid level
            MeasurementTime = DateTime.UtcNow,
            Notes = "Invalid record"
        };
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Post(invalidRecord);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Put_WithValidIdAndRecord_ReturnsOk()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var existingRecord = new BloodSugarRecord { Id = 1, Level = 12.0, MeasurementTime = DateTime.UtcNow, Notes = "Original", UserId = 1 };
        await context.BloodSugarRecords.AddAsync(existingRecord);
        await context.SaveChangesAsync();
        var updateDto = new CreateBloodSugarRecordDto
        {
            Level = 14.0,
            MeasurementTime = DateTime.UtcNow,
            Notes = "Updated"
        };
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Put(1, updateDto);
        Assert.IsType<OkObjectResult>(result);
        var updatedRecord = await context.BloodSugarRecords.FindAsync(1);
        Assert.Equal(14.0, updatedRecord?.Level);
        Assert.Equal("Updated", updatedRecord?.Notes);
    }

    [Fact]
    public async Task Put_WithInvalidId_ReturnsNotFound()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var updateDto = new CreateBloodSugarRecordDto
        {
            Level = 14.0,
            MeasurementTime = DateTime.UtcNow,
            Notes = "Updated"
        };
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Put(999, updateDto);
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WithValidId_ReturnsOk()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var testRecord = new BloodSugarRecord { Id = 1, Level = 12.0, MeasurementTime = DateTime.UtcNow, Notes = "Test", UserId = 1 };
        await context.BloodSugarRecords.AddAsync(testRecord);
        await context.SaveChangesAsync();
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Delete(1);
        Assert.IsType<OkResult>(result);
        Assert.Null(await context.BloodSugarRecords.FindAsync(1));
    }

    [Fact]
    public async Task Delete_WithInvalidId_ReturnsNotFound()
    {
        using var context = new AppDbContext(_options);
        var controller = new Backend.RecordsController(context);
        var user = new User { Id = 1, Email = "test@example.com", Name = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var httpContext = new DefaultHttpContext();
        httpContext.Session = CreateSessionWithUserId("1");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        var result = await controller.Delete(999);
        Assert.IsType<NotFoundResult>(result);
    }
} 
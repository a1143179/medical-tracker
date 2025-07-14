using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(AppDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            // Check database connectivity
            var canConnect = await _context.Database.CanConnectAsync();
            
            // Check OAuth configuration
            var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
            var hasOAuthConfig = !string.IsNullOrEmpty(googleClientId);
            
            var healthStatus = new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                database = canConnect ? "connected" : "disconnected",
                oauth = hasOAuthConfig ? "configured" : "not_configured",
                memory = GC.GetTotalMemory(false),
                uptime = Environment.TickCount64
            };
            
            _logger.LogInformation("Health check: {Status}, Database: {Database}, OAuth: {OAuth}", 
                healthStatus.status, healthStatus.database, healthStatus.oauth);
            
            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(500, new { status = "unhealthy", error = ex.Message });
        }
    }

    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            // Check if database is ready
            var canConnect = await _context.Database.CanConnectAsync();
            if (!canConnect)
            {
                return StatusCode(503, new { status = "not_ready", reason = "database_unavailable" });
            }
            
            return Ok(new { status = "ready" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Readiness check failed");
            return StatusCode(503, new { status = "not_ready", error = ex.Message });
        }
    }
} 
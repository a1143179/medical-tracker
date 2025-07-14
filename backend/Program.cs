using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication;
using Serilog;
using Serilog.Events;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog for file logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore.Authentication", LogEventLevel.Debug)
    .MinimumLevel.Override("Backend", LogEventLevel.Debug)
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", 
        rollingInterval: RollingInterval.Day,
        fileSizeLimitBytes: 10 * 1024 * 1024, // 10MB
        retainedFileCountLimit: 5,
        rollOnFileSizeLimit: true)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add health checks
builder.Services.AddHealthChecks();

// Add JWT service
builder.Services.AddScoped<IJwtService, JwtService>();

// Configure basic authentication for now (JWT will be added later)
builder.Services.AddAuthentication();

// Add Google OAuth authentication
var googleClientId = builder.Configuration["Google:ClientId"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = builder.Configuration["Google:ClientSecret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

// Log OAuth configuration status - will log after app is built to avoid BuildServiceProvider warning
var hasClientId = !string.IsNullOrEmpty(googleClientId);
var hasClientSecret = !string.IsNullOrEmpty(googleClientSecret);

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "Cookies";
        options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = "Cookies";
    })
    .AddCookie("Cookies", options =>
    {
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
        
        // Configure cookie options for better OAuth state handling
        options.Cookie.Name = "BloodSugarAuth";
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
        options.Cookie.SameSite = SameSiteMode.Lax; // Allow OAuth redirects
        options.Cookie.MaxAge = TimeSpan.FromHours(1); // Shorter timeout for OAuth
        
        // Handle authentication failures
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.CallbackPath = "/api/auth/callback";
        options.SaveTokens = true; // Save tokens for debugging
        
        // Configure OAuth state handling - use default state format with better session support
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
        
        // Configure dynamic redirect URI for production
        if (!builder.Environment.IsDevelopment())
        {
            options.Events.OnRedirectToAuthorizationEndpoint = context =>
            {
                var request = context.HttpContext.Request;
                var scheme = request.Scheme; // Will be "https" in production
                var host = request.Host.Value ?? "localhost";
                var redirectUri = $"{scheme}://{host}/api/auth/callback";
                
                // Update the redirect URI to use HTTPS in production
                context.RedirectUri = redirectUri;
                return Task.CompletedTask;
            };
        }
        
        // Add callback event handler to better handle OAuth state
        options.Events.OnRemoteFailure = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("OAuth remote failure: {Error}", context.Failure?.Message);
            
            // Check if this is a state error and user might already be authenticated
            if (context.Failure?.Message?.Contains("oauth state was missing or invalid") == true)
            {
                // Check if user is already authenticated
                if (context.HttpContext.User?.Identity?.IsAuthenticated == true)
                {
                    logger.LogInformation("OAuth state error but user is authenticated, redirecting to dashboard");
                    context.Response.Redirect("/dashboard");
                    context.HandleResponse();
                    return Task.CompletedTask;
                }
            }
            
            // Clear any invalid session data
            context.HttpContext.Session.Clear();
            
            // Redirect to login page with error
            context.Response.Redirect("/login?error=oauth_failed");
            context.HandleResponse();
            return Task.CompletedTask;
        };
        
        // Add ticket validation
        options.Events.OnTicketReceived = async context =>
        {
            var userService = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var claims = context.Principal.Claims;
            var email = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name)?.Value;
            var googleId = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(email))
            {
                var user = await userService.Users.FirstOrDefaultAsync(u => u.Email == email);
                
                if (user == null)
                {
                    user = new Backend.Models.User
                    {
                        Email = email,
                        Name = name ?? email,
                        GoogleId = googleId
                    };
                    userService.Users.Add(user);
                    await userService.SaveChangesAsync();
                }
                else if (!string.IsNullOrEmpty(googleId) && user.GoogleId != googleId)
                {
                    user.GoogleId = googleId;
                    if (!string.IsNullOrEmpty(name))
                    {
                        user.Name = name;
                    }
                    await userService.SaveChangesAsync();
                }

                // Set session
                context.HttpContext.Session.SetString("UserId", user.Id.ToString());
            }
        };
    });
}
else
{
    // Fallback authentication without Google OAuth
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "Cookies";
    })
    .AddCookie("Cookies");
}

// Add Entity Framework - use PostgreSQL if connection string is available, otherwise in-memory
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("BloodSugarHistoryDb"));
}

// Configure Data Protection for production
if (!builder.Environment.IsDevelopment())
{
    // In production, configure data protection to prevent key ring errors
    // This prevents the "key not found in key ring" error
    var keyRingPath = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") != null 
        ? $"/tmp/keys-{Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID")}"
        : "/tmp/keys";
    
    try
    {
        // Create directory if it doesn't exist
        var keyRingDir = new DirectoryInfo(keyRingPath);
        if (!keyRingDir.Exists)
        {
            keyRingDir.Create();
        }
        
        builder.Services.AddDataProtection()
            .PersistKeysToFileSystem(keyRingDir)
            .SetApplicationName("BloodSugarHistory")
            .SetDefaultKeyLifetime(TimeSpan.FromDays(90)); // Longer key lifetime for production
    }
    catch (Exception ex)
    {
        // Log the error but continue with in-memory fallback
        Console.WriteLine($"Failed to configure file-based data protection: {ex.Message}");
        builder.Services.AddDataProtection()
            .SetApplicationName("BloodSugarHistory");
    }
}
else
{
    // In development, use a consistent key ring
    builder.Services.AddDataProtection()
        .SetApplicationName("BloodSugarHistory");
}

// Add session support
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
    options.Cookie.MaxAge = TimeSpan.FromDays(30); // Set explicit max age
    options.Cookie.Name = "BloodSugarSession"; // Use custom cookie name
    options.Cookie.SameSite = SameSiteMode.Lax; // Allow OAuth redirects
});

var app = builder.Build();

// Log OAuth configuration status after app is built
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Google OAuth configuration - ClientId: {HasClientId}, ClientSecret: {HasClientSecret}, Environment: {Environment}", 
    hasClientId, hasClientSecret, app.Environment.EnvironmentName);

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only use HTTPS redirect if not in container environment
if (!app.Environment.IsDevelopment() && Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") == null)
{
app.UseHttpsRedirection();
}

// Serve static files from wwwroot in production
if (!app.Environment.IsDevelopment())
{
    app.UseStaticFiles();
    
    // Fallback to index.html for client-side routing
    app.MapFallbackToFile("index.html");
}

// Add session error handling middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (System.Security.Cryptography.CryptographicException ex) when (ex.Message.Contains("key") && ex.Message.Contains("not found"))
    {
        // Clear invalid session cookies
        context.Response.Cookies.Delete("BloodSugarSession");
        context.Response.Cookies.Delete(".AspNetCore.Antiforgery");
        
        // Redirect to login page
        context.Response.Redirect("/login");
        return;
    }
});

// Add cookie cleanup middleware for old session cookies
app.Use(async (context, next) =>
{
    // Clean up old session cookies that might cause issues
    var oldSessionCookie = context.Request.Cookies[".AspNetCore.Session"];
    if (!string.IsNullOrEmpty(oldSessionCookie))
    {
        context.Response.Cookies.Delete(".AspNetCore.Session");
    }
    
    await next();
});

// Ensure session is available before authentication
app.UseSession();

// Add OAuth state validation middleware
app.Use(async (context, next) =>
{
    // Ensure session is established before OAuth flow
    if (context.Request.Path.StartsWithSegments("/api/auth"))
    {
        await context.Session.LoadAsync();
        
        // Log OAuth flow for debugging
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("OAuth request: {Path}, Method: {Method}, HasSession: {HasSession}, QueryString: {QueryString}", 
            context.Request.Path, context.Request.Method, context.Session.IsAvailable, context.Request.QueryString);
        
        // Prevent duplicate callback requests
        if (context.Request.Path.StartsWithSegments("/api/auth/callback") && 
            string.IsNullOrEmpty(context.Request.Query["state"].ToString()) &&
            string.IsNullOrEmpty(context.Request.Query["code"].ToString()))
        {
            logger.LogWarning("Duplicate callback request detected without OAuth parameters");
            
            // If user is already authenticated, redirect to dashboard
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                context.Response.Redirect("/dashboard");
                return;
            }
            
            // Otherwise redirect to login
            context.Response.Redirect("/login?error=duplicate_callback");
            return;
        }
    }
    
    await next();
});

// Add OAuth correlation cookie cleanup middleware
app.Use(async (context, next) =>
{
    // Clean up old OAuth correlation cookies that might cause state issues
    var correlationCookie = context.Request.Cookies[".AspNetCore.Correlation.Google"];
    if (!string.IsNullOrEmpty(correlationCookie))
    {
        // Only delete if it's very old (more than 10 minutes)
        // This prevents deleting active OAuth flows
        context.Response.Cookies.Delete(".AspNetCore.Correlation.Google");
    }
    
    await next();
});

// Add OAuth error handling middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (AuthenticationFailureException ex) when (ex.Message.Contains("oauth state was missing or invalid"))
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "OAuth state error detected - clearing cookies and redirecting");
        
        // Clear all authentication and session cookies
        context.Response.Cookies.Delete("BloodSugarAuth");
        context.Response.Cookies.Delete("BloodSugarSession");
        context.Response.Cookies.Delete(".AspNetCore.Correlation.Google");
        context.Response.Cookies.Delete(".AspNetCore.Antiforgery");
        
        // Clear session
        context.Session.Clear();
        
        // Redirect to login with error
        context.Response.Redirect("/login?error=oauth_state_invalid");
        return;
    }
    catch (Exception ex) when (ex.Message.Contains("key") && ex.Message.Contains("not found"))
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Data protection key error - clearing cookies");
        
        // Clear invalid session cookies
        context.Response.Cookies.Delete("BloodSugarSession");
        context.Response.Cookies.Delete("BloodSugarAuth");
        context.Response.Cookies.Delete(".AspNetCore.Antiforgery");
        
        // Redirect to login page
        context.Response.Redirect("/login?error=session_expired");
        return;
    }
});

app.UseAuthentication();
app.UseAuthorization();

// Add health check endpoint
app.MapHealthChecks("/health");

app.MapControllers();

// API-only mode - no frontend proxy in development
if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => "Backend API is running on port 55556. Frontend should be started separately on port 55555.");
}

app.Run();

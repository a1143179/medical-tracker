using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.Google;
using Serilog;
using Backend.Services;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Add this log to confirm logging works in production
builder.Logging.AddConsole();
var logger = LoggerFactory.Create(logging => logging.AddConsole()).CreateLogger("Startup");
logger.LogInformation("Application starting up. Environment: {Environment}", builder.Environment.EnvironmentName);

// Logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore.Authentication", Serilog.Events.LogEventLevel.Debug)
    .MinimumLevel.Override("Backend", Serilog.Events.LogEventLevel.Debug)
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day, fileSizeLimitBytes: 10 * 1024 * 1024, retainedFileCountLimit: 5, rollOnFileSizeLimit: true)
    .CreateLogger();
builder.Host.UseSerilog();

// Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<IJwtService, JwtService>();

// Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
    options.Cookie.MaxAge = TimeSpan.FromDays(30);
    options.Cookie.Name = "MedicalTracker.Session.Data";
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// Google OAuth
var googleClientId = builder.Configuration["Google:Client:ID"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = builder.Configuration["Google:Client:Secret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

// Log Google OAuth config at startup
var oauthLogger = LoggerFactory.Create(logging => logging.AddConsole()).CreateLogger("Startup");
oauthLogger.LogInformation("Google OAuth config - ClientId: {HasClientId}, ClientSecret: {HasClientSecret}, Environment: {Environment}", 
    !string.IsNullOrEmpty(googleClientId), 
    !string.IsNullOrEmpty(googleClientSecret), 
    builder.Environment.EnvironmentName);

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
        options.Events.OnRedirectToLogin = context => {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("OnRedirectToLogin triggered. Path: {Path}, RedirectUri: {RedirectUri}", context.Request.Path, context.RedirectUri);
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.MaxAge = TimeSpan.FromHours(1);
        options.Events.OnRedirectToAccessDenied = context => {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("OnRedirectToAccessDenied triggered. Path: {Path}, RedirectUri: {RedirectUri}", context.Request.Path, context.RedirectUri);
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.CallbackPath = "/api/auth/callback";
        options.SaveTokens = true;
        // Ensure correlation cookie is set correctly for local development
        options.CorrelationCookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.None
            : CookieSecurePolicy.Always;
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.HttpOnly = true;
        options.CorrelationCookie.IsEssential = true;
        
        // Fix redirect URI for production
        if (!builder.Environment.IsDevelopment())
        {
            options.Events.OnRedirectToAuthorizationEndpoint = context =>
            {
                var request = context.HttpContext.Request;
                var host = request.Host.Value ?? "localhost";
                
                // Force HTTPS for Azure
                if (host.Contains("azurewebsites.net") || host.Contains("medicaltracker"))
                {
                    context.RedirectUri = "https://medicaltracker.azurewebsites.net/api/auth/callback";
                }
                else
                {
                    context.RedirectUri = $"https://{host}/api/auth/callback";
                }
                
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogInformation("Google OAuth redirect URI set to: {RedirectUri}", context.RedirectUri);
                return Task.CompletedTask;
            };
        }
        options.Events.OnRemoteFailure = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var headers = context.Request.Headers.Select(h => $"{h.Key}: {h.Value}").ToList();
            var userAgent = context.Request.Headers["User-Agent"].ToString();
            var accept = context.Request.Headers["Accept"].ToString();
            var xRequestedWith = context.Request.Headers["X-Requested-With"].ToString();
            var referer = context.Request.Headers["Referer"].ToString();
            logger.LogError("OAuth remote failure: {Error}, Referer: {Referer}, User-Agent: {UserAgent}, Accept: {Accept}, X-Requested-With: {XRequestedWith}, AllHeaders: {Headers}", context.Failure?.Message, referer, userAgent, accept, xRequestedWith, string.Join(" | ", headers));
            context.HttpContext.Session.Clear();
            context.Response.Redirect("/login?error=oauth_failed");
            context.HandleResponse();
            return Task.CompletedTask;
        };
        options.Events.OnTicketReceived = async context =>
        {
            var userService = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var headers = context.HttpContext.Request.Headers.Select(h => $"{h.Key}: {h.Value}").ToList();
            var userAgent = context.HttpContext.Request.Headers["User-Agent"].ToString();
            var accept = context.HttpContext.Request.Headers["Accept"].ToString();
            var xRequestedWith = context.HttpContext.Request.Headers["X-Requested-With"].ToString();
            var referer = context.HttpContext.Request.Headers["Referer"].ToString();
            logger.LogInformation("OAuth ticket received. Referer: {Referer}, User-Agent: {UserAgent}, Accept: {Accept}, X-Requested-With: {XRequestedWith}, AllHeaders: {Headers}", referer, userAgent, accept, xRequestedWith, string.Join(" | ", headers));
            var jwtService = context.HttpContext.RequestServices.GetRequiredService<IJwtService>();
            var environment = context.HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            // Do not redeclare logger; it is already defined above

            var claims = context.Principal != null ? context.Principal.Claims : Enumerable.Empty<Claim>();
            var email = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name)?.Value;
            var googleId = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(email))
            {
                var user = await userService.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    user = new Backend.Models.User { Email = email, Name = name ?? email, GoogleId = googleId };
                    userService.Users.Add(user);
                    await userService.SaveChangesAsync();
                    logger.LogInformation("Created new user: {Email}", email);
                }
                else if (!string.IsNullOrEmpty(googleId) && user.GoogleId != googleId)
                {
                    user.GoogleId = googleId;
                    if (!string.IsNullOrEmpty(name)) user.Name = name;
                    await userService.SaveChangesAsync();
                    logger.LogInformation("Updated existing user: {Email}", email);
                }
                
                context.HttpContext.Session.SetString("UserId", user.Id.ToString());
                
                // Get remember me setting from OAuth properties
                var rememberMe = context.Properties?.Items.ContainsKey("rememberMe") == true 
                    && bool.TryParse(context.Properties.Items["rememberMe"], out var rm) && rm;
                
                // Generate JWT token
                var token = jwtService.GenerateToken(user, rememberMe);
                
                // Set JWT token as HTTP-only cookie
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = !environment.IsDevelopment(),
                    SameSite = SameSiteMode.Lax,
                    MaxAge = rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(24)
                };
                
                context.HttpContext.Response.Cookies.Append("MedicalTracker.Auth.JWT", token, cookieOptions);
                logger.LogInformation("OAuth callback successful for user: {Email}", email);
            }
            context.Response.Redirect("/dashboard");
            context.HandleResponse();
            return;
        };
    });
}
else
{
    builder.Services.AddAuthentication(options => { options.DefaultScheme = "Cookies"; }).AddCookie("Cookies");
}

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
    builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
else
    builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("BloodSugarHistoryDb"));

// Data Protection
if (!builder.Environment.IsDevelopment())
{
    var keyRingPath = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") != null 
        ? $"/tmp/keys-{Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID")}" 
        : "/tmp/keys";
    try
    {
        var keyRingDir = new DirectoryInfo(keyRingPath);
        if (!keyRingDir.Exists) keyRingDir.Create();
        builder.Services.AddDataProtection().PersistKeysToFileSystem(keyRingDir).SetDefaultKeyLifetime(TimeSpan.FromDays(90));
    }
    catch
    {
        builder.Services.AddDataProtection();
    }
}
else
{
    builder.Services.AddDataProtection();
}

var app = builder.Build();

// Logging
var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
startupLogger.LogInformation("Application starting up. Environment: {Environment}", app.Environment.EnvironmentName);

// DB Migrations
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add forwarded headers for Azure App Service BEFORE other middleware
if (!app.Environment.IsDevelopment())
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor,
    });
}

if (!app.Environment.IsDevelopment() && Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") == null)
    app.UseHttpsRedirection();
if (!app.Environment.IsDevelopment())
{
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}

app.Use(async (context, next) =>
{
    try { await next(); }
    catch (System.Security.Cryptography.CryptographicException ex) when (ex.Message.Contains("key") && ex.Message.Contains("not found"))
    {
        context.Response.Cookies.Delete("MedicalTracker.Session.Data");
        context.Response.Cookies.Delete(".AspNetCore.Antiforgery");
        context.Response.Redirect("/login");
        return;
    }
});

app.Use(async (context, next) =>
{
    var oldSessionCookie = context.Request.Cookies[".AspNetCore.Session"];
    if (!string.IsNullOrEmpty(oldSessionCookie))
        context.Response.Cookies.Delete(".AspNetCore.Session");
    await next();
});

app.UseSession();

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/auth"))
    {
        await context.Session.LoadAsync();
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("OAuth request: {Path}, Method: {Method}, HasSession: {HasSession}, QueryString: {QueryString}", context.Request.Path, context.Request.Method, context.Session.IsAvailable, context.Request.QueryString);
        if (context.Request.Path.StartsWithSegments("/api/auth/callback"))
        {
            var state = context.Request.Query["state"].ToString();
            var code = context.Request.Query["code"].ToString();
            logger.LogInformation("Callback middleware - State: '{State}', Code: '{Code}', StateEmpty: {StateEmpty}, CodeEmpty: {CodeEmpty}", 
                state, code, string.IsNullOrEmpty(state), string.IsNullOrEmpty(code));
        }
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        if (
            context.Request.Method == "GET" &&
            !context.Request.Path.StartsWithSegments("/api") &&
            !context.Request.Path.StartsWithSegments("/swagger")
        )
        {
            var client = new HttpClient();
            var frontendUrl = builder.Environment.IsDevelopment()
                ? $"http://localhost:55556{context.Request.Path}{context.Request.QueryString}"
                : $"https://medicaltracker.azurewebsites.net{context.Request.Path}{context.Request.QueryString}";
            var frontendResponse = await client.GetAsync(frontendUrl);
            if (frontendResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
                frontendResponse = builder.Environment.IsDevelopment()
                    ? await client.GetAsync("http://localhost:55556/index.html")
                    : await client.GetAsync("https://medicaltracker.azurewebsites.net/index.html");
            context.Response.StatusCode = (int)frontendResponse.StatusCode;
            foreach (var header in frontendResponse.Headers)
                context.Response.Headers[header.Key] = header.Value.ToArray();
            foreach (var header in frontendResponse.Content.Headers)
                context.Response.Headers[header.Key] = header.Value.ToArray();
            context.Response.Headers.Remove("transfer-encoding");
            await frontendResponse.Content.CopyToAsync(context.Response.Body);
            return;
        }
        await next();
    });
}

app.Run();

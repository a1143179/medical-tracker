using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.Google;
using Serilog;
using Backend.Services;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Add this log to confirm logging works in production
builder.Logging.AddConsole();
var logger = LoggerFactory.Create(logging => logging.AddConsole()).CreateLogger("Startup");
logger.LogInformation("Application starting up. Environment: {Environment}", builder.Environment.EnvironmentName);

// Logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore.Authentication", Serilog.Events.LogEventLevel.Information)
    .MinimumLevel.Override("Backend", Serilog.Events.LogEventLevel.Information)
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day, fileSizeLimitBytes: 10 * 1024 * 1024, retainedFileCountLimit: 5, rollOnFileSizeLimit: true)
    .CreateLogger();
builder.Host.UseSerilog();
Log.Information("Serilog file logging is working. Environment: {Environment}", builder.Environment.EnvironmentName);

// Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<IJwtService, JwtService>();



// Google OAuth
var googleClientId = builder.Configuration["Google:Client:ID"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = builder.Configuration["Google:Client:Secret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

// Log Google OAuth config at startup
var oauthLogger = LoggerFactory.Create(logging => logging.AddConsole()).CreateLogger("Startup");
oauthLogger.LogInformation("Google OAuth config - ClientId: {HasClientId}, ClientSecret: {HasClientSecret}, Environment: {Environment}", 
    !string.IsNullOrEmpty(googleClientId), 
    !string.IsNullOrEmpty(googleClientSecret), 
    builder.Environment.EnvironmentName);

if (builder.Environment.EnvironmentName == "Test")
{
    builder.Services.AddAuthentication("Test")
        .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", options => { });
}
else
{
    // 移除 Cookie 认证方案，仅保留 Google OAuth 认证
    if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
    {
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = GoogleDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
            options.DefaultSignInScheme = "Cookies"; // 关键：Google OAuth 需要本地 Cookie 方案
        })
        .AddCookie("Cookies") // 只用于 Google OAuth 登录流程
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
                
            options.Events.OnRemoteFailure = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var host = context.Request.Host.HasValue ? context.Request.Host.Value : "unknown";
                var scheme = context.Request.Scheme;
                var redirectUri = context.Request.Query["redirect_uri"].ToString();
                logger.LogWarning("OAuth remote failure. Host: {Host}, Scheme: {Scheme}, RedirectUri: {RedirectUri}", host, scheme, redirectUri);
                context.Response.Redirect("/login?error=oauth_failed");
                context.HandleResponse();
                return Task.CompletedTask;
            };
            options.Events.OnTicketReceived = async context =>
            {
                var userService = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
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
                    var jwtService = context.HttpContext.RequestServices.GetRequiredService<IJwtService>();
                    var rememberMe = context.Properties?.Items.ContainsKey("rememberMe") == true 
                        && bool.TryParse(context.Properties.Items["rememberMe"], out var rm) && rm;
                    var token = jwtService.GenerateToken(user, rememberMe);
                    var cookieOptions = new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = !builder.Environment.IsDevelopment(),
                        SameSite = SameSiteMode.Lax,
                        MaxAge = rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(24)
                    };
                    context.HttpContext.Response.Cookies.Append("MedicalTracker.Auth.JWT", token, cookieOptions);
                }
                context.Response.Redirect("/dashboard");
                context.HandleResponse();
                return;
            };
            if (!builder.Environment.IsDevelopment())
            {
                options.Events.OnRedirectToAuthorizationEndpoint = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogInformation("BEFORE Google OAuth redirect URI set to: {RedirectUri}", context.RedirectUri);
                    // Replace 'http%3A%2F%2F' with 'https%3A%2F%2F' in the redirect_uri parameter for production
                    var googleUrl = context.RedirectUri.Replace("http%3A%2F%2F", "https%3A%2F%2F");
                    context.Response.Redirect(googleUrl);
                    logger.LogInformation("FORCED Google OAuth redirect to: {GoogleUrl}", googleUrl);
                    return Task.CompletedTask;
                };
            }
        });
    }
    else
    {
        builder.Services.AddAuthentication(options => { options.DefaultScheme = GoogleDefaults.AuthenticationScheme; });
    }
}

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var isTestEnv = builder.Environment.EnvironmentName == "Test";
if (isTestEnv) {
    builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("TestDb"));
} else if (!string.IsNullOrEmpty(connectionString)) {
    builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
} else {
    builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("BloodSugarHistoryDb"));
}

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

if (!app.Environment.IsDevelopment())
{
    var forwardedHeadersOptions = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
    };
    forwardedHeadersOptions.KnownNetworks.Clear();
    forwardedHeadersOptions.KnownProxies.Clear();
    app.UseForwardedHeaders(forwardedHeadersOptions);
    // Add logging for forwarded headers
    app.Use(async (context, next) =>
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        var proto = context.Request.Headers["X-Forwarded-Proto"].ToString();
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
        logger.LogInformation("Forwarded Headers: X-Forwarded-Proto={Proto}, X-Forwarded-For={ForwardedFor}, Scheme={Scheme}", proto, forwardedFor, context.Request.Scheme);
        await next();
    });
}

// Logging
var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
startupLogger.LogInformation("Application starting up. Environment: {Environment}", app.Environment.EnvironmentName);

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!app.Environment.IsEnvironment("Test"))
    {
        context.Database.Migrate();
    }
}

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
if (!app.Environment.IsDevelopment())
{
    app.UseStaticFiles();
    app.UseRouting();
}

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/auth"))
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("OAuth request: {Path}, Method: {Method}, QueryString: {QueryString}", context.Request.Path, context.Request.Method, context.Request.QueryString);
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

// 在 app.UseAuthentication() 之前插入自定义 JWT 解析中间件
app.Use(async (context, next) =>
{
    var jwt = context.Request.Cookies["MedicalTracker.Auth.JWT"];
    if (!string.IsNullOrEmpty(jwt))
    {
        var jwtService = context.RequestServices.GetRequiredService<IJwtService>();
        var principal = jwtService.ValidateToken(jwt);
        if (principal != null)
        {
            context.User = principal;
        }
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// SPA fallback: 所有未匹配的路由都返回 index.html
app.MapFallbackToFile("index.html");

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

public partial class Program { }

// TestAuthHandler实现
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : base(options, logger, encoder)
    { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

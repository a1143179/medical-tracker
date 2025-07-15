using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.Google;
using Serilog;
using Backend.Services;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddAuthentication();

// Google OAuth
var googleClientId = builder.Configuration["Google:ClientId"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = builder.Configuration["Google:ClientSecret"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");
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
        options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
        options.Cookie.Name = "MedicalTracker.OAuth.State";
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.MaxAge = TimeSpan.FromHours(1);
        options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
    })
    .AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.CallbackPath = "/api/auth/callback";
        options.SaveTokens = true;
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = !builder.Environment.IsDevelopment() ? CookieSecurePolicy.Always : CookieSecurePolicy.None;
        if (!builder.Environment.IsDevelopment())
        {
            options.Events.OnRedirectToAuthorizationEndpoint = context =>
            {
                var request = context.HttpContext.Request;
                var scheme = request.Scheme;
                var host = request.Host.Value ?? "localhost";
                context.RedirectUri = $"{scheme}://{host}/api/auth/callback";
                return Task.CompletedTask;
            };
        }
        options.Events.OnRemoteFailure = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("OAuth remote failure: {Error}", context.Failure?.Message);
            if (context.Failure?.Message?.Contains("oauth state was missing or invalid") == true && context.HttpContext.User?.Identity?.IsAuthenticated == true)
            {
                logger.LogInformation("OAuth state error but user is authenticated, redirecting to dashboard");
                context.Response.Redirect("/dashboard");
                context.HandleResponse();
                return Task.CompletedTask;
            }
            context.HttpContext.Session.Clear();
            context.Response.Redirect("/login?error=oauth_failed");
            context.HandleResponse();
            return Task.CompletedTask;
        };
        options.Events.OnTicketReceived = async context =>
        {
            var userService = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var jwtService = context.HttpContext.RequestServices.GetRequiredService<IJwtService>();
            var environment = context.HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
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

var app = builder.Build();

// Logging
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Google OAuth configuration - Environment: {Environment}", app.Environment.EnvironmentName);

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
            
            if (string.IsNullOrEmpty(state) && string.IsNullOrEmpty(code))
            {
                logger.LogWarning("Duplicate callback request detected without OAuth parameters");
                if (context.User?.Identity?.IsAuthenticated == true)
                {
                    context.Response.Redirect("/dashboard");
                    return;
                }
                context.Response.Redirect("/login?error=duplicate_callback");
                return;
            }
        }
    }
    await next();
});
app.Use(async (context, next) =>
{
    var correlationCookie = context.Request.Cookies[".AspNetCore.Correlation.Google"];
    if (!string.IsNullOrEmpty(correlationCookie))
        context.Response.Cookies.Delete(".AspNetCore.Correlation.Google");
    await next();
});
app.Use(async (context, next) =>
{
    try { await next(); }
    catch (Exception ex) when (ex.Message.Contains("oauth state was missing or invalid"))
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "OAuth state error detected - clearing cookies and redirecting");
        context.Response.Cookies.Delete("MedicalTracker.OAuth.State");
        context.Response.Cookies.Delete("MedicalTracker.Session.Data");
        context.Response.Cookies.Delete(".AspNetCore.Correlation.Google");
        context.Response.Cookies.Delete(".AspNetCore.Antiforgery");
        context.Session.Clear();
        context.Response.Redirect("/login?error=oauth_state_invalid");
        return;
    }
    catch (Exception ex) when (ex.Message.Contains("key") && ex.Message.Contains("not found"))
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Data protection key error - clearing cookies");
        context.Response.Cookies.Delete("MedicalTracker.Session.Data");
        context.Response.Cookies.Delete("MedicalTracker.OAuth.State");
        context.Response.Cookies.Delete(".AspNetCore.Antiforgery");
        context.Response.Redirect("/login?error=session_expired");
        return;
    }
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
            var frontendUrl = $"http://localhost:55556{context.Request.Path}{context.Request.QueryString}";
            var frontendResponse = await client.GetAsync(frontendUrl);
            if (frontendResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
                frontendResponse = await client.GetAsync("http://localhost:55556/index.html");
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

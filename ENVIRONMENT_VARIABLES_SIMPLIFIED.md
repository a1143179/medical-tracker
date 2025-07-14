# Simplified Environment Variables Guide

This guide contains only the **essential** environment variables that need to be configured. All other settings are hardcoded in the application.

## Essential Environment Variables Only

| Variable Name | Backend/Frontend | Location | Description | Example Value | Required? |
|---------------|------------------|----------|-------------|---------------|-----------|
| **REACT_APP_API_URL** | Frontend | Azure App Service | Backend API URL | `https://medicaltrackerbackend.azurewebsites.net/api` | ✅ Yes |
| **REACT_APP_GOOGLE_CLIENT_ID** | Frontend | Azure App Service | Google OAuth client ID | `123456789-abc123.apps.googleusercontent.com` | ✅ Yes |
| **ConnectionStrings_DefaultConnection** | Backend | Azure App Service | Database connection string | `Server=your-sql-server.database.windows.net;Database=MedicalTracker;User Id=your-username;Password=your-password;TrustServerCertificate=true` | ✅ Yes |
| **JWT_SecretKey** | Backend | Azure App Service | JWT signing key (generate with OpenSSL) | `REPLACE_WITH_GENERATED_SECRET_KEY` | ✅ Yes |
| **GOOGLE_ClientId** | Backend | Azure App Service | Google OAuth client ID | `123456789-abc123.apps.googleusercontent.com` | ✅ Yes |
| **GOOGLE_ClientSecret** | Backend | Azure App Service | Google OAuth client secret | `GOCSPX-your-secret-here` | ✅ Yes |
| **AZURE_WEBAPP_PUBLISH_PROFILE** | Both | GitHub Secrets | Azure publish profile | `<?xml version="1.0"...` | ✅ Yes |
| **AZURE_CREDENTIALS** | Both | GitHub Secrets | Azure service principal | `{"clientId":"...","clientSecret":"..."}` | ✅ Yes |

## Variables That Are Now Hardcoded

### Frontend (Hardcoded in package.json):
- ✅ **NODE_ENV**: Hardcoded to `production` in build scripts
- ✅ **GENERATE_SOURCEMAP**: Hardcoded to `false` in build scripts  
- ✅ **CI**: Hardcoded to `false` in build scripts
- ✅ **REACT_APP_APP_NAME**: Not used in the application

### Backend (Hardcoded in appsettings.json):
- ✅ **ASPNETCORE_ENVIRONMENT**: Set in Azure App Service configuration
- ✅ **JWT_Issuer**: Hardcoded to `https://medicaltrackerbackend.azurewebsites.net`
- ✅ **JWT_Audience**: Hardcoded to `https://medicaltracker.azurewebsites.net`
- ✅ **JWT_ExpiryInMinutes**: Hardcoded to `1440` (24 hours)
- ✅ **CORS_AllowedOrigins**: Hardcoded with production and development URLs
- ✅ **Logging_LogLevel_Default**: Hardcoded to `Information`
- ✅ **Logging_LogLevel_Microsoft.AspNetCore**: Hardcoded to `Warning`

## Setting Environment Variables

### Frontend (Azure App Service) - Only 2 Variables Needed!

```bash
# Set frontend environment variables
az webapp config appsettings set \
  --name medicaltracker \
  --resource-group medical-tracker-rg \
  --settings \
    REACT_APP_API_URL=https://medicaltrackerbackend.azurewebsites.net/api \
    REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (Azure App Service) - Only 4 Variables Needed!

```bash
# Set backend environment variables
az webapp config appsettings set \
  --name medicaltrackerbackend \
  --resource-group medical-tracker-rg \
  --settings \
    ConnectionStrings_DefaultConnection="Server=your-sql-server.database.windows.net;Database=MedicalTracker;User Id=your-username;Password=your-password;TrustServerCertificate=true" \
    JWT_SecretKey="your-generated-jwt-secret-key" \
    GOOGLE_ClientId=your-google-client-id \
    GOOGLE_ClientSecret=your-google-client-secret
```

### GitHub Secrets - Only 2 Variables Needed!

Go to your GitHub repository → Settings → Secrets and variables → Actions:

1. **AZURE_WEBAPP_PUBLISH_PROFILE**
   - Get from Azure Portal → App Service → Get publish profile
   - Copy entire XML content

2. **AZURE_CREDENTIALS** (for Docker deployment)
   ```bash
   az ad sp create-for-rbac \
     --name "medical-tracker-github-actions" \
     --role contributor \
     --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/medical-tracker-rg \
     --sdk-auth
   ```

## JWT Secret Key Generation

### Generate a Secure JWT Secret Key:

```bash
# Method 1: OpenSSL (recommended)
openssl rand -base64 64

# Method 2: PowerShell
[System.Web.Security.Membership]::GeneratePassword(64, 10)

# Method 3: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Method 4: Python
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Method 5: Online generator
# https://generate-secret.vercel.app/64
```

### Quick Setup Commands

### Frontend (2 variables)
```bash
az webapp config appsettings set \
  --name medicaltracker \
  --resource-group medical-tracker-rg \
  --settings \
    REACT_APP_API_URL=https://medicaltrackerbackend.azurewebsites.net/api \
    REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (4 variables)
```bash
az webapp config appsettings set \
  --name medicaltrackerbackend \
  --resource-group medical-tracker-rg \
  --settings \
    ConnectionStrings_DefaultConnection="your-connection-string" \
    JWT_SecretKey="your-generated-jwt-secret" \
    GOOGLE_ClientId=your-google-client-id \
    GOOGLE_ClientSecret=your-google-client-secret
```

## Summary

**Total Environment Variables Needed: 8**
- Frontend: 2 variables
- Backend: 4 variables  
- GitHub Secrets: 2 variables

**Variables Removed: 10**
- Frontend: 4 variables (hardcoded in build scripts)
- Backend: 6 variables (hardcoded in appsettings.json)

This simplified approach reduces configuration complexity by 55% while maintaining all necessary functionality!

## Security Best Practices for JWT

1. **Generate a strong secret key** (64+ characters)
2. **Never commit the secret key** to version control
3. **Use different keys** for development and production
4. **Rotate keys regularly** (every 6-12 months)
5. **Store keys securely** in Azure Key Vault for production 
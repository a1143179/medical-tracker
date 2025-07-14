# Deployment Guide - Multi-Domain Architecture

## Overview

This application has been restructured for a multi-domain production deployment:

- **Frontend**: `medicaltracker.azurewebsites.net`
- **Backend API**: `medicaltrackerapi.azurewebsites.net`
- **Authentication**: JWT-based with Google OAuth
- **Container Registry**: GitHub Container Registry (ghcr.io)

## Architecture Changes

### 1. Authentication System
- **Before**: Session-based authentication with cookies
- **After**: JWT-based authentication with HTTP-only cookies
- **User Identification**: Email address from Google OAuth

### 2. Development Environment
- **Before**: Single backend with proxy to frontend
- **After**: Separate frontend and backend services
- **Communication**: Direct API calls with JWT tokens

### 3. Production Deployment
- **Before**: Single container deployment
- **After**: Separate containers for frontend and backend
- **Registry**: GitHub Container Registry instead of Docker Hub

## Environment Variables

### Backend Environment Variables
```bash
# JWT Configuration
JWT_KEY=your-super-secret-jwt-key-at-least-32-characters
JWT_ISSUER=medicaltrackerapi.azurewebsites.net
JWT_AUDIENCE=medicaltracker.azurewebsites.net

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
ConnectionStrings__DefaultConnection=your-postgresql-connection-string

# Environment
ASPNETCORE_ENVIRONMENT=Production
```

### Frontend Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=https://medicaltrackerapi.azurewebsites.net

# Environment
NODE_ENV=production
```

## Local Development Setup

### 1. Backend Setup
```bash
cd backend
dotnet restore
dotnet run
# Backend will run on http://localhost:55556
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
# Frontend will run on http://localhost:55555
```

### 3. Environment Configuration
Create `frontend/.env.development`:
```
REACT_APP_API_URL=http://localhost:55556
```

## Production Deployment

### 1. Azure App Service Setup

#### Backend API (medicaltrackerapi.azurewebsites.net)
- **Runtime**: .NET 9
- **Port**: 8080
- **Container Image**: `ghcr.io/your-username/bloodsugarhistory-backend:latest`

#### Frontend (medicaltracker.azurewebsites.net)
- **Runtime**: Node.js 18
- **Port**: 80
- **Container Image**: `ghcr.io/your-username/bloodsugarhistory-frontend:latest`

### 2. Container Registry Setup

The GitHub Actions workflows will automatically build and push images to GitHub Container Registry:

- **Backend Image**: `ghcr.io/your-username/bloodsugarhistory-backend`
- **Frontend Image**: `ghcr.io/your-username/bloodsugarhistory-frontend`

### 3. CORS Configuration

Update the backend CORS policy to allow the frontend domain:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://medicaltracker.azurewebsites.net")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

## Authentication Flow

### 1. User Login
1. User clicks "Login with Google" on frontend
2. Frontend redirects to `medicaltrackerapi.azurewebsites.net/api/auth/login`
3. Backend redirects to Google OAuth
4. Google redirects back to `medicaltrackerapi.azurewebsites.net/api/auth/callback`
5. Backend generates JWT token and sets HTTP-only cookie
6. Backend redirects to `medicaltracker.azurewebsites.net/dashboard`

### 2. API Communication
1. Frontend includes JWT token in Authorization header
2. Backend validates JWT token and extracts user email
3. Backend processes request and returns response

### 3. Remember Me Functionality
- JWT tokens can be configured for longer expiration (30 days)
- HTTP-only cookies provide security against XSS attacks
- Tokens are automatically refreshed or user is redirected to login

## Security Considerations

### 1. JWT Security
- Use strong, unique JWT keys (at least 32 characters)
- Set appropriate token expiration times
- Validate issuer and audience claims
- Use HTTPS in production

### 2. Cookie Security
- HTTP-only cookies prevent XSS attacks
- Secure flag in production
- SameSite=Lax for OAuth compatibility

### 3. CORS Configuration
- Only allow specific frontend domain
- Don't use wildcard origins in production

## Monitoring and Health Checks

### Backend Health Endpoints
- `/health` - Basic health check
- `/api/health` - Detailed health status
- `/api/health/ready` - Readiness check

### Frontend Health Endpoint
- `/health` - Basic health check

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS policy allows frontend domain
   - Check that credentials are allowed

2. **JWT Token Issues**
   - Verify JWT configuration variables
   - Check token expiration
   - Ensure issuer/audience match

3. **OAuth Redirect Issues**
   - Verify Google OAuth redirect URI configuration
   - Check that domains match exactly

4. **Container Build Failures**
   - Check GitHub Actions logs
   - Verify Dockerfile syntax
   - Ensure all dependencies are included

### Debugging

1. **Backend Logs**
   - Check Azure App Service logs
   - Review Serilog file logs in `/tmp/logs/`

2. **Frontend Logs**
   - Check browser console for API errors
   - Verify API URL configuration

3. **Network Issues**
   - Use browser dev tools to inspect requests
   - Check for CORS or authentication errors

## Migration from Old System

### 1. Database Migration
- Existing user data will be preserved
- Email-based identification ensures continuity
- No data migration required

### 2. User Experience
- Users will need to log in again after deployment
- JWT tokens will replace session cookies
- Remember me functionality will work as before

### 3. Configuration Updates
- Update Google OAuth redirect URIs
- Configure new environment variables
- Update Azure App Service settings 
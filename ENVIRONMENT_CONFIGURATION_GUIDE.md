# Environment Configuration Guide

This guide explains how the application handles different environments (development vs production) for JWT, CORS, and API URLs.

## Environment-Specific Configuration

### Development Environment (Local)

**Backend Configuration** (`appsettings.Development.json`):
```json
{
  "JWT": {
    "Issuer": "https://localhost:55556",
    "Audience": "https://localhost:55555"
  },
  "CORS": {
    "AllowedOrigins": [
      "https://localhost:55556",
      "http://localhost:55556",
      "http://localhost:3000",
      "https://medicaltracker.azurewebsites.net"
    ]
  }
}
```

**Frontend Configuration** (`src/config/environment.js`):
```javascript
{
  development: {
    apiUrl: 'http://localhost:55556',
    environment: 'development'
  }
}
```

### Production Environment (Azure)

**Backend Configuration** (`appsettings.json`):
```json
{
  "JWT": {
    "Issuer": "https://medicaltrackerbackend.azurewebsites.net",
    "Audience": "https://medicaltracker.azurewebsites.net"
  },
  "CORS": {
    "AllowedOrigins": [
      "https://medicaltracker.azurewebsites.net",
      "http://localhost:3000",
      "http://localhost:55555"
    ]
  }
}
```

**Frontend Configuration** (`src/config/environment.js`):
```javascript
{
  production: {
    apiUrl: 'https://medicaltrackerbackend.azurewebsites.net',
    environment: 'production'
  }
}
```

## How Environment Detection Works

### Backend (.NET)
- **Development**: Uses `appsettings.Development.json` when `ASPNETCORE_ENVIRONMENT=Development`
- **Production**: Uses `appsettings.json` when `ASPNETCORE_ENVIRONMENT=Production`

### Frontend (React)
- **Development**: Uses `development` config when `NODE_ENV=development`
- **Production**: Uses `production` config when `NODE_ENV=production`

## Local Development Setup

### 1. Backend (Port 55556)
```bash
# Set environment to Development
set ASPNETCORE_ENVIRONMENT=Development

# Run the backend
cd backend
dotnet run
```

**JWT Configuration:**
- Issuer: `https://localhost:55556`
- Audience: `https://localhost:55555`
- Secret: `dev-secret-key-for-local-development-only-change-in-production`

### 2. Frontend (Port 55555)
```bash
# Set environment to development
set NODE_ENV=development

# Run the frontend
cd frontend
npm start
```

**API Configuration:**
- API URL: `http://localhost:55556`

## Production Deployment

### 1. Backend (Azure App Service)
```bash
# Set environment to Production
az webapp config appsettings set \
  --name medicaltrackerbackend \
  --resource-group medical-tracker-rg \
  --settings ASPNETCORE_ENVIRONMENT=Production
```

**JWT Configuration:**
- Issuer: `https://medicaltrackerbackend.azurewebsites.net`
- Audience: `https://medicaltracker.azurewebsites.net`
- Secret: Set via environment variable `JWT_SecretKey`

### 2. Frontend (Azure App Service)
```bash
# Set environment to production
az webapp config appsettings set \
  --name medicaltracker \
  --resource-group medical-tracker-rg \
  --settings NODE_ENV=production
```

**API Configuration:**
- API URL: `https://medicaltrackerbackend.azurewebsites.net`

## Environment Variables Summary

### Development (Local)
| Variable | Value |
|----------|-------|
| Backend URL | `http://localhost:55556` |
| Frontend URL | `http://localhost:55555` |
| JWT Issuer | `https://localhost:55556` |
| JWT Audience | `https://localhost:55555` |

### Production (Azure)
| Variable | Value |
|----------|-------|
| Backend URL | `https://medicaltrackerbackend.azurewebsites.net` |
| Frontend URL | `https://medicaltracker.azurewebsites.net` |
| JWT Issuer | `https://medicaltrackerbackend.azurewebsites.net` |
| JWT Audience | `https://medicaltracker.azurewebsites.net` |

## Troubleshooting

### Common Issues

1. **JWT Token Validation Fails**
   - Check that issuer/audience match between frontend and backend
   - Verify environment variables are set correctly

2. **CORS Errors**
   - Ensure frontend URL is in CORS allowed origins
   - Check that backend is running on correct port

3. **API Calls Fail**
   - Verify API URL in frontend environment config
   - Check that backend is accessible

### Debug Commands

```bash
# Check backend environment
echo $env:ASPNETCORE_ENVIRONMENT

# Check frontend environment
echo $env:NODE_ENV

# Test backend connectivity
curl http://localhost:55556/api/health

# Test frontend connectivity
curl http://localhost:55555
```

## Security Notes

1. **Development JWT Secret**: Uses a simple secret for local development
2. **Production JWT Secret**: Must be a strong, randomly generated key
3. **HTTPS**: Production uses HTTPS, development can use HTTP
4. **CORS**: Development allows both HTTP and HTTPS, production only HTTPS

## Quick Environment Switch

### To Development
```bash
# Backend
set ASPNETCORE_ENVIRONMENT=Development
dotnet run

# Frontend
set NODE_ENV=development
npm start
```

### To Production
```bash
# Backend
set ASPNETCORE_ENVIRONMENT=Production
dotnet run

# Frontend
set NODE_ENV=production
npm run build
```

This configuration ensures that your application works seamlessly in both local development and production environments! 🎉 
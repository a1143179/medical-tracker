# Environment Setup Guide

This document explains how to set up environment variables for different deployment environments.

## Environment Configuration

### Development
- **Environment**: Development mode
- **Database**: Local PostgreSQL or SQLite
- **Authentication**: Google OAuth (development credentials)

### Production
- **Environment**: Production mode
- **Database**: Production PostgreSQL
- **Authentication**: Google OAuth (production credentials)

## Local Development Setup

### 1. Set Environment Variables

#### Windows (PowerShell)
```powershell
$env:ASPNETCORE_ENVIRONMENT="Development"
$env:GOOGLE_CLIENT_ID="your_google_client_id"
$env:GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

#### Windows (Command Prompt)
```cmd
set ASPNETCORE_ENVIRONMENT=Development
set GOOGLE_CLIENT_ID=your_google_client_id
set GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### macOS/Linux
```bash
export ASPNETCORE_ENVIRONMENT="Development"
export GOOGLE_CLIENT_ID="your_google_client_id"
export GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 2. Run the Application
```bash
# Backend
cd backend
dotnet run

# Frontend (in another terminal)
cd frontend
npm start
```

## GitHub Repository Secrets

### How to Add Secrets to GitHub

1. **Go to your GitHub repository**
2. **Navigate to Settings > Secrets and variables > Actions**
3. **Click "New repository secret"**
4. **Add the following secrets:**

#### For Production
- **Name**: `GOOGLE_CLIENT_ID`
- **Value**: Your production Google OAuth client ID

- **Name**: `GOOGLE_CLIENT_SECRET`
- **Value**: Your production Google OAuth client secret

- **Name**: `AZURE_CREDENTIALS`
- **Value**: Your Azure service principal credentials (JSON)

### How GitHub Uses These Secrets

The GitHub Actions workflow automatically:
1. **Tests**: Uses development credentials for all tests
2. **Production Deployment**: Uses production credentials when deploying from `main` branch

## Environment Variable Priority

The application uses the following priority for configuration:

1. **Environment Variables** (highest priority)
   - `ASPNETCORE_ENVIRONMENT`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

2. **Configuration Files** (fallback)
   - `appsettings.Development.json` (for development)
   - `appsettings.json` (for production)

## Security Best Practices

### ✅ Do's
- Use different Google OAuth credentials for development and production
- Store secrets in GitHub repository secrets (never commit to code)
- Use environment-specific configuration files
- Rotate credentials regularly

### ❌ Don'ts
- Never commit secrets to source code
- Never use production credentials in development
- Never share secrets in logs or error messages
- Never use the same credentials for development and production

## Troubleshooting

### Common Issues

1. **"Google OAuth configuration missing" error**
   - Check that environment variables are set correctly
   - Verify the variable names match exactly

2. **Authentication not working in development**
   - Ensure Google OAuth credentials are valid
   - Check that redirect URIs are configured correctly

3. **GitHub Actions failing**
   - Verify secrets are added to GitHub repository
   - Check that secret names match the workflow file

### Testing Application Functionality

```bash
# Test backend health
curl http://localhost:55555/api/health

# Test frontend
curl http://localhost:55556
```

## Google OAuth Setup

### Development Account
1. Create a new Google Cloud project for development
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials
4. Set up authorized redirect URIs

### Production Account
1. Create a separate Google Cloud project for production
2. Configure production OAuth consent screen
3. Create production OAuth 2.0 credentials
4. Set up production redirect URIs 
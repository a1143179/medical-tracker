# Environment Setup Guide

This document explains how to set up environment variables for different deployment environments.

## Environment Configuration

### Development
- **Mailjet Account**: Development account (sandbox mode)
- **Environment Variables**: `MAILJET_API_KEY`, `MAILJET_API_SECRET`
- **Sandbox Mode**: Enabled (emails don't reach real users)

### Production
- **Mailjet Account**: Production account (real delivery)
- **Environment Variables**: `MAILJET_PRODUCTION_API_KEY`, `MAILJET_PRODUCTION_API_SECRET`
- **Sandbox Mode**: Disabled (emails sent to real users)

## Local Development Setup

### 1. Set Environment Variables

#### Windows (PowerShell)
```powershell
$env:MAILJET_API_KEY="your_api_key"
$env:MAILJET_API_SECRET="your_api_secret"
```

#### Windows (Command Prompt)
```cmd
set MAILJET_API_KEY=your_api_key
set MAILJET_API_SECRET=your_api_secret
```

#### macOS/Linux
```bash
export MAILJET_API_KEY="your_api_key"
export MAILJET_API_SECRET="your_api_secret"
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
- **Name**: `MAILJET_PRODUCTION_API_KEY`
- **Value**: Your production Mailjet API key

- **Name**: `MAILJET_PRODUCTION_API_SECRET`
- **Value**: Your production Mailjet API secret

### How GitHub Uses These Secrets

The GitHub Actions workflow automatically:
1. **Tests**: Uses development credentials for all tests
2. **Production Deployment**: Uses production credentials when deploying from `main` branch

## Environment Variable Priority

The application uses the following priority for Mailjet configuration:

1. **Environment Variables** (highest priority)
   - `MAILJET_API_KEY` / `MAILJET_API_SECRET` (development)
   - `MAILJET_PRODUCTION_API_KEY` / `MAILJET_PRODUCTION_API_SECRET` (production)

2. **Configuration Files** (fallback)
   - `appsettings.Development.json` (for development)
   - `appsettings.json` (for production)

## Security Best Practices

### ✅ Do's
- Use different Mailjet accounts for development and production
- Store secrets in GitHub repository secrets (never commit to code)
- Use sandbox mode for development and testing
- Rotate API keys regularly

### ❌ Don'ts
- Never commit API keys to source code
- Never use production credentials in development
- Never share API keys in logs or error messages
- Never use the same account for development and production

## Troubleshooting

### Common Issues

1. **"Mailjet configuration missing" error**
   - Check that environment variables are set correctly
   - Verify the variable names match exactly

2. **Emails not sending in development**
   - Ensure sandbox mode is enabled
   - Check that API credentials are valid

3. **GitHub Actions failing**
   - Verify secrets are added to GitHub repository
   - Check that secret names match the workflow file

### Testing Email Functionality

```bash
# Test email sending (development)
curl -X POST http://localhost:5000/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Test email"}'

# Retrieve test codes
curl http://localhost:5000/api/test/retrieve-codes
```

## Mailjet Account Setup

### Development Account
1. Create a new Mailjet account for development
2. Enable sandbox mode
3. Use free tier (sufficient for development/testing)
4. Set up test email addresses

### Production Account
1. Create a separate Mailjet account for production
2. Disable sandbox mode
3. Configure proper sending domains
4. Set up email templates and tracking 
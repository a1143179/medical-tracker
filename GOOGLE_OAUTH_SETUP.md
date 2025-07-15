# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth credentials for the Blood Sugar History application.

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

## Step 2: Enable Required APIs

1. In the left sidebar, click on **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** and click on it
3. Click **"Enable"** button
4. Also search for and enable **"Google Identity"** if available

## Step 3: Create OAuth 2.0 Credentials

1. In the left sidebar, click on **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** button
3. Select **"OAuth 2.0 Client IDs"**

## Step 4: Configure OAuth Consent Screen

If this is your first OAuth app, you'll need to configure the consent screen:

1. Choose **"External"** user type (unless you have a Google Workspace)
2. Fill in the required information:
   - **App name**: "Blood Sugar History"
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
3. Click **"Save and Continue"**
4. Skip adding scopes for now, click **"Save and Continue"**
5. Add test users if needed, click **"Save and Continue"**
6. Review and click **"Back to Dashboard"**

## Step 5: Create OAuth 2.0 Client ID

1. Click **"Create Credentials"** > **"OAuth 2.0 Client IDs"**
2. Choose **"Web application"** as the application type
3. Give it a name like **"Blood Sugar History - Development"**

## Step 6: Configure Authorized Redirect URIs

Add these redirect URIs:

**For Development:**
- `http://localhost:3000/api/auth/callback`

**For Production (when you deploy):**
- `https://yourdomain.com/api/auth/callback`
- `https://medicaltracker.azurewebsites.net/api/auth/callback`

## Step 7: Configure Authorized JavaScript Origins

Add these JavaScript origins:

**For Development:**
- `http://localhost:3000`

**For Production (when you deploy):**
- `https://yourdomain.com`
- `https://medicaltracker.azurewebsites.net`

## Step 8: Get Your Credentials

1. Click **"Create"**
2. You'll see a popup with your credentials:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value (click "Show" if hidden)

## Step 9: Add Credentials to Your App

1. Open `backend/appsettings.Development.json`
2. Replace the placeholder values:

```json
{
  "Google": {
    "ClientId": "YOUR_ACTUAL_CLIENT_ID_HERE",
    "ClientSecret": "YOUR_ACTUAL_CLIENT_SECRET_HERE",
    ...
  }
}
```

## Step 10: Test Your Setup

1. Start your application:
   ```bash
   # Windows
   start-dev.bat
   
   # Linux/Mac
   ./start-dev.sh
   ```

2. Go to `http://localhost:3000`
3. Click the "Sign in with Google" button
4. You should be redirected to Google's login page

## Troubleshooting

### "Missing required parameter: client_id"
- Make sure you've added your actual Client ID to `appsettings.Development.json`
- Check that the Client ID is not empty or contains placeholder text

### "redirect_uri_mismatch"
- Verify that `http://localhost:3000/api/auth/callback` is added to your Google OAuth redirect URIs
- Make sure there are no extra spaces or typos

### "invalid_client"
- Check that your Client Secret is correct
- Make sure you're using the right credentials for the right environment

## Security Notes

- Never commit your `appsettings.Development.json` file to version control
- The file is already in `.gitignore` to prevent accidental commits
- For production, use environment variables instead of config files

## Next Steps

Once you have OAuth working locally:
1. Test the full login flow
2. Verify that user sessions are created properly
3. Check that the dashboard loads after login
4. Test logout functionality

## Need Help?

If you encounter issues:
1. Check the browser's developer console for errors
2. Check the backend logs for detailed error messages
3. Verify your Google OAuth configuration matches this guide exactly
4. Make sure your application is running on the correct port (3000) 
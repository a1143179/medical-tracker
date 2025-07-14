@echo off
echo ========================================
echo GitHub Actions Setup for Medical Tracker
echo ========================================
echo.

echo Step 1: Get Azure Publish Profile
echo ----------------------------------
echo 1. Go to Azure Portal
echo 2. Navigate to your App Service: medicaltrackerfrontend
echo 3. Click "Get publish profile"
echo 4. Download the .publishsettings file
echo 5. Open the file and copy ALL content
echo.

echo Step 2: Configure GitHub Secrets
echo ---------------------------------
echo 1. Go to your GitHub repository
echo 2. Click Settings ^> Secrets and variables ^> Actions
echo 3. Click "New repository secret"
echo 4. Name: AZURE_WEBAPP_PUBLISH_PROFILE
echo 5. Value: Paste the publish profile content
echo.

echo Step 3: Test Deployment
echo ------------------------
echo 1. Make a small change to frontend/README.md
echo 2. Commit and push to main branch
echo 3. Check GitHub Actions tab for deployment status
echo 4. Visit: https://medicaltrackerfrontend.azurewebsites.net
echo.

echo ========================================
echo Setup Complete!
echo ========================================
pause 
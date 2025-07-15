@echo off
echo ========================================
echo Azure Credentials Generator for GitHub Actions
echo ========================================
echo.

echo Step 1: Getting your subscription ID...
for /f "tokens=*" %%i in ('az account show --query id --output tsv') do set SUBSCRIPTION_ID=%%i
echo Your subscription ID: %SUBSCRIPTION_ID%
echo.

echo Step 2: Creating service principal...
echo.
echo Running command:
echo az ad sp create-for-rbac --name "medical-tracker-github-actions" --role contributor --scopes /subscriptions/%SUBSCRIPTION_ID%/resourceGroups/ResourceGroup1 --sdk-auth
echo.

az ad sp create-for-rbac --name "medical-tracker-github-actions" --role contributor --scopes /subscriptions/%SUBSCRIPTION_ID%/resourceGroups/ResourceGroup1 --sdk-auth

echo.
echo ========================================
echo Instructions:
echo ========================================
echo 1. Copy the JSON output above (everything between { and })
echo 2. Go to your GitHub repository
echo 3. Settings ^> Secrets and variables ^> Actions
echo 4. Click "New repository secret"
echo 5. Name: AZURE_CREDENTIALS
echo 6. Value: Paste the JSON output
echo 7. Click "Add secret"
echo.
echo ========================================
echo Note: Keep these credentials secure!
echo ========================================
pause 
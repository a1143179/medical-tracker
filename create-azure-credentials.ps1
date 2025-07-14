# PowerShell script to create Azure credentials batch files

$content = @'
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
echo az ad sp create-for-rbac --name "medical-tracker-github-actions" --role contributor --scopes /subscriptions/%SUBSCRIPTION_ID%/resourceGroups/medical-tracker-rg --sdk-auth
echo.

az ad sp create-for-rbac --name "medical-tracker-github-actions" --role contributor --scopes /subscriptions/%SUBSCRIPTION_ID%/resourceGroups/medical-tracker-rg --sdk-auth

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
'@

# Create the files
$frontendPath = "D:\workspace\medical-tracker-frontend\generate-azure-credentials.bat"
$backendPath = "D:\workspace\medical-tracker-backend\generate-azure-credentials.bat"

# Ensure directories exist
$frontendDir = Split-Path $frontendPath -Parent
$backendDir = Split-Path $backendPath -Parent

if (!(Test-Path $frontendDir)) {
    New-Item -ItemType Directory -Path $frontendDir -Force
    Write-Host "Created directory: $frontendDir"
}

if (!(Test-Path $backendDir)) {
    New-Item -ItemType Directory -Path $backendDir -Force
    Write-Host "Created directory: $backendDir"
}

# Write the files
$content | Out-File -FilePath $frontendPath -Encoding ASCII
$content | Out-File -FilePath $backendPath -Encoding ASCII

Write-Host "Files created successfully!"
Write-Host "Frontend: $frontendPath"
Write-Host "Backend: $backendPath" 
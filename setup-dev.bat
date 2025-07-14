@echo off
echo Setting up Blood Sugar History development environment...
echo.

REM Check if appsettings.Development.json already exists
if exist "backend\appsettings.Development.json" (
    echo appsettings.Development.json already exists.
    echo If you need to reset it, delete the file and run this script again.
    echo.
) else (
    echo Creating appsettings.Development.json from template...
    copy "backend\appsettings.Development.template.json" "backend\appsettings.Development.json"
    echo.
    echo IMPORTANT: You need to add your Google OAuth credentials to backend\appsettings.Development.json
    echo Replace the placeholder values with your actual credentials:
    echo - YOUR_GOOGLE_CLIENT_ID_HERE
    echo - YOUR_GOOGLE_CLIENT_SECRET_HERE
    echo.
    echo See README.md for detailed setup instructions.
    echo.
)

echo Development environment setup complete!
echo.
echo Next steps:
echo 1. Add your Google OAuth credentials to backend\appsettings.Development.json
echo 2. Run start-dev.bat to start the application
echo.
pause 
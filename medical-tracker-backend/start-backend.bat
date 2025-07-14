@echo off
echo Starting Medical Tracker Backend...

REM Check if port 55556 is already in use
netstat -an | findstr ":55556" >nul
if %errorlevel% equ 0 (
    echo Port 55556 is already in use. Skipping backend startup.
    goto :end
)

echo Port 55556 is available. Starting backend...

REM Restore packages
echo Restoring packages...
dotnet restore

REM Start the backend
echo Starting backend on port 55556...
dotnet run

:end
echo Backend startup complete. 
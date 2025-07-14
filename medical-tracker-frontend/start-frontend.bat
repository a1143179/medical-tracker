@echo off
echo Starting Medical Tracker Frontend...

REM Check if port 55555 is already in use
netstat -an | findstr ":55555" >nul
if %errorlevel% equ 0 (
    echo Port 55555 is already in use. Skipping frontend startup.
    goto :end
)

echo Port 55555 is available. Starting frontend...

REM Install dependencies
echo Installing dependencies...
npm install

REM Start the frontend
echo Starting frontend on port 55555...
npm start

:end
echo Frontend startup complete. 
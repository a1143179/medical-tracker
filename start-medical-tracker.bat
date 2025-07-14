@echo off
echo ========================================
echo Medical Tracker Development Environment
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Starting Medical Tracker services...
echo.

REM Check if PostgreSQL container is already running
docker ps | findstr "medical-tracker-db" >nul
if %errorlevel% neq 0 (
    echo Starting PostgreSQL database...
    
    REM Check if port 5432 is already in use
    netstat -an | findstr ":5432" >nul
    if %errorlevel% equ 0 (
        echo Port 5432 is already in use. Skipping database startup.
    ) else (
        REM Start PostgreSQL container
        docker run --name medical-tracker-db -e POSTGRES_DB=medicaltracker -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
        if %errorlevel% equ 0 (
            echo PostgreSQL started successfully on port 5432
        ) else (
            echo ERROR: Failed to start PostgreSQL container
        )
    )
) else (
    echo PostgreSQL container is already running
)

echo.

REM Start backend
echo Starting backend service...
cd medical-tracker-backend
call start-backend.bat
cd ..

echo.

REM Start frontend
echo Starting frontend service...
cd medical-tracker-frontend
call start-frontend.bat
cd ..

echo.
echo ========================================
echo All services started!
echo ========================================
echo Frontend: http://localhost:55555
echo Backend:  http://localhost:55556
echo Database: localhost:5432
echo.
echo Press any key to exit...
pause >nul 
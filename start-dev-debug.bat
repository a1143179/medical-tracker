@echo off
setlocal enabledelayedexpansion

echo [DEBUG] Script started

REM Initialize service flags
set "RUN_DB=false"
set "RUN_BACKEND=false"
set "RUN_FRONTEND=false"

echo [DEBUG] Parsing arguments...

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_services
if "%~1"=="--db" set "RUN_DB=true"
if "%~1"=="--backend" set "RUN_BACKEND=true"
if "%~1"=="--frontend" set "RUN_FRONTEND=true"
shift
goto :parse_args

:start_services
echo [DEBUG] In start_services
REM If no arguments provided, start all services
if "%RUN_DB%"=="false" if "%RUN_BACKEND%"=="false" if "%RUN_FRONTEND%"=="false" (
  set "RUN_DB=true"
  set "RUN_BACKEND=true"
  set "RUN_FRONTEND=true"
)

echo [DEBUG] RUN_DB=%RUN_DB%, RUN_BACKEND=%RUN_BACKEND%, RUN_FRONTEND=%RUN_FRONTEND%

REM Display what services will be started
echo [DEBUG] Building START_MSG...
set "START_MSG=Starting: "
echo [DEBUG] START_MSG after initial set: "%START_MSG%"
if "%RUN_DB%"=="true" (
  set "START_MSG=!START_MSG!Database "
  echo [DEBUG] START_MSG after adding Database: "%START_MSG%"
)
if "%RUN_BACKEND%"=="true" (
  set "START_MSG=!START_MSG!Backend "
  echo [DEBUG] START_MSG after adding Backend: "%START_MSG%"
)
if "%RUN_FRONTEND%"=="true" (
  set "START_MSG=!START_MSG!Frontend "
  echo [DEBUG] START_MSG after adding Frontend: "%START_MSG%"
)
echo [DEBUG] About to echo START_MSG: "%START_MSG%"
echo !START_MSG!
echo [DEBUG] After echoing START_MSG

REM Function to check if a command exists
:command_exists
set cmd=%~1
where %cmd% >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)
goto :eof

REM Function to check if Docker is running
:check_docker
echo [DEBUG] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker first.
    exit /b 1
)
echo Docker is running
exit /b 0
goto :eof

REM Check prerequisites
echo [DEBUG] Checking prerequisites...

REM Check if Docker is running (only if we need database)
if "%RUN_DB%"=="true" (
  echo [DEBUG] About to check Docker...
  call :check_docker
  echo [DEBUG] Docker check returned: %errorlevel%
  if %errorlevel% neq 0 (
    echo [DEBUG] Docker check failed, exiting
    exit /b 1
  )
  echo [DEBUG] Docker check passed
)

REM Check if Node.js is installed (only if we need frontend)
if "%RUN_FRONTEND%"=="true" (
  echo [DEBUG] Checking Node.js...
  call :command_exists node
  if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
  )
  echo Node.js found
)

REM Check if .NET is installed (only if we need backend)
if "%RUN_BACKEND%"=="true" (
  echo [DEBUG] Checking .NET...
  call :command_exists dotnet
  if %errorlevel% neq 0 (
    echo .NET SDK is not installed. Please install .NET SDK first.
    exit /b 1
  )
  echo .NET SDK found
)

echo [DEBUG] Prerequisites check completed
echo Checking ports...

REM Start PostgreSQL (port 5432)
if "%RUN_DB%"=="true" (
  echo [DEBUG] Starting database section
  echo Checking port 5432 for database...
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5432 " ^| findstr LISTENING') do (
    echo Port 5432 is already in use by PID %%a
    set SKIP_DB=1
    goto :db_skip
  )
  set SKIP_DB=0
  echo Port 5432 is available
  echo Starting PostgreSQL...
  
  REM Check if PostgreSQL container already exists
  docker ps -a --format "table {{.Names}}" | findstr "bloodsugar-postgres" >nul 2>&1
  if %errorlevel% equ 0 (
      echo PostgreSQL container exists, starting it...
      docker start bloodsugar-postgres
      set POSTGRES_CONTAINER=bloodsugar-postgres
  ) else (
      echo Creating PostgreSQL container...
      docker run -d --name bloodsugar-postgres -e POSTGRES_DB=bloodsugar -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15
      set POSTGRES_CONTAINER=bloodsugar-postgres
  )
  
  REM Wait for PostgreSQL to be ready
  echo Waiting for PostgreSQL to be ready...
  :wait_for_postgres
  docker exec !POSTGRES_CONTAINER! pg_isready -U postgres >nul 2>&1
  if %errorlevel% neq 0 (
      echo -n .
      timeout /t 1 /nobreak >nul
      goto wait_for_postgres
  )
  echo.
  echo PostgreSQL is ready
  goto :db_done
)

:db_skip
if "%RUN_DB%"=="true" (
  echo Skipping database startup because port 5432 is in use.
)
:db_done

echo [DEBUG] Database section completed, SKIP_DB=!SKIP_DB!

REM Start backend (port 3000)
if "%RUN_BACKEND%"=="true" (
  echo [DEBUG] Starting backend section
  echo Checking port 3000 for backend...
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do (
    echo Port 3000 is already in use by PID %%a
    set SKIP_BACKEND=1
    goto :backend_skip
  )
  set SKIP_BACKEND=0
  echo Port 3000 is available
  echo Starting backend with hot reload...
  cd backend
  set DOTNET_ENVIRONMENT=Development
  set ASPNETCORE_URLS=http://localhost:3000
  start "backend" dotnet watch run
  cd ..
  timeout /t 5 /nobreak >nul
  curl -s http://localhost:3000/api/health >nul 2>&1
  if %errorlevel% neq 0 (
    echo Backend is starting up...
    timeout /t 10 /nobreak >nul
  )
  goto :backend_done
)

:backend_skip
if "%RUN_BACKEND%"=="true" (
  echo Skipping backend startup because port 3000 is in use.
)
:backend_done

echo [DEBUG] Backend section completed, SKIP_BACKEND=!SKIP_BACKEND!

REM Start React development server (port 3001)
if "%RUN_FRONTEND%"=="true" (
  echo [DEBUG] Starting frontend section
  echo Checking port 3001 for frontend...
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr LISTENING') do (
    echo Port 3001 is already in use by PID %%a
    set SKIP_FRONTEND=1
    goto :frontend_skip
  )
  set SKIP_FRONTEND=0
  echo Port 3001 is available
  echo Starting React development server...
  cd frontend
  
  REM Check if frontend dependencies are installed
  if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
  )
  
  REM Start React development server on port 3001
  echo Starting React development server on port 3001...
  set PORT=3001
  start "frontend" npm start
  cd ..
  goto :frontend_done
)

:frontend_skip
if "%RUN_FRONTEND%"=="true" (
  echo Skipping frontend startup because port 3001 is in use.
)
:frontend_done

echo [DEBUG] Frontend section completed, SKIP_FRONTEND=!SKIP_FRONTEND!

REM Wait for services to be ready
echo [DEBUG] Waiting for services to be ready...
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status and display results
echo [DEBUG] Starting service status check...
echo Checking service status...

set "SERVICES_RUNNING="

REM Check PostgreSQL
if "%RUN_DB%"=="true" (
  echo [DEBUG] Checking database status...
  if !SKIP_DB! equ 0 (
    echo [DEBUG] We started the database, checking if running...
    REM We started the database, check if it's running
    docker exec !POSTGRES_CONTAINER! pg_isready -U postgres >nul 2>&1
    if %errorlevel% equ 0 (
      echo PostgreSQL is running on localhost:5432
      set "SERVICES_RUNNING=!SERVICES_RUNNING!Database "
    ) else (
      echo PostgreSQL is not responding
    )
  ) else (
    echo [DEBUG] Database was skipped, checking if already running...
    REM Database was skipped, check if there's already a container running
    echo Checking if PostgreSQL is already running...
    docker ps --format "table {{.Names}}" | findstr "bloodsugar-postgres" >nul 2>&1
    if %errorlevel% equ 0 (
      echo [DEBUG] Found bloodsugar-postgres container
      docker exec bloodsugar-postgres pg_isready -U postgres >nul 2>&1
      if %errorlevel% equ 0 (
        echo PostgreSQL is already running on localhost:5432
        set "SERVICES_RUNNING=!SERVICES_RUNNING!Database "
      ) else (
        echo PostgreSQL container exists but is not responding
      )
    ) else (
      echo [DEBUG] No bloodsugar-postgres container found
      echo Database skipped (port 5432 in use, no container found)
    )
  )
)

REM Check backend
if "%RUN_BACKEND%"=="true" (
  echo [DEBUG] Checking backend status...
  if !SKIP_BACKEND! equ 0 (
    curl -s http://localhost:3000/api/health >nul 2>&1
    if %errorlevel% equ 0 (
      echo Backend is running on http://localhost:3000
      set "SERVICES_RUNNING=!SERVICES_RUNNING!Backend "
    ) else (
      echo Backend is not responding
    )
  ) else (
    echo Backend skipped (port 3000 in use)
  )
)

REM Check frontend
if "%RUN_FRONTEND%"=="true" (
  echo [DEBUG] Checking frontend status...
  if !SKIP_FRONTEND! equ 0 (
    curl -s http://localhost:3001 >nul 2>&1
    if %errorlevel% equ 0 (
      echo React dev server is running on http://localhost:3001
      set "SERVICES_RUNNING=!SERVICES_RUNNING!Frontend "
    ) else (
      echo React dev server is still starting up...
      echo This is normal on first run - it may take 30-60 seconds
    )
  ) else (
    echo Frontend skipped (port 3001 in use)
  )
)

echo [DEBUG] Service status check completed
echo.
echo Services started successfully!
echo.

REM Display service information based on what's running
if "%RUN_DB%"=="true" if "%RUN_BACKEND%"=="true" if "%RUN_FRONTEND%"=="true" (
  REM All services mode
  echo Application: http://localhost:3000
  echo Backend API: http://localhost:3000/api
  echo Database: localhost:5432
  echo    Database Name: bloodsugar
  echo    Username: postgres
  echo    Password: password
  echo.
  echo Development Setup:
  echo   • Backend runs on port 3000 with hot reload
  echo   • React dev server runs on port 3001
  echo   • Backend proxies frontend requests to React dev server
  echo   • All requests go through localhost:3000 (same domain)
  
) else if "%RUN_BACKEND%"=="true" if "%RUN_FRONTEND%"=="true" (
  REM Backend + Frontend mode
  echo Application: http://localhost:3000
  echo Backend API: http://localhost:3000/api
  echo Development Setup:
  echo   • Backend runs on port 3000 with hot reload
  echo   • React dev server runs on port 3001
  echo   • Backend proxies frontend requests to React dev server
  
) else if "%RUN_DB%"=="true" if "%RUN_BACKEND%"=="true" (
  REM Database + Backend mode
  echo Backend API: http://localhost:3000/api
  echo Database: localhost:5432
  echo    Database Name: bloodsugar
  echo    Username: postgres
  echo    Password: password
  
) else if "%RUN_DB%"=="true" if "%RUN_FRONTEND%"=="true" (
  REM Database + Frontend mode
  echo Frontend: http://localhost:3001
  echo Database: localhost:5432
  echo    Database Name: bloodsugar
  echo    Username: postgres
  echo    Password: password
  
) else if "%RUN_DB%"=="true" (
  REM Database only mode
  echo Database: localhost:5432
  echo    Database Name: bloodsugar
  echo    Username: postgres
  echo    Password: password
  
) else if "%RUN_BACKEND%"=="true" (
  REM Backend only mode
  echo Backend API: http://localhost:3000/api
  
) else if "%RUN_FRONTEND%"=="true" (
  REM Frontend only mode
  echo Frontend: http://localhost:3001
)

echo [DEBUG] Script about to end
echo.
echo Press Ctrl+C to stop all services
echo.
pause

:cleanup
echo.
echo Stopping services...
if defined POSTGRES_CONTAINER (
  docker stop !POSTGRES_CONTAINER! >nul 2>&1
  echo PostgreSQL stopped
)
exit /b 0 
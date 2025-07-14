@echo off
setlocal enabledelayedexpansion

REM Initialize service flags
set "RUN_DB=false"
set "RUN_BACKEND=false"
set "RUN_FRONTEND=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :after_parse_args
if "%~1"=="--db" set "RUN_DB=true"
if "%~1"=="--backend" set "RUN_BACKEND=true"
if "%~1"=="--frontend" set "RUN_FRONTEND=true"
shift
goto :parse_args

goto :after_parse_args

:after_parse_args
REM If no arguments provided, start all services
if "%RUN_DB%"=="false" if "%RUN_BACKEND%"=="false" if "%RUN_FRONTEND%"=="false" (
  set "RUN_DB=true"
  set "RUN_BACKEND=true"
  set "RUN_FRONTEND=true"
)

REM Check Docker is running before anything else
docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo Docker is not running or not installed. Please start Docker Desktop or install Docker from https://www.docker.com/products/docker-desktop/
  exit /b 1
)

REM Display what services will be started
set "START_MSG=Starting: "
if "%RUN_DB%"=="true" set "START_MSG=!START_MSG!Database "
if "%RUN_BACKEND%"=="true" set "START_MSG=!START_MSG!Backend "
if "%RUN_FRONTEND%"=="true" set "START_MSG=!START_MSG!Frontend "
echo !START_MSG!

REM Check prerequisites
if "%RUN_FRONTEND%"=="true" (
  setlocal enabledelayedexpansion
  for /f "delims=" %%V in ('node --version 2^>nul') do set NODE_VERSION=%%V
  echo Node.js version: !NODE_VERSION!
  echo !NODE_VERSION! | findstr /b /c:"v" >nul
  if !errorlevel! neq 0 (
    echo Node.js is not installed or not in PATH. Please install Node.js from https://nodejs.org/ or restart your terminal after installation.
    exit /b 1
  )
  endlocal
)
if "%RUN_BACKEND%"=="true" (
  where dotnet >nul 2>&1
  if %errorlevel% neq 0 (
    echo .NET SDK is not installed. Please install .NET SDK first.
    exit /b 1
  )
)

echo Checking ports...

echo Checking ports...

REM Track status for summary
set "DB_STATUS="
set "BACKEND_STATUS="
set "FRONTEND_STATUS="

REM Start PostgreSQL (port 5432)
if "%RUN_DB%"=="true" (
  echo Checking port 5432...
  set "SKIP_DB="
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5432 " ^| findstr LISTENING') do (
    set "SKIP_DB=1"
    set "DB_STATUS=SKIPPED (port 5432 in use)"
    goto :db_skip
  )
  set "DB_STATUS=STARTING"
  REM Check if PostgreSQL container already exists
  docker ps -a --format "table {{.Names}}" | findstr "bloodsugar-postgres" >nul 2>&1
  if %errorlevel% equ 0 (
      docker start bloodsugar-postgres >nul 2>&1
      set POSTGRES_CONTAINER=bloodsugar-postgres
  ) else (
      docker run -d --name bloodsugar-postgres -e POSTGRES_DB=bloodsugar -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15 >nul 2>&1
      set POSTGRES_CONTAINER=bloodsugar-postgres
  )
  :wait_for_postgres
  docker exec !POSTGRES_CONTAINER! pg_isready -U postgres >nul 2>&1
  if %errorlevel% neq 0 (
      timeout /t 1 /nobreak >nul
      goto wait_for_postgres
  )
  set "DB_STATUS=RUNNING (localhost:5432)"
  goto :db_done
)
:db_skip
:db_done

REM Start backend (port 3000)
if "%RUN_BACKEND%"=="true" (
  echo Checking port 3000...
  set "SKIP_BACKEND="
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do (
    set "SKIP_BACKEND=1"
    set "BACKEND_STATUS=SKIPPED (port 3000 in use)"
    goto :backend_skip
  )
  set "BACKEND_STATUS=STARTING"
  start "backend" cmd /c "cd backend && dotnet restore && dotnet watch run"
  timeout /t 5 /nobreak >nul
  set "BACKEND_STATUS=RUNNING (http://localhost:3000)"
  goto :backend_done
)
:backend_skip
:backend_done

REM Start React development server (port 3001)
if "%RUN_FRONTEND%"=="true" (
  echo Checking port 3001...
  set "SKIP_FRONTEND="
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr LISTENING') do (
    set "SKIP_FRONTEND=1"
    set "FRONTEND_STATUS=SKIPPED (port 3001 in use)"
    goto :frontend_skip
  )
  set "FRONTEND_STATUS=STARTING"
  start "frontend" cmd /c "cd frontend && npm install && npm start"
  timeout /t 5 /nobreak >nul
  set "FRONTEND_STATUS=RUNNING (http://localhost:3001)"
  goto :frontend_done
)
:frontend_skip
:frontend_done

echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo Checking service status...

REM Check PostgreSQL
if "%RUN_DB%"=="true" (
  if defined SKIP_DB (
    set "DB_STATUS=SKIPPED (port 5432 in use)"
  ) else (
    docker exec !POSTGRES_CONTAINER! pg_isready -U postgres >nul 2>&1
    if %errorlevel% equ 0 (
      set "DB_STATUS=RUNNING (localhost:5432)"
    ) else (
      set "DB_STATUS=NOT RESPONDING"
    )
  )
)

REM Check backend
if "%RUN_BACKEND%"=="true" (
  if defined SKIP_BACKEND (
    set "BACKEND_STATUS=SKIPPED (port 3000 in use)"
  ) else (
    curl -s http://localhost:3000/api/health >nul 2>&1
    if %errorlevel% equ 0 (
      set "BACKEND_STATUS=RUNNING (http://localhost:3000)"
    ) else (
      set "BACKEND_STATUS=NOT RESPONDING"
    )
  )
)

REM Check frontend
if "%RUN_FRONTEND%"=="true" (
  if defined SKIP_FRONTEND (
    set "FRONTEND_STATUS=SKIPPED (port 3001 in use)"
  ) else (
    curl -s http://localhost:3001 >nul 2>&1
    if %errorlevel% equ 0 (
      set "FRONTEND_STATUS=RUNNING (http://localhost:3001)"
    ) else (
      set "FRONTEND_STATUS=STARTING UP (may take 30-60 seconds on first run)"
    )
  )
)

echo.
echo Services started successfully!
echo.

REM Print status for each service
if "%RUN_DB%"=="true" echo Database: !DB_STATUS!
if "%RUN_BACKEND%"=="true" echo Backend: !BACKEND_STATUS!
if "%RUN_FRONTEND%"=="true" echo Frontend: !FRONTEND_STATUS!

echo.
REM Print summary block only once
if "%RUN_DB%"=="true" if "%RUN_BACKEND%"=="true" if "%RUN_FRONTEND%"=="true" (
  echo Application: http://localhost:3000
  echo Backend API: http://localhost:3000/api
  echo Database: localhost:5432 (bloodsugar/postgres/password)
) else if "%RUN_BACKEND%"=="true" if "%RUN_FRONTEND%"=="true" (
  echo Application: http://localhost:3000
  echo Backend API: http://localhost:3000/api
) else if "%RUN_DB%"=="true" if "%RUN_BACKEND%"=="true" (
  echo Backend API: http://localhost:3000/api
  echo Database: localhost:5432 (bloodsugar/postgres/password)
) else if "%RUN_DB%"=="true" if "%RUN_FRONTEND%"=="true" (
  echo Frontend: http://localhost:3001
  echo Database: localhost:5432 (bloodsugar/postgres/password)
) else if "%RUN_DB%"=="true" (
  echo Database: localhost:5432 (bloodsugar/postgres/password)
) else if "%RUN_BACKEND%"=="true" (
  echo Backend API: http://localhost:3000/api
) else if "%RUN_FRONTEND%"=="true" (
  echo Frontend: http://localhost:3001
)

echo.
echo Press Ctrl+C to stop backend and frontend services (database will remain running)
echo. 
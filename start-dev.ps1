param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$RUN_DB = $false
$RUN_BACKEND = $false
$RUN_FRONTEND = $false
$CHECK_PORTS = $false

if ($Args.Count -eq 0) {
    $RUN_DB = $true
    $RUN_BACKEND = $true
    $RUN_FRONTEND = $true
} else {
    foreach ($arg in $Args) {
        switch ($arg) {
            '--db' { $RUN_DB = $true }
            '--backend' { $RUN_BACKEND = $true }
            '--frontend' { $RUN_FRONTEND = $true }
            '--port' { $CHECK_PORTS = $true }
        }
    }
}

function Get-PortStatus($port) {
    $inUse = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($null -eq $inUse) { return 'Available' } else { return 'Not Available' }
}

function Test-PortAvailable($port) {
    $inUse = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    return ($null -eq $inUse)
}

# Development Environment Summary
Write-Host "=== Development Environment Summary ===" -ForegroundColor Green
Write-Host "Database (Port 5432): $(Get-PortStatus 5432)" -ForegroundColor $(if (Test-PortAvailable 5432) { 'Green' } else { 'Yellow' })
Write-Host "Backend (Port 55555): $(Get-PortStatus 55555)" -ForegroundColor $(if (Test-PortAvailable 55555) { 'Green' } else { 'Yellow' })
Write-Host "Frontend (Port 55556): $(Get-PortStatus 55556)" -ForegroundColor $(if (Test-PortAvailable 55556) { 'Green' } else { 'Yellow' })
Write-Host "=======================================" -ForegroundColor Green

# Check if Docker is running (required for any service startup)
$dockerInfo = & docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] Docker is not running or not installed. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
} else {
    Write-Host "[Info] Docker is running." -ForegroundColor Green
}

if ($CHECK_PORTS) {
    return
}

if ($RUN_DB) {
    if (Test-PortAvailable 5432) {
        Write-Host "Starting database (PostgreSQL Docker container)..."
        $exists = docker ps -a --format '{{.Names}}' | Select-String 'medicaltracker-postgres'
        if ($exists) {
            Write-Host "Starting existing DB container..."
            docker start medicaltracker-postgres | Out-Null
        } else {
            Write-Host "Running a new DB container..."
            docker run -d --name medicaltracker-postgres -e POSTGRES_DB=postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15 | Out-Null
        }
    } else {
        Write-Host "Port 5432 is already in use. Skipping database startup."
    }
}

if ($RUN_BACKEND) {
    if (Test-PortAvailable 55555) {
        Write-Host "Starting backend (watch mode, Release configuration)..."
        $env:ASPNETCORE_ENVIRONMENT = "Development"
        Start-Process -WorkingDirectory "$PSScriptRoot/backend" -FilePath "cmd.exe" -ArgumentList '/c dotnet restore && dotnet watch run -c Release && pause'
    } else {
        Write-Host "Port 55555 is already in use. Skipping backend startup."
    }
}

if ($RUN_FRONTEND) {
    if (Test-PortAvailable 55556) {
        Write-Host "Starting frontend (watch mode)..."
        Start-Process -WorkingDirectory "$PSScriptRoot/frontend" -FilePath "cmd.exe" -ArgumentList '/c npm install && npm start && pause'
    } else {
        Write-Host "Port 55556 is already in use. Skipping frontend startup."
    }
}

 
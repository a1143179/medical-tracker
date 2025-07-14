# Blood Sugar History Tracker

A comprehensive blood sugar tracking application with React frontend and .NET backend.

## Quick Start

### Prerequisites

- **Docker Desktop** - For PostgreSQL database
- **Node.js** (v16+) - For React frontend
- **.NET 9 SDK** - For backend API
- **Git Bash** (recommended) or **Command Prompt/PowerShell**

### First-Time Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd bloodsugerhistory
   ```

2. **Set up development environment**:
   ```bash
   # On Windows
   setup-dev.bat
   
   # On Linux/Mac
   ./setup-dev.sh
   ```

3. **Add your Google OAuth credentials** to `backend/appsettings.Development.json`

4. **Start the application**:
   ```bash
   # On Windows
   start-dev.bat
   
   # On Linux/Mac
   ./start-dev.sh
   ```

5. **Access the application** at `http://localhost:3000`

### Environment Setup

#### Google OAuth Configuration

This project uses Google OAuth for authentication. You need to set up Google OAuth credentials:

1. **For Local Development**:
   - Copy `backend/appsettings.Development.template.json` to `backend/appsettings.Development.json`
   - Replace the placeholder values with your actual Google OAuth credentials:
     - `YOUR_GOOGLE_CLIENT_ID_HERE` → Your actual Google Client ID
     - `YOUR_GOOGLE_CLIENT_SECRET_HERE` → Your actual Google Client Secret
   - The `appsettings.Development.json` file is gitignored to keep secrets local

2. **For Production/GitHub**:
   - Google OAuth credentials are stored as GitHub Secrets:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
   - The application will automatically use these environment variables in production

#### Setting Up Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback` (for development)
     - `https://yourdomain.com/api/auth/callback` (for production)
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
5. **Copy the credentials**:
   - Copy the Client ID and Client Secret
   - Paste them into your `backend/appsettings.Development.json` file

#### Development Environment Setup

#### Step 1: Initial Setup
Before starting the application, you need to set up your development environment:

**Option A: Using Setup Scripts (Recommended)**
```bash
# On Windows
setup-dev.bat

# On Linux/Mac/Git Bash
./setup-dev.sh
```

**Option B: Manual Setup**
```bash
# Copy the template file
cp backend/appsettings.Development.template.json backend/appsettings.Development.json

# Edit the file and add your Google OAuth credentials
# Replace YOUR_GOOGLE_CLIENT_ID_HERE and YOUR_GOOGLE_CLIENT_SECRET_HERE
```

#### Step 2: Start the Application

**Windows (Command Prompt/PowerShell)**
```cmd
# Clone the repository
git clone <repository-url>
cd bloodsugerhistory

# Start full development environment (database, backend, React dev server)
start-dev.bat

# Start only the database
start-dev.bat --db

# Start only the backend (requires database running)
start-dev.bat --backend

# Start only React dev server
start-dev.bat --frontend

# You can combine arguments to start any combination of services:
start-dev.bat --db --backend    # Start database and backend only
start-dev.bat --backend --frontend # Start backend and React dev server only
```

**Linux/Mac (Terminal)**
```bash
# Clone the repository
git clone <repository-url>
cd bloodsugerhistory

# Start full development environment (database, backend, React dev server)
./start-dev.sh

# Start only the database
./start-dev.sh --db

# Start only the backend (requires database running)
./start-dev.sh --backend

# Start only React dev server
./start-dev.sh --frontend

# You can combine arguments to start any combination of services:
./start-dev.sh --db --backend    # Start database and backend only
./start-dev.sh --backend --frontend # Start backend and React dev server only
```

#### Script Modes Summary
| Mode/Combination         | Command (Windows)                    | Command (Linux/Mac)                | What it does                                                      |
|-------------------------|--------------------------------------|-----------------------------------|-------------------------------------------------------------------|
| Full Development        | start-dev.bat                        | ./start-dev.sh                    | Starts database (port 5432), backend (port 3000), frontend (port 3001) |
| Database only           | start-dev.bat --db                   | ./start-dev.sh --db               | Starts only the PostgreSQL database                               |
| Backend only            | start-dev.bat --backend              | ./start-dev.sh --backend          | Starts only the backend (requires database running)               |
| Frontend dev server     | start-dev.bat --frontend             | ./start-dev.sh --frontend         | Starts only React dev server (port 3001)                          |
| Custom (combine flags)  | start-dev.bat --db --backend         | ./start-dev.sh --db --backend     | Starts database and backend only                                  |

> **Note:** You can combine `--db`, `--backend`, and `--frontend` in any order to start any combination of services you need.

### Development Architecture

The application uses a **proxy development setup** for optimal development experience:

- **Database**: Runs on port 5432 (PostgreSQL)
- **Backend**: Runs on port 3000 with hot reload
- **React Dev Server**: Runs on port 3001 with hot reload
- **Proxy**: Backend forwards non-API requests to React dev server
- **Single Domain**: All requests go through `localhost:3000` for proper session management

This setup provides:
- ✅ **Hot reload** for both frontend and backend
- ✅ **Same-domain cookies** for authentication
- ✅ **No CORS issues** during development
- ✅ **Seamless development experience**

### Manual Setup (Alternative)

If you prefer to start services manually:

1. **Start Database**:
   ```bash
   docker run -d --name bloodsugar-postgres -e POSTGRES_DB=bloodsugar -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15
   ```

2. **Start Backend**:
   ```bash
   cd backend
   dotnet restore
   dotnet run
   ```

3. **Start React Dev Server**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Access Points

- **Application**: http://localhost:3000 (main entry point)
- **Backend API**: http://localhost:3000/api
- **React Dev Server**: http://localhost:3001 (direct access, not needed)
- **Database**: localhost:5432
  - Database: `bloodsugar`
  - Username: `postgres`
  - Password: `password`

## Production Deployment

### Docker Deployment

The application is containerized and ready for production deployment. The Dockerfile creates a multi-stage build that:

1. **Builds the React frontend** and creates static files
2. **Builds the .NET backend** 
3. **Creates a final image** that serves both frontend and backend on port 3000

#### Quick Deployment

```bash
# Build the Docker image
docker build -t bloodsugar-app .

# Run the container
docker run -d \
  --name bloodsugar-app \
  -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  -e ConnectionStrings__DefaultConnection="your_production_database_connection_string" \
  bloodsugar-app
```

#### Environment Variables for Production

Set these environment variables in your production environment:

```bash
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database connection
ConnectionStrings__DefaultConnection=your_production_database_connection_string

# Application settings
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:3000
```

#### Google OAuth Production Setup

1. **Update Google OAuth Console**:
   - Add your production domain to "Authorized redirect URIs":
     - `https://yourdomain.com/api/auth/callback`
   - Add your production domain to "Authorized JavaScript origins":
     - `https://yourdomain.com`

2. **Environment Variables**:
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your production environment
   - The application automatically detects the current domain and uses appropriate redirect URIs

#### Production Features

- **Automatic HTTPS Detection**: Cookies and security settings automatically adjust for HTTPS in production
- **Dynamic OAuth URLs**: Redirect URIs are automatically determined based on the current request
- **Static File Serving**: Frontend is built and served as static files by the backend from `wwwroot`
- **Client-Side Routing**: All routes fallback to `index.html` for React Router
- **Single Port**: Everything runs on port 3000, eliminating CORS and session issues
- **Environment-Agnostic**: Works in any environment without configuration changes
- **Proxy Development**: Development environment uses proxy setup for hot reload and same-domain cookies

#### Cloud Platform Deployment

**Azure App Service**:
```bash
# Deploy to Azure
az webapp up --name your-app-name --resource-group your-resource-group --runtime "DOTNETCORE:9.0"
```

**AWS ECS/Fargate**:
```bash
# Build and push to ECR
docker build -t bloodsugar-app .
docker tag bloodsugar-app:latest your-ecr-repo:latest
docker push your-ecr-repo:latest
```

**Google Cloud Run**:
```bash
# Deploy to Cloud Run
gcloud run deploy bloodsugar-app --image gcr.io/your-project/bloodsugar-app --platform managed
```

### Production Database Setup

For production, use a managed PostgreSQL service:

- **Azure Database for PostgreSQL**
- **AWS RDS for PostgreSQL**
- **Google Cloud SQL**
- **Heroku Postgres**

Update the connection string in your production environment variables.

## Features

- **User Authentication**: Google OAuth integration
- **Blood Sugar Tracking**: Add, edit, and delete blood sugar records
- **User-Specific Data**: Each user only sees their own records
- **Analytics Dashboard**: Charts and statistics for blood sugar trends
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-language Support**: Internationalization support
- **Session Management**: Secure session-based authentication

## Troubleshooting

### Common Issues

1. **Port Already in Use**: The scripts check if ports are in use and skip starting services if occupied
2. **Docker Not Running**: Make sure Docker Desktop is started before running the scripts
3. **Database Connection**: Ensure PostgreSQL container is running and accessible
4. **Google OAuth "Missing required parameter: client_id"**: 
   - Make sure you've copied `backend/appsettings.Development.template.json` to `backend/appsettings.Development.json`
   - Replace the placeholder values with your actual Google OAuth credentials
   - Ensure your Google OAuth redirect URIs include `http://localhost:3000/api/auth/callback`
5. **Google OAuth "redirect_uri_mismatch"**: 
   - Check that your Google OAuth console has the correct redirect URIs configured
   - For development: `http://localhost:3000/api/auth/callback`
   - For production: `https://yourdomain.com/api/auth/callback`
6. **React Dev Server Slow to Start**: On first run, React dev server may take 30-60 seconds to start
7. **Proxy Issues**: If you can't access the app, ensure both backend (port 3000) and React dev server (port 3001) are running
8. **404 Errors on Routes**: In development, ensure the backend proxy is working correctly. In production, ensure static files are being served from `wwwroot`

### Cross-Platform Compatibility

The project provides platform-specific startup scripts:

- **Windows**: Use `start-dev.bat` (Command Prompt/PowerShell)
- **Ubuntu/Linux**: Use `./start-dev.sh` (native bash)
- **macOS**: Use `./start-dev.sh` (native bash)
- **Port Management**: Scripts check if ports are in use and skip starting services if occupied
- **Development Ports**: Backend runs on port 3000, React dev server on port 3001

> **Note**: Each platform uses its native script for optimal compatibility and performance.

## Development

### Project Structure
```
bloodsugerhistory/
├── frontend/          # React application
│   ├── src/           # React source code
│   ├── public/        # Static assets
│   └── cypress/       # End-to-end tests
├── backend/           # .NET API
│   ├── Controllers/   # API controllers
│   ├── Models/        # Data models
│   ├── Data/          # Database context
│   └── DTOs/          # Data transfer objects
├── xunit/             # Unit tests for backend
├── start-dev.bat      # Windows startup script
├── start-dev.sh       # Linux/Mac startup script
├── Dockerfile         # Production container
└── README.md          # This file
```

### Unit Testing

The project includes comprehensive unit tests for the backend controllers using **xUnit** and **Moq** with **100% test coverage** for all controller endpoints.

#### 🚀 Quick Start

```bash
# Run all tests
dotnet test xunit/Backend.Tests.csproj

# Run tests with verbose output
dotnet test xunit/Backend.Tests.csproj --verbosity normal

# Run specific test class
dotnet test xunit/Backend.Tests.csproj --filter "RecordsControllerTests"

# Run tests with coverage (if available)
dotnet test xunit/Backend.Tests.csproj --collect:"XPlat Code Coverage"
```

#### 📊 Test Coverage

The test suite provides comprehensive coverage for all backend functionality:

##### **RecordsController** (6 tests)
- ✅ **GET /api/records** - Retrieve all records for authenticated user
- ✅ **POST /api/records** - Create new blood sugar record with validation
- ✅ **PUT /api/records/{id}** - Update existing record
- ✅ **DELETE /api/records/{id}** - Delete record
- ✅ **Validation Testing** - Invalid data handling and error responses
- ✅ **Authorization Testing** - User-specific data access control

##### **AuthController** (3 tests)
- ✅ **GET /api/auth/me** - Get current user information
- ✅ **Session Authentication** - Session-based user identification
- ✅ **User Authorization** - Proper user context handling

##### **HealthController** (2 tests)
- ✅ **GET /health** - Basic health check endpoint
- ✅ **Database Connectivity** - Database connection verification

#### 🛠️ Test Features

- **🔧 In-Memory Database**: Uses EF Core InMemory provider for fast, isolated tests
- **🎭 Mock Dependencies**: Uses Moq for mocking external dependencies (ILogger, etc.)
- **🔐 Session Testing**: Custom TestSession implementation for testing session-based authentication
- **✅ Validation Testing**: Comprehensive validation testing for all endpoints with proper error responses
- **🚨 Error Handling**: Tests for various error scenarios and edge cases
- **⚡ Fast Execution**: All tests run in under 2 seconds
- **🔄 Isolated Tests**: Each test runs independently with clean state

#### 🏗️ Test Architecture

```csharp
// Example test structure with best practices
public class RecordsControllerTests
{
    private readonly Mock<ILogger<RecordsController>> _mockLogger;
    private readonly DbContextOptions<AppDbContext> _options;

    public RecordsControllerTests()
    {
        // Set up in-memory database for each test
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _mockLogger = new Mock<ILogger<RecordsController>>();
    }

    [Fact]
    public async Task Get_ReturnsAllRecords_ForAuthenticatedUser()
    {
        // Arrange - Set up test data and mocks
        using var context = new AppDbContext(_options);
        var controller = new RecordsController(context, _mockLogger.Object);
        
        // Act - Call the controller method
        var result = await controller.Get();
        
        // Assert - Verify the expected behavior
        var okResult = Assert.IsType<OkObjectResult>(result);
        var records = Assert.IsType<List<BloodSugarRecord>>(okResult.Value);
        Assert.Empty(records); // Should be empty for new user
    }
}
```

#### 🔧 Test Utilities

The project includes a custom `TestSession` class for reliable session testing:

```csharp
public class TestSession : ISession
{
    private readonly ConcurrentDictionary<string, byte[]> _store = new();
    
    // Implements all ISession methods for in-memory testing
    // Includes SetString/GetString extension methods
}
```

#### 📈 Test Results

All tests pass with the following metrics:
- **Total Tests**: 11
- **Pass Rate**: 100%
- **Execution Time**: < 2 seconds
- **Coverage**: All controller endpoints tested
- **Dependencies**: Fully mocked and isolated

#### 🎯 Best Practices Implemented

- **AAA Pattern**: Arrange, Act, Assert structure
- **Test Isolation**: Each test uses unique database instance
- **Meaningful Names**: Descriptive test method names
- **Edge Case Coverage**: Invalid data, missing records, unauthorized access
- **Fast Feedback**: Quick execution for rapid development cycles

### End-to-End Testing

The project includes comprehensive Cypress tests for the frontend:

```bash
# Run Cypress tests
cd frontend
npm run cypress:run

# Open Cypress UI
npm run cypress:open
```

### Database Migrations

The backend automatically runs migrations on startup. If you need to run migrations manually:

```bash
cd backend
dotnet ef database update
```

### Adding New Features

1. **Backend Changes**: Modify API endpoints in `backend/Controllers/`
2. **Frontend Changes**: Update React components in `frontend/src/`
3. **Database Changes**: Create new migrations with `dotnet ef migrations add <name>`

## Architecture Overview

### Development vs Production

**Development Mode:**
- Backend runs on port 3000
- React dev server runs on port 3001
- Backend proxies non-API requests to React dev server
- Hot reload enabled for both frontend and backend

**Production Mode:**
- Single application on port 3000
- React app built and served as static files from `wwwroot`
- Backend serves both API and static files
- Client-side routing handled by fallback to `index.html`

### Security Features

- **Session-based Authentication**: Secure session management
- **Google OAuth Integration**: Industry-standard authentication
- **User-specific Data**: Each user only accesses their own records
- **HTTPS Support**: Automatic HTTPS detection and configuration
- **CORS Protection**: Proper CORS configuration for production

### Performance Optimizations

- **Static File Serving**: Efficient serving of built React assets
- **Database Optimization**: Proper indexing and query optimization
- **Caching**: Session and static file caching
- **Compression**: Automatic response compression
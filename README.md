# Medical Tracker

A comprehensive blood sugar tracking application with React frontend and .NET backend, deployed as a single container from GitHub Container Registry.

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** - For PostgreSQL database and container deployment
- **Node.js** (v16+) - For React frontend development
- **.NET 9 SDK** - For backend API development
- **Git Bash** (recommended) or **Command Prompt/PowerShell**

### First-Time Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/a1143179/medical-tracker.git
   cd medicaltracker
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
   start-dev.ps1
   
   # On Linux/Mac
   ./start-dev.sh
   ```

5. **Access the application** at `http://localhost:55556`

## 🐳 Container Deployment

### Pull from GitHub Container Registry

The application is available as a single container from GitHub Container Registry:

```bash
# Pull the latest container
docker pull ghcr.io/a1143179/medical-tracker/medicaltracker:latest

# Run the container
docker run -d \
  --name medicaltracker \
  -p 8080:80 \
  -e ConnectionStrings__DefaultConnection="your-database-connection" \
  -e Google__ClientId="your-google-client-id" \
  -e Google__ClientSecret="your-google-client-secret" \
  -e JWT__Key="your-jwt-secret" \
  ghcr.io/a1143179/medical-tracker/medicaltracker:latest
```

### Azure Deployment

The application is configured for Azure Web App for Containers:

1. **Create Azure Web App for Containers**
2. **Configure container settings**:
   - **Image**: `ghcr.io/a1143179/medical-tracker/medicaltracker:latest`
   - **Registry**: `https://ghcr.io`
   - **Port**: `8080`

3. **Set environment variables**:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   WEBSITES_PORT=8080
   ConnectionStrings__DefaultConnection=your-database-connection
   Google__ClientId=your-google-client-id
   Google__ClientSecret=your-google-client-secret
   JWT__Key=your-jwt-secret
   ```

### Pull Script

Use the provided script to pull containers locally:

```bash
# Set environment variables
export GITHUB_USERNAME=your-github-username
export GITHUB_TOKEN=your-github-token

# Run the pull script
./pull-ghcr-containers.sh
```

## 🔧 Development Environment

### Environment Setup

#### Google OAuth Configuration

This project uses Google OAuth for authentication. You need to set up Google OAuth credentials:

1. **For Local Development**:
   - Copy `backend/appsettings.Development.template.json` to `backend/appsettings.Development.json`
   - Replace the placeholder values with your actual Google OAuth credentials:
     - `your-google-client-id-here` → Your actual Google Client ID
     - `your-google-client-secret-here` → Your actual Google Client Secret
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
     - `http://localhost:55556/api/auth/callback` (for development)
     - `https://yourdomain.com/api/auth/callback` (for production)
   - Add authorized JavaScript origins:
     - `http://localhost:55556` (for development)
     - `https://yourdomain.com` (for production)
5. **Copy the credentials**:
   - Copy the Client ID and Client Secret
   - Paste them into your `backend/appsettings.Development.json` file

### Development Architecture

The application uses a **proxy development setup** for optimal development experience:

- **Database**: Runs on port 5432 (PostgreSQL)
- **Backend**: Runs on port 55556 with hot reload
- **React Dev Server**: Runs on port 55555 with hot reload
- **Proxy**: Backend forwards non-API requests to React dev server
- **Single Domain**: All requests go through `localhost:55556` for proper session management

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

## 🌐 Access Points

- **Application**: http://localhost:55556 (main entry point)
- **Backend API**: http://localhost:55556/api
- **React Dev Server**: http://localhost:55555 (direct access, not needed)
- **Database**: localhost:5432
  - Database: `bloodsugar`
  - Username: `postgres`
  - Password: `password`

## 🚀 Production Deployment

### Container Architecture

The application is containerized as a single container that includes:

1. **Frontend**: React app built and served as static files
2. **Backend**: .NET API serving both API endpoints and static files
3. **Single Port**: Everything runs on port 8080 (container) / 80 (internal)

### Environment Variables for Production

Set these environment variables in your production environment:

```bash
# Required for Google OAuth
Google__ClientId=your_google_client_id
Google__ClientSecret=your_google_client_secret

# Database connection
ConnectionStrings__DefaultConnection=your_production_database_connection_string

# Application settings
ASPNETCORE_ENVIRONMENT=Production
WEBSITES_PORT=8080

# JWT Configuration
JWT__Key=your_jwt_secret_key
JWT__Issuer=https://yourdomain.com
JWT__Audience=https://yourdomain.com
```

### Cloud Platform Deployment

**Azure Web App for Containers**:
```bash
# Configure container settings
az webapp config container set \
  --name medicaltracker \
  --resource-group medical-tracker-rg \
  --docker-custom-image-name ghcr.io/a1143179/medical-tracker/medicaltracker:latest
```

**AWS ECS/Fargate**:
```bash
# Pull and run the container
docker pull ghcr.io/a1143179/medical-tracker/medicaltracker:latest
docker run -p 8080:80 ghcr.io/a1143179/medical-tracker/medicaltracker:latest
```

**Google Cloud Run**:
```bash
# Deploy to Cloud Run
gcloud run deploy medicaltracker \
  --image ghcr.io/a1143179/medical-tracker/medicaltracker:latest \
  --platform managed \
  --port 8080
```

## 🧪 Testing

### Unit Testing

The project includes comprehensive unit tests for the backend controllers using **xUnit** and **Moq** with **100% test coverage** for all controller endpoints.

#### Quick Start

```bash
# Run all tests
dotnet test xunit/Backend.Tests.csproj

# Run tests with verbose output
dotnet test xunit/Backend.Tests.csproj --verbosity normal

# Run specific test class
dotnet test xunit/Backend.Tests.csproj --filter "RecordsControllerTests"
```

#### Test Coverage

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

### End-to-End Testing

The project includes comprehensive Cypress tests for the frontend:

```bash
# Run Cypress tests
cd frontend
npm run cypress:run

# Open Cypress UI
npm run cypress:open
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The project includes automated CI/CD pipelines:

1. **Frontend Changes** → Build frontend → Copy to backend wwwroot → Build container → Push to GHCR → Deploy to Azure
2. **Backend Changes** → Run tests → Build container → Push to GHCR → Deploy to Azure
3. **Full Stack Changes** → Build both → Run tests → Build container → Push to GHCR → Deploy to Azure

### Automated Testing

- **Unit Tests**: Run on every push and pull request
- **Frontend Tests**: Run on frontend changes
- **Container Build**: Automated container builds and pushes to GHCR

## 🏗️ Project Structure

```
medicaltracker/
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
├── .github/           # GitHub Actions workflows
├── start-dev.ps1      # Windows startup script
├── start-dev.sh       # Linux/Mac startup script
├── pull-ghcr-containers.sh  # Container pull script
├── Dockerfile         # Production container
└── README.md          # This file
```

## 🔧 Features

- **User Authentication**: Google OAuth integration
- **Blood Sugar Tracking**: Add, edit, and delete blood sugar records
- **User-Specific Data**: Each user only sees their own records
- **Analytics Dashboard**: Charts and statistics for blood sugar trends
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-language Support**: Internationalization support
- **Session Management**: Secure session-based authentication
- **Container Deployment**: Single container deployment from GHCR
- **Automated CI/CD**: GitHub Actions for automated deployment

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**: The scripts check if ports are in use and skip starting services if occupied
2. **Docker Not Running**: Make sure Docker Desktop is started before running the scripts
3. **Database Connection**: Ensure PostgreSQL container is running and accessible
4. **Google OAuth "Missing required parameter: client_id"**: 
   - Make sure you've copied `backend/appsettings.Development.template.json` to `backend/appsettings.Development.json`
   - Replace the placeholder values with your actual Google OAuth credentials
   - Ensure your Google OAuth redirect URIs include `http://localhost:55556/api/auth/callback`
5. **Container Pull Failed**: 
   - Verify GitHub token has `read:packages` scope
   - Check container exists in GHCR
6. **Azure Web App Stopped**: 
   - Check container configuration in Azure Portal
   - Verify environment variables are set correctly
   - Check logs in Azure Portal

### Cross-Platform Compatibility

The project provides platform-specific startup scripts:

- **Windows**: Use `start-dev.ps1` (PowerShell)
- **Ubuntu/Linux**: Use `./start-dev.sh` (native bash)
- **macOS**: Use `./start-dev.sh` (native bash)

## 📈 Performance & Security

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
- **Single Container**: Reduced deployment complexity and resource usage

## 🧑‍💻 Local Development Best Practice

- It is recommended to use `docker-compose.yml` to manage the local development environment, unifying service names and ports for the database, backend, and frontend, making it consistent with CI/CD configuration.
- The database service name should be `postgres`, port 5432, username/password both `postgres`/`password`.
- For frontend development, use `npm run build` and copy the build output to backend/wwwroot before publishing the backend.
- It is recommended to add `wait-on` to `frontend/package.json` devDependencies to speed up CI/CD.
- Sensitive information (such as database connection, OAuth secrets) should be managed via environment variables or .env files, avoid hardcoding.
- Logs should be output to a local logs directory for easier debugging.
- The health check endpoint `/api/health` should reflect the status of the database and dependent services.

### Example docker-compose.yml
```yaml
db:
  image: postgres:15
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
    POSTGRES_DB: postgres
  ports:
    - "5432:5432"
backend:
  build: ./backend
  environment:
    ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=postgres;Username=postgres;Password=password"
  depends_on:
    - db
  ports:
    - "55555:55555"
frontend:
  build: ./frontend
  ports:
    - "55556:55556"
```

---

## 🔄 CI/CD Pipeline Best Practice

- CI/CD uses GitHub Actions, with the database started via `services:` and the service name as `postgres`.
- The backend container joins the same network with `--network ${{ job.container.network }}` and uses `Host=postgres;Port=5432;...` in the connection string.
- Only keep `/api/health` for health checks, with a recommended timeout of 3 minutes.
- Log artifacts are automatically uploaded, and backend container logs are output on failure.
- Docker images are multi-tagged (latest, sha, run_number) for rollback and traceability.
- All sensitive information is injected via GitHub Secrets/environment variables.
- It is recommended to add `wait-on` to devDependencies to avoid npx temporary installs.

### Key workflow snippet
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: postgres
    ports:
      - 5432:5432

- name: Start backend container
  run: |
    docker run -d --name medicaltracker-e2e \
      --network ${{ job.container.network }} \
      -e ConnectionStrings__DefaultConnection="Host=postgres;Port=5432;Database=postgres;Username=postgres;Password=password" \
      -p 55555:55555 ${{ env.GHCR_IMAGE }}:${{ github.sha }}

- name: Wait for backend /api/health
  timeout-minutes: 3
  run: npx wait-on http://localhost:55555/api/health

- name: Show backend container logs if healthcheck fails
  if: failure()
  run: docker logs medicaltracker-e2e || true

- name: Upload backend log for Cypress debugging
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: backend-log
    path: backend-publish/logs/
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything works
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
# Medical Tracker Backend

A .NET 9 Web API backend for the Medical Tracker application, providing blood sugar tracking functionality with Google OAuth authentication and JWT token-based security.

## Features

- **Google OAuth Authentication**: Secure login using Google accounts
- **JWT Token Management**: Stateless authentication with HTTP-only cookies
- **Blood Sugar Record Management**: CRUD operations for blood sugar readings
- **User Management**: User profile and preferences
- **PostgreSQL Database**: Persistent data storage with Entity Framework Core
- **Comprehensive Logging**: Serilog integration with file and console logging
- **Health Monitoring**: Built-in health checks and monitoring endpoints
- **CORS Support**: Cross-origin resource sharing configuration
- **Data Protection**: Secure session and cookie management

## Technology Stack

- **.NET 9**: Latest .NET framework
- **ASP.NET Core Web API**: RESTful API framework
- **Entity Framework Core**: ORM for database operations
- **PostgreSQL**: Primary database
- **JWT**: JSON Web Token authentication
- **Serilog**: Structured logging
- **Google OAuth**: Authentication provider
- **Docker**: Containerization support

## Prerequisites

- .NET 9 SDK
- PostgreSQL (local or cloud)
- Docker (optional)
- Google OAuth credentials

## Environment Variables

Create an `appsettings.Development.json` file with the following configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=medicaltracker;Username=your_username;Password=your_password"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-at-least-32-characters-long",
    "Issuer": "medical-tracker",
    "Audience": "medical-tracker-users",
    "ExpirationHours": 24
  },
  "GoogleOAuth": {
    "ClientId": "your-google-client-id",
    "ClientSecret": "your-google-client-secret"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    }
  }
}
```

## Local Development

### Using Docker (Recommended)

1. **Start the database:**
   ```bash
   docker run --name medical-tracker-db -e POSTGRES_DB=medicaltracker -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
   ```

2. **Run the application:**
   ```bash
   dotnet restore
   dotnet run
   ```

### Manual Setup

1. **Install dependencies:**
   ```bash
   dotnet restore
   ```

2. **Set up the database:**
   ```bash
   dotnet ef database update
   ```

3. **Run the application:**
   ```bash
   dotnet run
   ```

The API will be available at `http://localhost:55556`

## API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate Google OAuth login
- `GET /api/auth/callback` - OAuth callback endpoint
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user information

### Health
- `GET /api/health` - Health check endpoint

### Blood Sugar Records
- `GET /api/records` - Get all records for current user
- `POST /api/records` - Create new blood sugar record
- `PUT /api/records/{id}` - Update existing record
- `DELETE /api/records/{id}` - Delete record

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/language` - Update language preference

## Database Schema

### Users Table
- `Id` (int, primary key)
- `Email` (string, unique)
- `Name` (string)
- `LanguagePreference` (string)
- `CreatedAt` (datetime)
- `UpdatedAt` (datetime)

### BloodSugarRecords Table
- `Id` (int, primary key)
- `UserId` (int, foreign key)
- `Level` (decimal)
- `Date` (datetime)
- `Notes` (string, nullable)
- `CreatedAt` (datetime)
- `UpdatedAt` (datetime)

## Docker Deployment

### Build Image
```bash
docker build -t medical-tracker-backend .
```

### Run Container
```bash
docker run -p 55556:55556 -e ConnectionStrings__DefaultConnection="your-connection-string" medical-tracker-backend
```

## Production Deployment

### Azure App Service
1. Configure environment variables in Azure App Service
2. Set up PostgreSQL database (Azure Database for PostgreSQL)
3. Configure Google OAuth credentials
4. Deploy using Azure CLI or GitHub Actions

### Environment Variables for Production
- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `GoogleOAuth__ClientId`
- `GoogleOAuth__ClientSecret`

## Logging

Logs are written to:
- Console (development)
- `logs/app.log` (production)
- Daily log rotation with 30-day retention

## Security Features

- JWT tokens stored in HTTP-only cookies
- CORS configuration for frontend domain
- Data protection key ring for session encryption
- Input validation and sanitization
- Secure OAuth flow with state validation

## Testing

Run tests with:
```bash
dotnet test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository. 
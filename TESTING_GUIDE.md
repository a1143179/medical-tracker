# Testing Guide

This document provides comprehensive information about the testing setup for the Medical Tracker application.

## Overview

The application uses multiple testing strategies:
- **Cypress E2E Tests**: Frontend integration tests
- **xUnit Tests**: Backend unit and integration tests
- **GitHub Actions**: Automated CI/CD pipeline
- **Pre-commit Hooks**: Local quality checks

## Cypress E2E Tests

### Features
- **Smoke Tests**: Basic functionality verification
- **Google OAuth Mocking**: Simulated authentication
- **API Mocking**: Backend service simulation
- **Responsive Testing**: Mobile and desktop viewports
- **Error Handling**: Edge case validation

### Running Tests

#### Local Development
```bash
# Install dependencies
cd frontend
npm install

# Run tests in headless mode
npm run test:smoke

# Run tests in debug mode
npm run test:smoke:debug

# Run tests with UI
npm run cypress:open

# Run all E2E tests
npm run test:e2e
```

#### Debug Mode
```bash
# Enable Cypress debug logging
DEBUG=cypress:* npm run test:smoke

# Or use the debug script
npm run test:smoke:debug
```

### Test Structure

#### Smoke Tests (`cypress/e2e/smoke-tests.cy.js`)
- Application loading
- Google login flow
- Dashboard functionality
- Record management (add, edit, delete)
- Language switching
- Error handling
- Mobile responsiveness
- Form validation
- Logout functionality

#### Custom Commands (`cypress/support/commands.js`)
- `loginWithMockUser()`: Simulate authenticated user
- `clearAllData()`: Reset test state
- `waitForApiCalls()`: Wait for API responses
- `mockApiResponse()`: Mock API endpoints

### Configuration

#### Cypress Config (`cypress.config.js`)
- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Retries: 2 for run mode, 0 for open mode
- Debug mode support
- Environment-specific configurations

#### Environment Variables
```javascript
{
  apiUrl: 'http://localhost:5000/api',
  googleClientId: 'test-client-id',
  debug: false
}
```

## xUnit Backend Tests

### Features
- **In-Memory Database**: Fast, isolated tests
- **WebApplicationFactory**: Full application testing
- **HTTP Client Testing**: API endpoint validation
- **Database Seeding**: Test data setup

### Running Tests

#### Local Development
```bash
# Navigate to backend
cd backend

# Run all tests
dotnet test

# Run with detailed output
dotnet test --verbosity normal

# Run specific test file
dotnet test --filter "FullyQualifiedName~SimpleControllerTests"

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

#### Test Structure

##### SimpleControllerTests
- Health check endpoint
- Value types endpoint
- Authentication validation
- CRUD operations (unauthorized)
- Error handling

##### Test Database Setup
```csharp
// In-memory database configuration
services.AddDbContext<AppDbContext>(options =>
{
    options.UseInMemoryDatabase("TestDatabase_" + Guid.NewGuid().ToString());
});

// Test data seeding
private void SeedDatabase(AppDbContext context)
{
    // Add test users, value types, and records
}
```

## GitHub Actions CI/CD

### Workflow Jobs

#### 1. Frontend Tests
- Node.js setup (v18)
- Dependency installation
- ESLint validation
- Application build
- Cypress tests (headless and debug)
- Screenshot/video artifacts

#### 2. Backend Tests
- .NET setup (9.0.x)
- Dependency restoration
- Application build
- xUnit test execution
- Test result reporting
- Coverage analysis

#### 3. Integration Tests
- PostgreSQL service container
- Full stack testing
- Database migrations
- End-to-end validation

#### 4. Build and Deploy
- Production build
- Deployment package creation
- Azure deployment (main branch)
- Staging deployment (working branch)

#### 5. Security Scan
- Trivy vulnerability scanning
- SARIF report generation
- GitHub Security tab integration

#### 6. Performance Tests
- Lighthouse CI
- Performance metrics validation
- Accessibility testing
- Best practices verification

### Environment Variables

#### Frontend
```yaml
CI: true
REACT_APP_API_URL: http://localhost:5000/api
```

#### Backend
```yaml
ASPNETCORE_ENVIRONMENT: Test
ConnectionStrings__DefaultConnection: "Data Source=:memory:"
```

## Pre-commit Hooks

### Configuration
Located in `.husky/pre-commit`

### Checks Performed
1. **ESLint**: Code quality validation
2. **Smoke Tests**: Basic functionality verification

### Setup
```bash
# Install husky
npm install husky --save-dev

# Enable git hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test:smoke"
```

## Test Data Management

### Mock Data
- **Users**: Test user with ID 1
- **Value Types**: Blood Sugar and Blood Pressure
- **Records**: Sample medical records
- **Google OAuth**: Mocked authentication flow

### Database Seeding
```csharp
// Test user
var testUser = new User
{
    Id = 1,
    Email = "test@example.com",
    Name = "Test User",
    PreferredValueTypeId = 1
};

// Test value types
var bloodSugarType = new MedicalValueType
{
    Id = 1,
    Name = "Blood Sugar",
    NameZh = "血糖",
    Unit = "mmol/L",
    RequiresTwoValues = false
};
```

## Debugging

### Cypress Debug
```bash
# Enable debug mode
DEBUG=cypress:* npm run test:smoke

# View test videos
open cypress/videos/

# View screenshots
open cypress/screenshots/
```

### Backend Debug
```bash
# Verbose test output
dotnet test --verbosity detailed

# Debug specific test
dotnet test --filter "TestName=HealthCheck_ReturnsOk"
```

### GitHub Actions Debug
- Check workflow logs in GitHub
- Download artifacts (screenshots, videos, test results)
- Review test reports in GitHub Security tab

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Mocking Strategy
- Mock external services (Google OAuth, APIs)
- Use in-memory database for backend tests
- Avoid real network calls in tests
- Provide realistic test data

### Performance Considerations
- Use headless mode for CI/CD
- Parallel test execution where possible
- Optimize test data setup
- Clean up resources after tests

### Maintenance
- Update test data when models change
- Keep mock responses current
- Review and update test assertions
- Monitor test execution times

## Troubleshooting

### Common Issues

#### Cypress Tests Failing
1. Check if application is running on correct port
2. Verify API mocking is working
3. Check for timing issues (add waits)
4. Review console errors

#### Backend Tests Failing
1. Verify in-memory database setup
2. Check test data seeding
3. Review authentication mocking
4. Ensure proper cleanup

#### GitHub Actions Issues
1. Check workflow logs
2. Verify environment variables
3. Review service container setup
4. Check artifact uploads

### Getting Help
- Review test logs and error messages
- Check GitHub Actions workflow runs
- Consult Cypress and xUnit documentation
- Review test configuration files 
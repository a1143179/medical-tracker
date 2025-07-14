# Cypress Testing Setup

This project includes comprehensive end-to-end testing using Cypress for the Blood Sugar Tracker application.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- The application should be running on `http://localhost:3000`

## Installation

The Cypress dependencies are already included in the project. If you need to install them manually:

```bash
cd frontend
npm install cypress start-server-and-test --save-dev
```

## Available Scripts

### Development
```bash
# Open Cypress Test Runner (interactive mode)
npm run cypress:open

# Run tests in headless mode
npm run cypress:run

# Start the app and run tests
npm run test:e2e

# Start the app and open Cypress
npm run test:e2e:open
```

## Test Structure

### Test Files
- `cypress/e2e/login.cy.js` - Login functionality tests
- `cypress/e2e/dashboard.cy.js` - Dashboard functionality tests
- `cypress/e2e/registration.cy.js` - Registration flow tests
- `cypress/e2e/api.cy.js` - API integration tests

### Support Files
- `cypress/support/commands.js` - Custom Cypress commands
- `cypress/support/e2e.js` - Global configuration
- `cypress/fixtures/` - Mock data for API tests

### Configuration
- `cypress.config.js` - Cypress configuration

## Custom Commands

The following custom commands are available:

### Authentication
```javascript
// Login with default or custom credentials
cy.login('test@example.com', 'password123')

// Logout
cy.logout()
```

### Blood Sugar Records
```javascript
// Add a new blood sugar record
cy.addBloodSugarRecord(120, 'Test record')
```

### Language
```javascript
// Switch language
cy.switchLanguage('zh') // Chinese
cy.switchLanguage('en') // English
```

### Utilities
```javascript
// Check if element is visible and clickable
cy.shouldBeVisibleAndClickable('[data-testid="button"]')

// Wait for API response
cy.waitForApi('POST', '/api/auth/login', 'login')
```

## Running Tests

### Interactive Mode (Recommended for Development)
```bash
npm run cypress:open
```
This opens the Cypress Test Runner where you can:
- See all test files
- Run tests individually
- Watch tests run in real-time
- Debug tests step by step

### Headless Mode (CI/CD)
```bash
npm run cypress:run
```
This runs all tests in headless mode, suitable for:
- Continuous Integration
- Automated testing
- Quick test execution

### With Application Server
```bash
npm run test:e2e
```
This automatically:
1. Starts the development server
2. Runs all Cypress tests
3. Stops the server when done

## Test Data

### Fixtures
Mock API responses are stored in `cypress/fixtures/`:
- `login-success.json` - Successful login response
- `blood-sugar-records.json` - Sample blood sugar records
- `add-record-success.json` - Successful record addition
- `verification-sent.json` - Verification code response

### Test Users
For tests to work properly, you may need to create test users in your database:
- Email: `test@example.com`
- Password: `password123`

## Writing New Tests

### Basic Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code that runs before each test
    cy.visit('/page-url')
  })

  it('should do something', () => {
    // Test implementation
    cy.get('[data-testid="element"]').should('be.visible')
  })
})
```

### Best Practices
1. **Use data-testid attributes** for reliable element selection
2. **Keep tests independent** - each test should be able to run alone
3. **Use custom commands** for common operations
4. **Mock API calls** when testing UI without backend dependencies
5. **Test both success and error scenarios**

### Adding data-testid Attributes
To make tests more reliable, add `data-testid` attributes to your React components:

```jsx
<button data-testid="add-record-button">Add Record</button>
<div data-testid="error-message">{error}</div>
```

## Configuration

### Environment Variables
The Cypress configuration includes:
- Base URL: `http://localhost:3000`
- API URL: `http://localhost:3000`
- Viewport: 1280x720
- Timeouts: 10 seconds

### Customization
You can modify `cypress.config.js` to:
- Change the base URL
- Adjust timeouts
- Configure viewport sizes
- Set up different environments

## Troubleshooting

### Common Issues

1. **Tests fail because app isn't running**
   - Ensure the React app is running on `http://localhost:3000`
   - Ensure the backend API is running on `http://localhost:3000`

2. **Element not found errors**
   - Check that `data-testid` attributes are present
   - Verify element selectors are correct
   - Ensure elements are visible (not hidden by CSS)

3. **API timeout errors**
   - Check that the backend is running
   - Verify API endpoints are correct
   - Check network connectivity

4. **Authentication issues**
   - Ensure test users exist in the database
   - Check that authentication flow is working
   - Verify session management

### Debugging
- Use `cy.pause()` to pause test execution
- Use `cy.debug()` to open browser dev tools
- Check the Cypress command log for detailed information
- Use `cy.screenshot()` to capture screenshots on failure

## CI/CD Integration

The GitHub Actions workflow automatically runs Cypress tests:
1. Installs dependencies
2. Builds the frontend
3. Runs Cypress tests
4. Continues with deployment if tests pass

## Contributing

When adding new features:
1. Write tests for the new functionality
2. Update existing tests if needed
3. Ensure all tests pass before submitting
4. Add appropriate `data-testid` attributes to new components 
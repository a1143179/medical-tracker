# Cypress Authentication Tests - Google OAuth

This document describes the Cypress E2E tests for the Blood Sugar Tracker application's Google OAuth authentication system.

## Test Structure

The authentication tests are organized with numbered prefixes for execution order:

### 1. Google OAuth Login (`1-google-login.cy.js`)
- Tests the Google OAuth login flow
- Mocks Google OAuth redirects and callbacks
- Tests authentication state management
- Tests error handling for authentication failures

### 2. Session Persistence (`5-session-persistence.cy.js`)
- Tests session persistence after page reloads
- Tests language preference persistence
- Tests proper logout functionality
- Tests session expiration handling

### 3. Language Preference (`6-language-preference.cy.js`)
- Tests language switching functionality
- Tests language preference persistence across sessions
- Tests UI text updates when language changes

### 4. Error Handling (`7-error-handling.cy.js`)
- Tests authentication error scenarios
- Tests network error handling
- Tests server error responses
- Tests malformed response handling

## Authentication Flow

The application uses Google OAuth for authentication:

1. **Login**: User clicks "Sign in with Google" button
2. **OAuth Redirect**: Backend redirects to Google OAuth
3. **Callback**: Google redirects back to `/api/auth/callback`
4. **User Creation**: Backend creates/updates user in database
5. **Session**: User session is established
6. **Dashboard**: User is redirected to dashboard

## Test Mocking Strategy

Since we can't test actual Google OAuth in E2E tests, we use Cypress intercepts to mock the OAuth flow:

```javascript
// Mock Google OAuth login redirect
cy.intercept('GET', '/api/auth/login*', {
  statusCode: 302,
  headers: {
    'Location': '/api/auth/callback?returnUrl=/dashboard'
  }
}).as('googleLogin');

// Mock successful callback
cy.intercept('GET', '/api/auth/callback*', {
  statusCode: 302,
  headers: {
    'Location': '/dashboard'
  }
}).as('googleCallback');

// Mock authenticated user
cy.intercept('GET', '/api/auth/me', {
  statusCode: 200,
  body: {
    id: 1,
    email: 'testuser@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    isEmailVerified: true,
    languagePreference: 'en'
  }
}).as('getUserInfo');
```

## Running Tests

```bash
# Run all authentication tests
npm run cypress:run

# Run specific test file
npx cypress run --spec "cypress/e2e/1-google-login.cy.js"

# Open Cypress UI
npm run cypress:open
```

## Test Data

Tests use mocked user data:
- **Email**: testuser@example.com
- **Name**: Test User
- **ID**: 1
- **Language**: English (en) by default

## Key Test Scenarios

### Authentication Success
- User clicks Google login button
- OAuth flow completes successfully
- User is redirected to dashboard
- User session is established

### Authentication Failure
- OAuth callback returns error
- User is redirected back to login page
- Error message is displayed appropriately

### Session Management
- User session persists after page reload
- User can logout successfully
- Session expires gracefully

### Error Handling
- Network errors are handled gracefully
- Server errors are handled appropriately
- Malformed responses don't crash the app

## Notes

- All authentication is handled via Google OAuth
- No password-based authentication exists
- No registration flow exists (users are created automatically via OAuth)
- No email verification is needed (Google accounts are pre-verified)
- Session management is handled via server-side sessions
- All tests use mocked authentication to ensure consistent behavior 
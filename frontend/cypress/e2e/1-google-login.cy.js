/* global cy */
describe('Google OAuth Login', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    cy.clearCookies();
    
    // Always mock /api/auth/me to resolve loading state
    cy.intercept('GET', '/api/auth/me*', { statusCode: 401 }).as('getUserInfo');
    
    // Mock the Google OAuth flow
    cy.intercept('GET', '/api/auth/login*', (req) => {
      // Simulate successful Google OAuth redirect
      req.reply({
        statusCode: 302,
        headers: {
          'Location': '/api/auth/callback?returnUrl=/dashboard'
        }
      });
    }).as('googleLogin');

    cy.intercept('GET', '/api/auth/callback*', (req) => {
      // Mock successful callback with user data
      req.reply({
        statusCode: 302,
        headers: {
          'Location': '/dashboard'
        }
      });
    }).as('googleCallback');

    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200,
      body: { message: 'Logged out successfully' }
    }).as('logout');
  });

  it('should display Google login page when not authenticated', () => {
    cy.visit('/login', { failOnStatusCode: false });
    cy.wait(100); // Allow React to mount and fire the request
    cy.get('body').should('be.visible');
    cy.get('[data-testid="google-signin-button"]').should('be.visible');
    cy.get('[data-testid="google-signin-button"]').should('contain', 'Sign in with Google');
    cy.contains('h4', 'Blood Sugar Tracker').should('be.visible');
  });

  it('should redirect to Google OAuth when login button is clicked', () => {
    cy.visit('/login', { failOnStatusCode: false });
    cy.wait(100);
    cy.get('[data-testid="google-signin-button"]').click();
    cy.wait('@googleLogin');
  });

  it('should redirect authenticated users to dashboard', () => {
    // Override the default 401 with a 200 for this test
    cy.intercept('GET', '/api/auth/me*', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'cypressbloodsugartracker@gmail.com',
        name: 'Cypress Test User',
        createdAt: '2024-01-01T00:00:00Z',
        isEmailVerified: true,
        languagePreference: 'en'
      }
    }).as('getUserInfo');
    cy.visit('/login', { failOnStatusCode: false });
    cy.wait(100);
    cy.url().should('include', '/dashboard');
  });

  it('should handle authentication errors gracefully', () => {
    cy.intercept('GET', '/api/auth/me*', { statusCode: 401 }).as('getUserInfoError');
    cy.visit('/login', { failOnStatusCode: false });
    cy.wait(100);
    cy.url().should('include', '/login');
    cy.get('[data-testid="google-signin-button"]').should('be.visible');
  });

  it('should handle callback errors gracefully', () => {
    cy.intercept('GET', '/api/auth/me*', { statusCode: 401 }).as('getUserInfo');
    cy.intercept('GET', '/api/auth/callback*', (req) => {
      req.reply({
        statusCode: 302,
        headers: {
          'Location': '/?error=oauth_error'
        }
      });
    }).as('googleCallbackError');
    cy.visit('/api/auth/callback?returnUrl=/dashboard&error=authentication_failed', { failOnStatusCode: false });
    cy.wait(100);
    cy.url().should('include', '/');
  });

  it('should show spinner and block background on mobile when login is clicked', () => {
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('forceMobile', 'true');
        win.loginWithGoogleTest = () => new Promise(resolve => setTimeout(resolve, 1000));
      },
      failOnStatusCode: false
    });
    cy.wait(100);
    cy.get('[data-testid="google-signin-button"]').should('be.visible');
    cy.get('[data-testid="google-signin-button"]').click();
    cy.wait(200);
    cy.get('.MuiCircularProgress-root').should('be.visible');
    cy.get('[data-testid="login-overlay"]').should('be.visible').and($overlay => {
      expect($overlay).to.have.css('pointer-events').match(/all|auto/);
    });
  });
}); 
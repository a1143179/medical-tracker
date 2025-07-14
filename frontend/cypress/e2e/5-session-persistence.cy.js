/* global cy */
/* eslint-env cypress */

describe('5. Session Persistence and Logout', () => {
  beforeEach(() => {
    // Mock Google OAuth endpoints only
    cy.intercept('GET', 'https://accounts.google.com/o/oauth2/auth', { statusCode: 200, body: {} }).as('googleAuth');
    cy.intercept('POST', 'https://oauth2.googleapis.com/token', { statusCode: 200, body: { access_token: 'fake-access-token', id_token: 'fake-id-token' } }).as('googleToken');
    cy.intercept('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', {
      statusCode: 200,
      body: {
        id: '1234567890',
        email: 'testuser@example.com',
        name: 'Test User',
        verified_email: true,
        picture: 'https://example.com/avatar.png'
      }
    }).as('googleUserInfo');
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'testuser@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
        languagePreference: 'en'
      }
    }).as('getUserInfo');
    cy.intercept('GET', '/api/records*', { statusCode: 200, body: [] }).as('getRecords');
    cy.visit('/dashboard');
    cy.contains('Add New Record').click();
    cy.get('[data-testid="add-new-record-button"]').should('be.visible');
  });

  it('should persist session after reload', () => {
    // Should be on dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').should('be.visible');
    
    // Reload page
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').should('be.visible');
  });

  it('should persist selected language after reload', () => {
    // Change language to Chinese
    cy.get('[data-testid="language-selector"]').click();
    cy.get('[data-value="zh"]').click();
    
    // Reload and verify language persists
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="language-selector"]').should('contain', '中文');
  });

  it('should logout properly and clear session', () => {
    // Logout - use force: true to handle Material-UI menu visibility
    cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logout');
    cy.get('[data-testid="logout-button"]').click({ force: true });
    cy.wait('@logout');

    // After logout, simulate session cleared by returning 401 for /api/auth/me
    cy.intercept('GET', '/api/auth/me', { statusCode: 401 }).as('getUserInfoAfterLogout');

    // Should redirect to login page
    cy.url().should('include', '/login');

    // Try to access dashboard - should redirect to login
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should handle session expiration gracefully', () => {
    // Mock session expiration (unauthorized response)
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 401
    }).as('getUserInfoUnauthorized');

    cy.reload();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
    cy.get('.google-signin-button').should('be.visible');
  });
}); 
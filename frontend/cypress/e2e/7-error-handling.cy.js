/* eslint-env cypress */
/* global cy */

describe('Error Handling', () => {
  beforeEach(() => {
    // Mock API endpoints (backend at 3000)
    cy.intercept('GET', 'http://localhost:3000/api/auth/me', {
      statusCode: 401,
      body: { message: 'Unauthorized' }
    }).as('authMe');

    cy.intercept('GET', 'http://localhost:3000/api/records', {
      statusCode: 200,
      body: []
    }).as('getRecords');
  });

  it('should handle 404 errors gracefully (redirects to login)', () => {
    cy.visit('http://localhost:3000/nonexistent-page');
    cy.url().should('include', '/login');
    cy.contains('Blood Sugar Tracker').should('be.visible');
  });

  it('should show login page when not authenticated', () => {
    cy.visit('http://localhost:3000/login');
    cy.contains('Blood Sugar Tracker').should('be.visible');
    cy.get('.google-signin-button').should('be.visible');
  });

  it('should handle OAuth callback errors (redirects to login)', () => {
    cy.visit('http://localhost:3000/api/auth/callback?error=access_denied');
    cy.url().should('include', '/login');
    cy.contains('Blood Sugar Tracker').should('be.visible');
  });

  it('should handle network errors gracefully (redirects to login)', () => {
    cy.intercept('GET', 'http://localhost:3000/api/records', {
      forceNetworkError: true
    }).as('networkError');

    cy.visit('http://localhost:3000/dashboard');
    cy.url().should('include', '/login');
    cy.contains('Blood Sugar Tracker').should('be.visible');
  });
}); 
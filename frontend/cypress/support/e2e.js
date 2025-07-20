// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // for uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Script error')) {
    return false;
  }
  return true;
});

// Configure retry-ability
Cypress.config('retries', {
  runMode: 2,
  openMode: 0
});

// Global beforeEach hook
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set viewport
  cy.viewport(1280, 720);
  
  // Mock console errors to prevent test failures
  cy.window().then((win) => {
    cy.stub(win.console, 'error').callsFake((msg) => {
      // Allow certain console errors that are expected
      if (msg.includes('Warning: ReactDOM.render is deprecated')) {
        return;
      }
      if (msg.includes('Warning: componentWillReceiveProps has been renamed')) {
        return;
      }
      // Log other errors but don't fail the test
      cy.log('Console error:', msg);
    });
  });
});

// Global afterEach hook
afterEach(() => {
  // Take screenshot on failure
  if (Cypress.currentRetry < Cypress.config('retries').runMode) {
    cy.screenshot();
  }
});

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.window().its('document').its('readyState').should('eq', 'complete');
});

// Custom command to login with mock user
Cypress.Commands.add('loginWithMockUser', (userData = {}) => {
  const defaultUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    preferredValueTypeId: 1
  };
  
  const user = { ...defaultUser, ...userData };
  
  cy.window().then((win) => {
    win.localStorage.setItem('user', JSON.stringify(user));
  });
});

// Custom command to clear all data
Cypress.Commands.add('clearAllData', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.clearCookies();
});

// Custom command to check if element is in viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height();
  const rect = subject[0].getBoundingClientRect();
  
  expect(rect.top).to.be.lessThan(bottom);
  expect(rect.bottom).to.be.greaterThan(0);
  
  return subject;
});

// Custom command to wait for API calls
Cypress.Commands.add('waitForApiCalls', (aliases = []) => {
  aliases.forEach(alias => {
    cy.wait(alias);
  });
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as(`${method.toLowerCase()}_${url.replace(/[^a-zA-Z0-9]/g, '_')}`);
});

// Custom command to check accessibility
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Custom command to test responsive design
Cypress.Commands.add('testResponsive', (breakpoints = ['iphone-x', 'ipad-2', 'macbook-13']) => {
  breakpoints.forEach(breakpoint => {
    cy.viewport(breakpoint);
    cy.get('body').should('be.visible');
  });
});

// Custom command to test keyboard navigation
Cypress.Commands.add('testKeyboardNavigation', () => {
  cy.get('body').tab();
  cy.focused().should('exist');
});

// Custom command to test form validation
Cypress.Commands.add('testFormValidation', (formSelector, invalidData) => {
  cy.get(formSelector).within(() => {
    Object.entries(invalidData).forEach(([field, value]) => {
      cy.get(`[name="${field}"]`).clear().type(value);
    });
    cy.get('button[type="submit"]').click();
    
    // Check for validation errors
    cy.get('[data-testid="validation-error"]').should('be.visible');
  });
});

// Custom command to test error handling
Cypress.Commands.add('testErrorHandling', (apiCall, errorResponse) => {
  cy.intercept(apiCall.method, apiCall.url, {
    statusCode: errorResponse.statusCode || 500,
    body: errorResponse.body || { error: 'Internal server error' }
  }).as('apiError');
  
  cy.visit(apiCall.page);
  cy.wait('@apiError');
  cy.get('[data-testid="error-message"]').should('be.visible');
});

// Export for use in tests
export {}; 
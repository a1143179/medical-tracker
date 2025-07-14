// eslint-disable-next-line spaced-comment
// ***********************************************
// eslint-disable-next-line spaced-comment
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... }) 

/* global Cypress, cy */
// Custom command to ensure language is set to English
Cypress.Commands.add('ensureEnglishLanguage', () => {
  // Check if we're on a page with the language selector (dashboard or authenticated pages)
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="language-selector"]').length > 0) {
      // Always set to English to ensure consistency
      cy.get('[data-testid="language-selector"]').click();
      cy.get('[role="listbox"]').should('be.visible');
      cy.get('[data-value="en"]').click();
      // Wait for success message if language was changed
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="success-message"]').length > 0) {
          cy.get('[data-testid="success-message"]').should('be.visible');
        }
      });
    }
  });
});

// Custom command to login and ensure English language
Cypress.Commands.add('loginAndEnsureEnglish', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('form').submit();
  cy.url().should('include', '/dashboard');
  cy.ensureEnglishLanguage();
});

// Note: Blood sugar records are ordered by MeasurementTime descending (newest first)
// This means the first record in the list will be the most recent one
// This ordering helps with pagination and makes new records more likely to appear on the first page 

/**
 * Formats a Date object as a datetime-local string (YYYY-MM-DDTHH:mm)
 * @param {Date} date
 * @returns {string}
 */
export function formatLocalDateForInput(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
} 
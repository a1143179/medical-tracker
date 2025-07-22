// This file contains only the CRUD flow. The OAuth login test should be in cypress/e2e/auth.cy.js.

describe('Medical Tracker CRUD Flow', () => {
  // Helper function to mock login state before each test
  const mockLogin = () => {
    // Simulate a logged-in user by setting the JWT cookie as required by the backend
    cy.setCookie('MedicalTracker.Auth.JWT', 'mock-jwt-token-for-authenticated-user', { path: '/' });
    // If your app also uses localStorage for user info, you can set it here if needed
    // cy.window().then((win) => {
    //   win.localStorage.setItem('userProfile', JSON.stringify({
    //     id: 'user123',
    //     name: 'Test User',
    //     email: 'test@example.com'
    //   }));
    // });
  };

  beforeEach(() => {
    // Simulate user login before each test by setting the JWT cookie
    mockLogin();
    cy.visit('/dashboard'); // Go directly to dashboard page after login
    cy.contains('Add New Record').should('exist'); // Ensure the page loads
  });

  it('should add, update, and delete a record', () => {
    // Add a new record
    cy.contains('Add New Record').click();
    cy.get('input[name="measurementTime"]').type('2024-07-21T10:00');
    cy.get('input[name="value"]').type('5.5');
    cy.get('textarea[name="notes"]').type('Test record');
    cy.get('[data-testid="add-new-record-button"]').click(); // Use data-testid for the add button
    cy.contains('Record added successfully').should('exist');
    cy.contains('Test record').should('exist');

    // Update the record
    cy.contains('Test record').parents('tr').within(() => {
      cy.get('[data-testid="edit-record-button"]').click(); // Use data-testid for the edit button
    });
    cy.get('input[name="value"]').clear().type('6.2');
    cy.get('textarea[name="notes"]').clear().type('Updated record');
    cy.get('[data-testid="save-record-button"]').click(); // Use data-testid for the save button
    cy.contains('Record updated successfully').should('exist');
    cy.contains('Updated record').should('exist');

    // Delete the record
    cy.contains('Updated record').parents('tr').within(() => {
      // Set up window:confirm handler before clicking delete
      cy.on('window:confirm', (str) => {
        expect(str).to.eq('Are you sure you want to delete this record?');
        return true;
      });
      cy.get('[data-testid="delete-record-button"]').click(); // Use data-testid for the delete button
    });
    cy.contains('Record deleted successfully').should('exist');
    cy.contains('Updated record').should('not.exist');
  });
});
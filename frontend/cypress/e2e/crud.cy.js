describe('Medical Tracker CRUD Flow (Mock Google OAuth)', () => {
  beforeEach(() => {
    cy.session('test-user', () => {
      // Directly log in via the test endpoint
      cy.request('/api/auth/test-login');
    });
    cy.visit('/dashboard');
    cy.contains('Add New Record').should('exist');
  });

  it('should add, update, and delete a record', () => {
    // Add a new record
    cy.contains('Add New Record').click();
    cy.get('input[name="measurementTime"]').type('2024-07-21T10:00');
    cy.get('input[name="value"]').type('5.5');
    cy.get('textarea[name="notes"]').type('Test record');
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.contains('Record added successfully').should('exist');
    cy.contains('Test record').should('exist');

    // Update the record
    cy.contains('Test record').parents('tr').within(() => {
      cy.get('button[aria-label="Edit"]').click();
    });
    cy.get('input[name="value"]').clear().type('6.2');
    cy.get('textarea[name="notes"]').clear().type('Updated record');
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.contains('Record updated successfully').should('exist');
    cy.contains('Updated record').should('exist');

    // Delete the record
    cy.contains('Updated record').parents('tr').within(() => {
      cy.get('button[aria-label="Delete"]').click();
    });
    cy.on('window:confirm', () => true);
    cy.contains('Record deleted successfully').should('exist');
    cy.contains('Updated record').should('not.exist');
  });
}); 
describe('Medical Tracker CRUD Flow (Mock Google OAuth)', () => {
  beforeEach(() => {
    // Intercept /api/auth/login to prevent redirect to Google
    cy.intercept('GET', '/api/auth/login', (req) => {
      req.reply({ statusCode: 200, body: 'Mocked login - no redirect' });
    });
    // Simulate Google redirecting back to the app after OAuth
    cy.visit('/api/auth/callback?access_token=fake-access-token&refresh_token=fake-refresh-token&code=fake-code&state=fake-state');
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
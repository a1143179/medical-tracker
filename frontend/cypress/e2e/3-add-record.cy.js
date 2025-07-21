describe('Add Record', () => {
  beforeEach(() => {
    cy.setCookie('MedicalTracker.Auth.JWT', 'mock-jwt-token');
  });
  it('should allow user to add a new record', () => {
    cy.visit('http://localhost:55555/dashboard');
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('[data-testid="record-value-input"]').type('5.6');
    cy.get('[data-testid="save-record-btn"]').click();
    cy.contains('Record added').should('exist');
  });
}); 
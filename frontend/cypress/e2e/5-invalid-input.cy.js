describe('Invalid Input Error', () => {
  beforeEach(() => {
    cy.setCookie('MedicalTracker.Auth.JWT', 'mock-jwt-token');
  });
  it('should show error message on invalid input', () => {
    cy.visit('http://localhost:55555/dashboard');
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('[data-testid="record-value-input"]').type('-1');
    cy.get('[data-testid="save-record-btn"]').click();
    cy.contains('Value must be greater than 0').should('exist');
  });
}); 
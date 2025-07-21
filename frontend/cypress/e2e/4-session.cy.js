describe('Session Persistence', () => {
  beforeEach(() => {
    cy.setCookie('MedicalTracker.Auth.JWT', 'mock-jwt-token');
  });
  it('should persist session after reload', () => {
    cy.visit('http://localhost:55555/dashboard');
    cy.reload();
    cy.contains('Dashboard').should('exist');
  });
}); 
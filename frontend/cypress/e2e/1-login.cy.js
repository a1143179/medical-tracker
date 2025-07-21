describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
  });
  it('should show login page and allow Google login button', () => {
    cy.visit('http://localhost:55555/login');
    cy.contains('Sign in with Google').should('exist');
    cy.get('[data-testid="google-login-button"]').should('exist');
  });
}); 
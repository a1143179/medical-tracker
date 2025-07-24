beforeEach(() => {
  cy.intercept('**', (req) => {
    cy.task('log', `[CYPRESS][request] ${req.method} ${req.url} ${JSON.stringify(req.headers)} ${JSON.stringify(req.body)}`);
    req.continue((res) => {
      cy.task('log', `[CYPRESS][response] ${res.statusCode} ${req.url} ${JSON.stringify(res.body)}`);
    });
  });
}); 
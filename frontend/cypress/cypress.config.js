module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:55555',
    supportFile: false,
    specPattern: 'frontend/cypress/e2e/*.cy.js',
  },
};

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:55555',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    video: false,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
  },
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
}); 
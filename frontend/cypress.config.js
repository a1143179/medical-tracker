const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:55555',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    video: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log('[CYPRESS][LOG]', message);
          return Promise.resolve(null);
        }
      });
    },
  },
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
}); 
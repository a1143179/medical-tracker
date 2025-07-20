const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    watchForFileChanges: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
    },
    env: {
      // Environment variables for testing
      apiUrl: 'http://localhost:5000/api',
      googleClientId: 'test-client-id',
      debug: false
    },
    retries: {
      runMode: 2,
      openMode: 0
    },
    experimentalStudio: true,
    experimentalModifyObstructiveThirdPartyCode: true
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  // Configuration for different environments
  env: {
    // Development
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:5000/api'
    },
    // Staging
    staging: {
      baseUrl: 'https://staging.medicaltracker.com',
      apiUrl: 'https://staging-api.medicaltracker.com/api'
    },
    // Production
    production: {
      baseUrl: 'https://medicaltracker.com',
      apiUrl: 'https://api.medicaltracker.com/api'
    }
  }
}); 
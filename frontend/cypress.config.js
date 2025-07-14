const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // Always disable GPU for Electron
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'electron') {
          launchOptions.args.push('--disable-gpu');
        }
        return launchOptions;
      });
      // Set DEBUG for all Cypress runs
      process.env.DEBUG = 'cypress:*';
      return config;
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:3000'
    },
    supportFile: 'cypress/support/e2e.js'
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
}) 
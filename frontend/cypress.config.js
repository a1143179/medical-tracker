const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:55555',
    supportFile: false,
    video: false,
    chromeWebSecurity: false,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
}); 
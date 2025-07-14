module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    requireConfigFile: false
  },
  plugins: ['react', 'cypress'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      files: [
        'frontend/cypress/**/*.js',
        'frontend/cypress/**/*.cy.js'
      ],
      env: {
        'cypress/globals': true
      },
      extends: ['plugin:cypress/recommended'],
      rules: {
        'cypress/no-unnecessary-waiting': 'warn',
        'no-unused-vars': 'warn'
      }
    }
  ]
}; 
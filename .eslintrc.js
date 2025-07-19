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
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'never'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'indent': ['error', 2],
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unescaped-entities': 'warn'
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
        'no-unused-vars': 'warn',
        'no-console': 'off'
      }
    }
  ]
}; 
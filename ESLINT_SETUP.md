# ESLint Setup with Pre-commit Hook

This project uses ESLint with a pre-commit hook to ensure code quality and consistency.

## Configuration

### ESLint Configuration (`.eslintrc.js`)

The project uses a comprehensive ESLint configuration with the following features:

- **React Support**: Includes React-specific rules and hooks validation
- **Modern JavaScript**: Uses ES2021 features and modern syntax
- **Code Style**: Enforces consistent code formatting and style
- **Cypress Support**: Special configuration for Cypress test files

### Key Rules

- `no-unused-vars`: Warns about unused variables
- `no-console`: Warns about console statements (disabled in Cypress)
- `prefer-const`: Enforces use of `const` over `let` when possible
- `no-var`: Prevents use of `var` keyword
- `semi`: Enforces semicolons
- `quotes`: Enforces single quotes
- `indent`: Enforces 2-space indentation
- `react/jsx-key`: Ensures JSX elements have key props
- `react-hooks/rules-of-hooks`: Enforces React hooks rules

### Pre-commit Hook

The project uses Husky and lint-staged to run ESLint automatically before each commit:

1. **Husky**: Manages Git hooks
2. **lint-staged**: Runs linters only on staged files

### Configuration Files

- `.husky/pre-commit`: Runs `npx lint-staged` before each commit
- `package.json`: Contains lint-staged configuration
- `.eslintrc.js`: Main ESLint configuration

## Usage

### Manual Linting

```bash
# Lint all files
npm run lint

# Lint and fix automatically
npm run lint:fix
```

### Pre-commit Hook

The pre-commit hook runs automatically when you commit:

```bash
git add .
git commit -m "Your commit message"
# ESLint will run automatically on staged files
```

### What Happens During Commit

1. When you run `git commit`, the pre-commit hook triggers
2. lint-staged runs ESLint on all staged `.js` and `.jsx` files
3. ESLint automatically fixes any auto-fixable issues
4. Fixed files are automatically added to the commit
5. If there are unfixable errors, the commit is blocked

## File Coverage

The pre-commit hook covers:
- `frontend/src/**/*.{js,jsx}`: All React source files
- `frontend/cypress/**/*.{js,jsx}`: All Cypress test files

## Troubleshooting

### Commit Blocked by ESLint Errors

If your commit is blocked due to ESLint errors:

1. Check the error messages in the terminal
2. Fix the issues manually or run `npm run lint:fix`
3. Add the fixed files: `git add .`
4. Try committing again

### Disabling Pre-commit Hook (Not Recommended)

If you need to bypass the pre-commit hook temporarily:

```bash
git commit --no-verify -m "Your commit message"
```

### Updating ESLint Configuration

To modify ESLint rules:

1. Edit `.eslintrc.js`
2. Test your changes: `npm run lint`
3. Commit the configuration changes

## Best Practices

1. **Fix Issues Early**: Don't let ESLint errors accumulate
2. **Use Auto-fix**: Run `npm run lint:fix` to automatically fix common issues
3. **Review Warnings**: Pay attention to warnings, not just errors
4. **Consistent Style**: Follow the established code style rules
5. **Test Changes**: Always test your code after making ESLint changes

## Dependencies

The following packages are used for ESLint setup:

- `eslint`: Core linting engine
- `eslint-plugin-react`: React-specific rules
- `eslint-plugin-react-hooks`: React hooks rules
- `eslint-plugin-cypress`: Cypress-specific rules
- `@babel/eslint-parser`: JavaScript parser
- `husky`: Git hooks management
- `lint-staged`: Run linters on staged files 
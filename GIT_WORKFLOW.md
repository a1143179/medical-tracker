# Git Workflow

## Pre-commit Hook

The project is configured with a pre-commit hook that automatically runs ESLint checks before each commit.

### Features
- Automatically checks for ESLint errors in frontend code
- Automatically fixes fixable ESLint issues
- Prevents commits if errors are found

### Manual Execution
```bash
# Run pre-commit hook
npx husky run .husky/pre-commit

# Or run ESLint directly
cd frontend && npm run lint
```

## One-Click Commit Scripts

The project provides one-click git add, commit, and push scripts for multiple platforms:

### Windows (Batch)
```cmd
git-push.bat "commit message"
```

### Windows (PowerShell)
```powershell
.\git-push.ps1 "commit message"
```

### Linux/macOS (Shell)
```bash
./git-push.sh "commit message"
```

### Usage Examples
```bash
# Add all files, commit and push to remote repository
git-push.bat "Add ESLint pre-commit hook"

# Or use PowerShell
.\git-push.ps1 "Add ESLint pre-commit hook"

# Or use Shell (Linux/macOS)
./git-push.sh "Add ESLint pre-commit hook"
```

## Important Notes

1. **Pre-commit Hook**: ESLint checks run automatically on every git commit
2. **Error Handling**: If ESLint finds errors, the commit will be blocked until errors are fixed
3. **Auto-fix**: Fixable ESLint issues are automatically fixed before commit
4. **Commit Messages**: When using one-click commit scripts, please provide meaningful commit messages

## Troubleshooting

### If pre-commit hook fails
1. Check ESLint errors: `cd frontend && npm run lint`
2. Fix errors and commit again
3. If issues persist, you can temporarily skip the hook: `git commit --no-verify -m "message"`

### If one-click commit script fails
1. Check for uncommitted changes: `git status`
2. Check network connection
3. Ensure you have push permissions 
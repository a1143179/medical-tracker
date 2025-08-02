# Git 工作流程

## Pre-commit Hook

项目已经配置了pre-commit hook，会在每次提交前自动运行ESLint检查。

### 功能
- 自动检查前端代码的ESLint错误
- 自动修复可修复的ESLint问题
- 如果发现错误，会阻止提交

### 手动运行
```bash
# 运行pre-commit hook
npx husky run .husky/pre-commit

# 或者直接运行ESLint
cd frontend && npm run lint
```

## 一键提交脚本

项目提供了多个平台的一键git add、commit、push脚本：

### Windows (批处理)
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

### 使用示例
```bash
# 添加所有文件，提交并推送到远程仓库
git-push.bat "Add ESLint pre-commit hook"

# 或者使用PowerShell
.\git-push.ps1 "Add ESLint pre-commit hook"

# 或者使用Shell (Linux/macOS)
./git-push.sh "Add ESLint pre-commit hook"
```

## 注意事项

1. **Pre-commit Hook**: 每次git commit时都会自动运行ESLint检查
2. **错误处理**: 如果ESLint发现错误，提交会被阻止，需要先修复错误
3. **自动修复**: 可自动修复的ESLint问题会在提交前自动修复
4. **提交信息**: 使用一键提交脚本时，请提供有意义的提交信息

## 故障排除

### 如果pre-commit hook失败
1. 检查ESLint错误：`cd frontend && npm run lint`
2. 修复错误后重新提交
3. 如果问题持续，可以临时跳过hook：`git commit --no-verify -m "message"`

### 如果一键提交脚本失败
1. 检查是否有未提交的更改：`git status`
2. 检查网络连接
3. 确保有推送权限 
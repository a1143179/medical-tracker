@echo off
REM Git add, commit and push in one command
REM Usage: git-push.bat "commit message"

if "%~1"=="" (
    echo Error: Please provide a commit message
    echo Usage: git-push.bat "commit message"
    exit /b 1
)

echo Adding all files...
git add .

echo Committing with message: %1
git commit -m "%1"

echo Pushing to remote...
git push

echo Done! 
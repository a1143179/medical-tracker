# Git add, commit and push in one command
# Usage: .\git-push.ps1 "commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "Adding all files..." -ForegroundColor Green
git add .

Write-Host "Committing with message: $CommitMessage" -ForegroundColor Green
git commit -m $CommitMessage

Write-Host "Pushing to remote..." -ForegroundColor Green
git push

Write-Host "Done!" -ForegroundColor Green 
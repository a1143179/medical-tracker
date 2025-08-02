#!/bin/bash

# Git add, commit and push in one command
# Usage: ./git-push.sh "commit message"

if [ $# -eq 0 ]; then
    echo "Error: Please provide a commit message"
    echo "Usage: ./git-push.sh \"commit message\""
    exit 1
fi

echo "Adding all files..."
git add .

echo "Committing with message: $1"
git commit -m "$1"

echo "Pushing to remote..."
git push

echo "Done!" 
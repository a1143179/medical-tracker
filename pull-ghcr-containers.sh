#!/bin/bash

# Pull containers from GitHub Container Registry (GHCR)
# This script helps you pull the latest containers for local development

set -e

# Configuration
GITHUB_REPO="a1143179/medical-tracker"
MEDICALTRACKER_IMAGE="ghcr.io/$GITHUB_REPO/medicaltracker"

echo "🔍 Pulling containers from GitHub Container Registry..."
echo "Repository: $GITHUB_REPO"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Login to GHCR (if not already logged in)
echo "🔐 Logging in to GitHub Container Registry..."
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull medicaltracker container (contains both frontend and backend)
echo ""
echo "📦 Pulling medicaltracker container..."
docker pull $MEDICALTRACKER_IMAGE:latest
echo "✅ Medicaltracker container pulled successfully"

# List pulled images
echo ""
echo "📋 Pulled containers:"
docker images | grep ghcr.io/$GITHUB_REPO

echo ""
echo "🚀 To run the container locally:"
echo ""
echo "Medicaltracker (Frontend + Backend):"
echo "  docker run -p 8080:80 $MEDICALTRACKER_IMAGE:latest"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up"
echo ""
echo "🌐 Access the application at:"
echo "  Frontend: http://localhost:8080"
echo "  Backend API: http://localhost:8080/api"
echo "  Health Check: http://localhost:8080/health" 
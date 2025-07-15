# Deployment Guide - Multi-Domain Architecture

## Overview

This application has been restructured for a multi-domain production deployment:

- **Frontend**: `medicaltracker.azurewebsites.net`
- **Backend API**: `medicaltrackerapi.azurewebsites.net`
- **Authentication**: JWT-based with Google OAuth
- **Container Registry**: GitHub Container Registry (ghcr.io)

## Architecture Changes

### 1. Authentication System
- **Before**: Session-based authentication with cookies
- **After**: JWT-based authentication with HTTP-only cookies
- **User Identification**: Email address from Google OAuth

### 2. Development Environment
- **Before**: Single backend with proxy to frontend
- **After**: Separate frontend and backend services
- **Communication**: Direct API calls with JWT tokens

### 3. Production Deployment
- **Before**: Single container deployment
- **After**: Separate containers for frontend and backend
- **Registry**: GitHub Container Registry instead of Docker Hub

## Environment Variables

### Backend Environment Variables
```bash
# JWT Configuration
JWT_KEY=your-super-secret-jwt-key-at-least-32-characters
JWT_ISSUER=medicaltrackerapi.azurewebsites.net
JWT_AUDIENCE=medicaltracker.azurewebsites.net

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
ConnectionStrings__DefaultConnection=your-postgresql-connection-string

# Environment
ASPNETCORE_ENVIRONMENT=Production
```

### Frontend Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=https://medicaltrackerapi.azurewebsites.net

# Environment
NODE_ENV=production
```

## Local Development Setup

### 1. Backend Setup
```bash
cd backend
dotnet restore
dotnet run
# Backend will run on http://localhost:55556
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
# Frontend will run on http://localhost:55555
```

### 3. Environment Configuration
Create `frontend/.env.development`:
```
REACT_APP_API_URL=http://localhost:55556
```

## Production Deployment

### 1. Azure App Service Setup

#### Backend API (medicaltrackerapi.azurewebsites.net)
- **Runtime**: .NET 9
- **Port**: 8080
- **Container Image**: `
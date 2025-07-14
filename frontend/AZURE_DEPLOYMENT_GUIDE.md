# Azure Frontend Deployment Guide

This guide explains how to deploy the frontend React application to Azure App Service.

## Prerequisites

1. Azure subscription
2. Azure CLI installed
3. Node.js 20+ installed locally
4. Git repository with the frontend code

## Deployment Options

### Option 1: Azure App Service (Recommended)

#### 1. Create Azure App Service

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name medical-tracker-rg --location eastus

# Create App Service Plan
az appservice plan create --name medical-tracker-plan --resource-group medical-tracker-rg --sku B1 --is-linux

# Create Web App
az webapp create --name medicaltrackerfrontend --resource-group medical-tracker-rg --plan medical-tracker-plan --runtime "NODE|20-lts"
```

#### 2. Configure App Settings

```bash
# Set Node.js version
az webapp config appsettings set --name medicaltrackerfrontend --resource-group medical-tracker-rg --settings WEBSITE_NODE_DEFAULT_VERSION=20.11.0

# Set build settings
az webapp config appsettings set --name medicaltrackerfrontend --resource-group medical-tracker-rg --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Set environment variables
az webapp config appsettings set --name medicaltrackerfrontend --resource-group medical-tracker-rg --settings NODE_ENV=production GENERATE_SOURCEMAP=false CI=false
```

#### 3. Deploy from Local Build

```bash
# Build the application
cd frontend
npm run build:azure

# Deploy to Azure
az webapp deployment source config-local-git --name medicaltrackerfrontend --resource-group medical-tracker-rg
az webapp deployment user set --user-name <your-username> --password <your-password>

# Get the Git URL and deploy
git remote add azure <git-url-from-previous-command>
git add .
git commit -m "Deploy to Azure"
git push azure main
```

### Option 2: GitHub Actions (Automated)

#### 1. Set up GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions and add:

- `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure Portal > App Service > Get publish profile

#### 2. Push to Trigger Deployment

The `azure-deploy.yml` workflow will automatically:
- Build the application
- Deploy to Azure App Service
- Run health checks

### Option 3: Docker Container

#### 1. Build and Push to Azure Container Registry

```bash
# Create Azure Container Registry
az acr create --name medicaltrackeracr --resource-group medical-tracker-rg --sku Basic

# Build and push image
cd frontend
docker build -t medicaltrackeracr.azurecr.io/frontend:latest .
az acr login --name medicaltrackeracr
docker push medicaltrackeracr.azurecr.io/frontend:latest
```

#### 2. Deploy Container to App Service

```bash
# Configure App Service for containers
az webapp config container set --name medicaltrackerfrontend --resource-group medical-tracker-rg --docker-custom-image-name medicaltrackeracr.azurecr.io/frontend:latest
```

## Configuration Files

### web.config
- Handles client-side routing for React Router
- Configures security headers
- Sets up MIME types for static assets

### .deployment
- Specifies the build command for Azure App Service

### nginx.conf (for Docker)
- Configures nginx to serve the React app
- Sets up API proxy to backend
- Configures caching and compression

## Environment Variables

Set these in Azure App Service Configuration:

- `NODE_ENV`: production
- `GENERATE_SOURCEMAP`: false
- `CI`: false
- `REACT_APP_API_URL`: Your backend API URL

## Build Scripts

- `npm run build`: Standard build
- `npm run build:azure`: Azure-optimized build (no source maps)
- `npm run build:production`: Production build with optimizations
- `npm run serve`: Serve built files locally

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version and npm cache
2. **Routing doesn't work**: Verify web.config is in the build folder
3. **API calls fail**: Check CORS settings and API URL configuration
4. **Performance issues**: Enable compression and caching

### Logs

View logs in Azure Portal:
- App Service > Monitoring > Log stream
- App Service > Monitoring > Log analytics

### Health Check

The application includes a health check endpoint at `/health` that returns "healthy" when the app is running correctly.

## Security Considerations

1. **HTTPS**: Azure App Service provides automatic HTTPS
2. **Security Headers**: Configured in web.config and nginx.conf
3. **Environment Variables**: Store sensitive data in Azure Key Vault
4. **CORS**: Configure CORS settings for API communication

## Performance Optimization

1. **Static Assets**: Configured for long-term caching
2. **Compression**: Gzip compression enabled
3. **CDN**: Consider using Azure CDN for global distribution
4. **Build Optimization**: Source maps disabled for production

## Monitoring

1. **Application Insights**: Enable for detailed monitoring
2. **Azure Monitor**: Set up alerts for availability and performance
3. **Custom Metrics**: Track user interactions and errors 
# Azure Docker Deployment Guide

This guide explains how to deploy the frontend React application using Docker to Azure Container services.

## Why Docker?

✅ **Complete Control**: Node.js version, dependencies, and environment
✅ **Consistency**: Same environment everywhere (dev, staging, production)
✅ **Portability**: Works on any cloud platform
✅ **Performance**: Optimized nginx serving of static files
✅ **Scalability**: Easy horizontal scaling

## Prerequisites

1. Azure subscription
2. Azure CLI installed
3. Docker installed locally
4. Git repository with the frontend code

## Deployment Options

### Option 1: Azure Container Instances (Recommended for Simple Apps)

#### 1. Build and Push to Azure Container Registry

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name medical-tracker-rg --location eastus

# Create Azure Container Registry
az acr create --name medicaltrackeracr --resource-group medical-tracker-rg --sku Basic --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name medicaltrackeracr --resource-group medical-tracker-rg --query loginServer --output tsv)

# Login to ACR
az acr login --name medicaltrackeracr

# Build and tag image
cd frontend
docker build -t $ACR_LOGIN_SERVER/frontend:latest .

# Push to ACR
docker push $ACR_LOGIN_SERVER/frontend:latest
```

#### 2. Deploy to Container Instances

```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name medicaltrackeracr --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name medicaltrackeracr --query passwords[0].value --output tsv)

# Deploy to Container Instances
az container create \
  --resource-group medical-tracker-rg \
  --name medical-tracker-frontend \
  --image $ACR_LOGIN_SERVER/frontend:latest \
  --dns-name-label medical-tracker-frontend \
  --ports 80 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --environment-variables NODE_ENV=production
```

### Option 2: Azure Container Apps (Serverless)

#### 1. Create Container Apps Environment

```bash
# Create Container Apps environment
az containerapp env create \
  --name medical-tracker-env \
  --resource-group medical-tracker-rg \
  --location eastus
```

#### 2. Deploy Container App

```bash
# Deploy the container app
az containerapp create \
  --name medical-tracker-frontend \
  --resource-group medical-tracker-rg \
  --environment medical-tracker-env \
  --image $ACR_LOGIN_SERVER/frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars NODE_ENV=production
```

### Option 3: Azure App Service for Containers

#### 1. Create App Service Plan

```bash
# Create App Service Plan for containers
az appservice plan create \
  --name medical-tracker-container-plan \
  --resource-group medical-tracker-rg \
  --sku B1 \
  --is-linux
```

#### 2. Create Web App for Containers

```bash
# Create Web App for containers
az webapp create \
  --resource-group medical-tracker-rg \
  --plan medical-tracker-container-plan \
  --name medicaltrackerfrontend \
  --deployment-local-git

# Configure container settings
az webapp config container set \
  --name medicaltrackerfrontend \
  --resource-group medical-tracker-rg \
  --docker-custom-image-name $ACR_LOGIN_SERVER/frontend:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD
```

## GitHub Actions for Docker Deployment

Create `.github/workflows/docker-deploy.yml`:

```yaml
name: Deploy Frontend Docker to Azure

on:
  push:
    branches: [ main, master ]
    paths:
      - 'frontend/**'

env:
  ACR_NAME: medicaltrackeracr
  RESOURCE_GROUP: medical-tracker-rg
  CONTAINER_APP_NAME: medical-tracker-frontend

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Login to Azure
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
        
    - name: Login to ACR
      run: az acr login --name ${{ env.ACR_NAME }}
      
    - name: Build and push Docker image
      run: |
        cd frontend
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/frontend:${{ github.sha }} .
        docker push ${{ env.ACR_NAME }}.azurecr.io/frontend:${{ github.sha }}
        
    - name: Deploy to Container Apps
      run: |
        az containerapp update \
          --name ${{ env.CONTAINER_APP_NAME }} \
          --resource-group ${{ env.RESOURCE_GROUP }} \
          --image ${{ env.ACR_NAME }}.azurecr.io/frontend:${{ github.sha }}
```

## Local Development with Docker

### Build and Run Locally

```bash
# Build the image
cd frontend
docker build -t medical-tracker-frontend .

# Run locally
docker run -p 3000:80 medical-tracker-frontend

# Access at http://localhost:3000
```

### Development with Volume Mounting

```bash
# Run with source code mounted for development
docker run -p 3000:80 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  medical-tracker-frontend
```

## Docker Compose for Full Stack

Create `docker-compose.yml` in the root:

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - medical-tracker-network

  backend:
    build: ./backend
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=your-connection-string
    networks:
      - medical-tracker-network

networks:
  medical-tracker-network:
    driver: bridge
```

## Performance Benefits

### 1. **Nginx Optimization**
- Static file serving optimized
- Gzip compression enabled
- Long-term caching for assets
- Security headers configured

### 2. **Multi-stage Build**
- Smaller production image
- No development dependencies
- Optimized for production

### 3. **Health Checks**
- Built-in health monitoring
- Automatic container restart
- Azure monitoring integration

## Cost Comparison

| Service | Cost (Basic Tier) | Best For |
|---------|------------------|----------|
| Container Instances | ~$0.000014/second | Simple apps, dev/test |
| Container Apps | ~$0.000024/second | Serverless, auto-scaling |
| App Service Containers | ~$0.013/hour | Traditional hosting |

## Monitoring and Logs

### View Logs

```bash
# Container Instances
az container logs --name medical-tracker-frontend --resource-group medical-tracker-rg

# Container Apps
az containerapp logs show --name medical-tracker-frontend --resource-group medical-tracker-rg

# App Service
az webapp log tail --name medicaltrackerfrontend --resource-group medical-tracker-rg
```

### Application Insights

Enable Application Insights for detailed monitoring:

```bash
# Create Application Insights
az monitor app-insights component create \
  --app medical-tracker-insights \
  --location eastus \
  --resource-group medical-tracker-rg \
  --application-type web
```

## Security Best Practices

1. **Image Scanning**: Use Azure Security Center to scan images
2. **Secrets Management**: Use Azure Key Vault for sensitive data
3. **Network Security**: Configure VNet integration
4. **RBAC**: Use Azure AD for access control

## Troubleshooting

### Common Issues

1. **Build Fails**: Check Dockerfile syntax and dependencies
2. **Image Push Fails**: Verify ACR credentials
3. **Container Won't Start**: Check logs and health checks
4. **Performance Issues**: Monitor resource usage

### Debug Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs <container-id>

# Execute commands in container
docker exec -it <container-id> /bin/sh

# Check nginx configuration
docker exec <container-id> nginx -t
``` 
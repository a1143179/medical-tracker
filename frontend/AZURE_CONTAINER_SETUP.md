# Azure Container Registry Setup Guide

This guide shows you how to set up Azure Container Registry and configure container options in Azure App Service.

## Step 1: Create Azure Container Registry

### Using Azure CLI (Recommended)

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name medical-tracker-rg --location eastus

# Create Azure Container Registry
az acr create \
  --name medicaltrackeracr \
  --resource-group medical-tracker-rg \
  --sku Basic \
  --admin-enabled true

# Get the login server URL
ACR_LOGIN_SERVER=$(az acr show --name medicaltrackeracr --resource-group medical-tracker-rg --query loginServer --output tsv)
echo "Your ACR login server: $ACR_LOGIN_SERVER"
```

### Using Azure Portal

1. Go to Azure Portal
2. Click "Create a resource"
3. Search for "Container Registry"
4. Click "Create"
5. Fill in the details:
   - **Registry name**: `medicaltrackeracr`
   - **Resource group**: `medical-tracker-rg`
   - **Location**: `East US`
   - **SKU**: `Basic`
   - **Admin user**: `Enabled`

## Step 2: Build and Push Your Image

```bash
# Login to ACR
az acr login --name medicaltrackeracr

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name medicaltrackeracr --resource-group medical-tracker-rg --query loginServer --output tsv)

# Build the image
cd frontend
docker build -t $ACR_LOGIN_SERVER/frontend:latest .

# Push to ACR
docker push $ACR_LOGIN_SERVER/frontend:latest
```

## Step 3: Create App Service for Containers

### Using Azure CLI

```bash
# Create App Service Plan
az appservice plan create \
  --name medical-tracker-container-plan \
  --resource-group medical-tracker-rg \
  --sku B1 \
  --is-linux

# Create Web App for containers
az webapp create \
  --resource-group medical-tracker-rg \
  --plan medical-tracker-container-plan \
  --name medicaltrackerfrontend \
  --deployment-local-git

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name medicaltrackeracr --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name medicaltrackeracr --query passwords[0].value --output tsv)

# Configure container settings
az webapp config container set \
  --name medicaltrackerfrontend \
  --resource-group medical-tracker-rg \
  --docker-custom-image-name $ACR_LOGIN_SERVER/frontend:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD
```

### Using Azure Portal

1. Go to Azure Portal
2. Click "Create a resource"
3. Search for "Web App"
4. Click "Create"
5. Fill in the basics:
   - **Name**: `medicaltrackerfrontend`
   - **Publish**: `Container`
   - **Operating System**: `Linux`
   - **Region**: `East US`
   - **App Service Plan**: Create new or use existing

6. Click "Next: Docker"
7. Choose "Azure Container Registry"
8. Fill in the container options:

**Container Options Configuration:**
- **Registry**: `Azure Container Registry`
- **Registry**: Select your `medicaltrackeracr`
- **Image**: `frontend`
- **Tag**: `latest`
- **Startup Command**: Leave empty (uses Dockerfile CMD)

## Step 4: Alternative - GitHub Container Registry

If you prefer to use GitHub Container Registry:

### 1. Create GitHub Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token with `write:packages` scope
3. Copy the token

### 2. Push to GitHub Container Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Build and tag for GitHub Container Registry
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/medical-tracker-frontend:latest .

# Push to GitHub Container Registry
docker push ghcr.io/YOUR_GITHUB_USERNAME/medical-tracker-frontend:latest
```

### 3. Configure in Azure Portal

**Container Options:**
- **Registry**: `Other`
- **Registry Server URL**: `https://ghcr.io`
- **Image**: `YOUR_GITHUB_USERNAME/medical-tracker-frontend`
- **Tag**: `latest`
- **Username**: `YOUR_GITHUB_USERNAME`
- **Password**: `YOUR_GITHUB_TOKEN`

## Step 5: Environment Variables

Set these in Azure App Service Configuration:

```bash
# Set environment variables
az webapp config appsettings set \
  --name medicaltrackerfrontend \
  --resource-group medical-tracker-rg \
  --settings \
    NODE_ENV=production \
    GENERATE_SOURCEMAP=false \
    CI=false
```

## Step 6: Verify Deployment

```bash
# Check the app status
az webapp show --name medicaltrackerfrontend --resource-group medical-tracker-rg

# Get the app URL
az webapp show --name medicaltrackerfrontend --resource-group medical-tracker-rg --query defaultHostName --output tsv

# Test the health endpoint
curl https://medicaltrackerfrontend.azurewebsites.net/health
```

## Troubleshooting

### Common Issues

1. **"Registry not found" error**
   - Verify the registry server URL is correct
   - Check that the registry exists and is accessible

2. **"Authentication failed" error**
   - Verify username and password
   - For ACR, use the admin credentials
   - For GitHub, use your personal access token

3. **"Image not found" error**
   - Verify the image name and tag
   - Check that the image was pushed successfully

### Debug Commands

```bash
# Check ACR repositories
az acr repository list --name medicaltrackeracr

# Check ACR tags
az acr repository show-tags --name medicaltrackeracr --repository frontend

# View container logs
az webapp log tail --name medicaltrackerfrontend --resource-group medical-tracker-rg
```

## Cost Optimization

### ACR Pricing (Basic Tier)
- **Storage**: $0.10 per GB per month
- **Data transfer**: $0.087 per GB
- **Webhook operations**: $0.60 per 100,000 operations

### App Service Pricing (B1 Tier)
- **Compute**: ~$13.14 per month
- **Includes**: 1.75 GB RAM, 1 CPU core

## Security Best Practices

1. **Use Managed Identity** (instead of admin credentials)
2. **Enable ACR firewall** to restrict access
3. **Use private endpoints** for secure communication
4. **Regular image scanning** for vulnerabilities

## Next Steps

1. **Set up CI/CD** using GitHub Actions
2. **Configure custom domain** and SSL
3. **Set up monitoring** with Application Insights
4. **Configure auto-scaling** based on traffic 
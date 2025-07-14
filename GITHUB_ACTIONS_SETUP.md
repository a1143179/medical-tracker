# GitHub Actions Setup Guide

This guide will help you set up automatic deployment to Azure when you push to the main branch.

## Prerequisites

1. ✅ Azure App Service created (`medicaltrackerfrontend`)
2. ✅ GitHub repository with your code
3. ✅ Azure CLI installed locally

## Step 1: Get Azure Publish Profile

### Option A: Using Azure Portal

1. Go to Azure Portal
2. Navigate to your App Service (`medicaltrackerfrontend`)
3. Click "Get publish profile"
4. Download the `.publishsettings` file
5. Open the file and copy the content

### Option B: Using Azure CLI

```bash
# Get the publish profile
az webapp deployment list-publishing-profiles \
  --name medicaltrackerfrontend \
  --resource-group medical-tracker-rg \
  --xml
```

## Step 2: Create Azure Service Principal (for Docker deployment)

If you want to use the Docker deployment workflow, create a service principal:

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "medical-tracker-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/medical-tracker-rg \
  --sdk-auth

# Copy the entire JSON output - you'll need this for the secret
```

## Step 3: Configure GitHub Secrets

### Go to GitHub Repository Settings

1. Go to your GitHub repository
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Click "New repository secret"

### Add Required Secrets

#### For Standard Deployment (deploy-frontend.yml):

**Secret Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
**Secret Value**: Paste the entire content of your `.publishsettings` file

#### For Docker Deployment (deploy-frontend-docker.yml):

**Secret Name**: `AZURE_CREDENTIALS`
**Secret Value**: Paste the entire JSON output from the service principal creation

## Step 4: Choose Your Deployment Method

### Option A: Standard Deployment (Recommended for beginners)

This builds your React app and deploys the static files to Azure App Service.

**Workflow File**: `.github/workflows/deploy-frontend.yml`

**Pros:**
- ✅ Simpler setup
- ✅ Faster deployments
- ✅ No Docker registry needed
- ✅ Works with any Azure App Service

**Cons:**
- ❌ Limited to static file hosting
- ❌ No custom runtime control

### Option B: Docker Deployment

This builds a Docker container and deploys it to Azure App Service for Containers.

**Workflow File**: `.github/workflows/deploy-frontend-docker.yml`

**Prerequisites:**
- Azure Container Registry
- App Service configured for containers

**Pros:**
- ✅ Complete environment control
- ✅ Better performance with nginx
- ✅ Consistent across environments
- ✅ More deployment options

**Cons:**
- ❌ More complex setup
- ❌ Requires Azure Container Registry
- ❌ Slower deployments

## Step 5: Test the Deployment

### 1. Make a Small Change

```bash
# Make a small change to trigger deployment
echo "# Updated at $(date)" >> frontend/README.md
git add .
git commit -m "Test deployment"
git push origin main
```

### 2. Monitor the Deployment

1. Go to your GitHub repository
2. Click "Actions" tab
3. You should see your workflow running
4. Click on it to see detailed logs

### 3. Verify the Deployment

```bash
# Check if your app is deployed
curl https://medicaltrackerfrontend.azurewebsites.net/health
```

## Step 6: Configure Environment Variables (Optional)

Set these in Azure App Service Configuration:

```bash
# Set environment variables
az webapp config appsettings set \
  --name medicaltrackerfrontend \
  --resource-group medical-tracker-rg \
  --settings \
    NODE_ENV=production \
    GENERATE_SOURCEMAP=false \
    CI=false \
    REACT_APP_API_URL=https://your-backend-api.azurewebsites.net
```

## Troubleshooting

### Common Issues

#### 1. "Publish profile not found" error
- Verify the secret name is exactly `AZURE_WEBAPP_PUBLISH_PROFILE`
- Check that the publish profile content is complete
- Ensure your App Service name matches the workflow

#### 2. "Build failed" error
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check for syntax errors in your code

#### 3. "Deployment failed" error
- Verify App Service is running
- Check App Service logs in Azure Portal
- Ensure the app name matches exactly

#### 4. "Health check failed" error
- Wait a few minutes for the app to fully start
- Check the health endpoint manually
- Verify the health file exists in your build

### Debug Commands

```bash
# Check App Service status
az webapp show --name medicaltrackerfrontend --resource-group medical-tracker-rg

# View App Service logs
az webapp log tail --name medicaltrackerfrontend --resource-group medical-tracker-rg

# Test the health endpoint
curl -v https://medicaltrackerfrontend.azurewebsites.net/health
```

## Workflow Customization

### Environment-Specific Deployments

You can create different workflows for different environments:

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [ develop ]
# ... rest of workflow

# .github/workflows/deploy-production.yml
name: Deploy to Production
on:
  push:
    branches: [ main ]
# ... rest of workflow
```

### Conditional Deployments

```yaml
# Only deploy on specific file changes
on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
      - '.github/workflows/**'
```

### Manual Deployments

```yaml
# Allow manual triggering
on:
  push:
    branches: [ main ]
  workflow_dispatch: # Allows manual trigger
```

## Security Best Practices

1. **Use Service Principals**: Don't use personal Azure credentials
2. **Limit Permissions**: Give only necessary permissions to the service principal
3. **Rotate Secrets**: Regularly update your secrets
4. **Monitor Deployments**: Set up alerts for failed deployments

## Next Steps

1. **Set up monitoring**: Enable Application Insights
2. **Configure custom domain**: Add your own domain
3. **Set up SSL**: Configure HTTPS certificates
4. **Add testing**: Include unit and integration tests in the workflow
5. **Set up staging**: Create a staging environment for testing

## Cost Optimization

- **GitHub Actions**: Free for public repos, 2000 minutes/month for private repos
- **Azure App Service**: Pay only for the service tier you choose
- **Container Registry**: Only pay for storage and data transfer

## Support

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly configured
3. Ensure your Azure resources are properly set up
4. Check the Azure App Service logs for additional information 
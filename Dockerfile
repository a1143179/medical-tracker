# ---- Step 1: create final docker image ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
# Copy the pre-built backend files
COPY backend-publish/. .
# Copy the pre-built frontend files
COPY frontend/build ./wwwroot

# expose port 8080 for Azure App Service compatibility
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "backend.dll"]
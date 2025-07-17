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

# Install EF Core tools for migrations
RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

# Use a shell entrypoint to run migrations then start the app
ENTRYPOINT ["/bin/sh", "-c", "dotnet ef database update --no-build --project /app --context AppDbContext && dotnet backend.dll"]
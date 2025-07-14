# ---- Step 1: create React frontend ----
FROM node:18 AS react-build
WORKDIR /app
# Copy package files first for better layer caching
COPY frontend/package*.json ./
RUN npm ci --only=production
# Copy source code
COPY frontend/ ./
RUN npm run build

# ---- Step 2: create ASP.NET Core backend ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-build
WORKDIR /src
COPY backend/*.csproj ./
RUN dotnet restore
COPY backend/. ./
RUN dotnet publish -c Release -o /app/publish

# ---- Step 3: create final docker image ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
# get the backend built files
COPY --from=dotnet-build /app/publish .
# get the frontend built files
COPY --from=react-build /app/build ./wwwroot

# expose port 8080 for Azure App Service compatibility
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "backend.dll"]
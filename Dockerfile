FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY backend-publish/ .
COPY frontend/build ./wwwroot
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "backend.dll"]
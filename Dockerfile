FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY backend-publish/ .
EXPOSE 55555
ENV ASPNETCORE_URLS=http://+:55555
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "backend.dll"]
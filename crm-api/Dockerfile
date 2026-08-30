# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["crm-api.csproj", "./"]
RUN dotnet restore "crm-api.csproj"

COPY . .
RUN dotnet publish "crm-api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5040
EXPOSE 5040
ENTRYPOINT ["dotnet", "crm-api.dll"]

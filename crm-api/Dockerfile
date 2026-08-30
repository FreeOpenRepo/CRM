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
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:5040
ENV ASPNETCORE_HTTP_PORTS=5040
EXPOSE 5040
ENTRYPOINT ["dotnet", "crm-api.dll"]



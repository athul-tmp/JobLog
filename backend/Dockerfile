# Build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the backend project file
COPY ["backend.csproj", "."]
RUN dotnet restore "backend.csproj"

# Copy the rest of the backend code
COPY . .

# Publish the application
RUN dotnet publish "backend.csproj" -c Release -o /app/publish --no-restore

# Runtime image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final 
WORKDIR /app

# Port
ENV ASPNETCORE_URLS=http://+:8080
ENV PORT=8080
EXPOSE 8080

# Copy custom entrypoint script and make it executable
COPY ["entrypoint.sh", "/app/entrypoint.sh"] 
RUN chmod +x /app/entrypoint.sh

# Copy published output from the build stage
COPY --from=build /app/publish .

# Custom script as entrypoint
ENTRYPOINT ["./entrypoint.sh"]
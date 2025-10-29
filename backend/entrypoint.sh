# This script runs EF Core migrations before starting the application.

# Execute database migrations
echo "Applying Entity Framework Core migrations..."
dotnet ef database update --project backend.csproj

# Start the application
echo "Starting backend application..."
exec dotnet backend.dll
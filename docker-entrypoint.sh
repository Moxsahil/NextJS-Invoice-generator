#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it's needed)
echo "Generating Prisma client..."
npx prisma generate

# Start the Next.js application
echo "Starting Next.js application..."
node server.js
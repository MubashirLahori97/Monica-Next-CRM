#!/bin/sh
# Wait for the database to be ready
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL started"

# Run Prisma migrations
echo "Deploying database migrations..."
npx prisma db push


# Seed the database
echo "Seeding the database..."
npx tsx prisma/seed.ts

# Start the Next.js app
echo "Starting Next.js..."
node server.js

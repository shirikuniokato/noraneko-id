#!/bin/bash

# Development startup script for noraneko-id

echo "Starting development environment..."

# Start PostgreSQL
echo "Starting PostgreSQL..."
docker-compose up -d postgres

echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Start backend in background
echo "Starting backend server..."
cd backend
go run ./cmd/server &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend..."
cd web
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Development servers started!"
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    docker-compose down
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# Wait for services
wait
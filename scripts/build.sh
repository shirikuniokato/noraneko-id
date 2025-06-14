#!/bin/bash

# Build script for noraneko-id

echo "Building noraneko-id..."

# Build backend
echo "Building backend..."
cd backend
go build -o bin/server ./cmd/server
cd ..

# Build frontend
echo "Building frontend..."
cd web
npm run build
cd ..

echo "Build completed!"
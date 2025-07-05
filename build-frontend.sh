#!/bin/bash

# Frontend build script with error handling and debugging
set -e  # Exit on any error

echo "🚀 Starting frontend build process..."

# Navigate to frontend directory
cd frontend

echo "📦 Current directory: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found! Installing dependencies..."
    npm install
fi

echo "📦 Dependencies installed. Starting build..."

# Set environment variables for build
export CI=false
export NODE_OPTIONS="--max-old-space-size=4096"
export GENERATE_SOURCEMAP=false

echo "🔧 Environment variables set:"
echo "   CI=$CI"
echo "   NODE_OPTIONS=$NODE_OPTIONS"
echo "   GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP"

# Run the build
echo "🏗️ Running npm run build..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Frontend build completed successfully!"
    echo "📁 Build directory contents:"
    ls -la build/
else
    echo "❌ Frontend build failed - no build directory found!"
    exit 1
fi

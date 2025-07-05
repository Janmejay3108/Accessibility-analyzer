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
    npm install --no-audit --no-fund
fi

echo "📦 Dependencies installed. Starting build..."

# Set environment variables for build (Railway-optimized)
export CI=false
export NODE_OPTIONS="--max-old-space-size=2048"
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true
export ESLINT_NO_DEV_ERRORS=true

echo "🔧 Environment variables set:"
echo "   CI=$CI"
echo "   NODE_OPTIONS=$NODE_OPTIONS"
echo "   GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP"
echo "   DISABLE_ESLINT_PLUGIN=$DISABLE_ESLINT_PLUGIN"

# Clean any previous build
echo "🧹 Cleaning previous build..."
rm -rf build

# Run the build with error handling
echo "🏗️ Running npm run build..."
if npm run build; then
    echo "✅ Build command completed"
else
    echo "❌ Build command failed with exit code $?"
    echo "📋 Checking for common issues..."

    # Check available memory
    echo "💾 Available memory:"
    free -h || echo "Memory info not available"

    # Check disk space
    echo "💿 Available disk space:"
    df -h . || echo "Disk info not available"

    # List current directory contents
    echo "📁 Current directory contents:"
    ls -la

    exit 1
fi

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Frontend build completed successfully!"
    echo "📁 Build directory contents:"
    ls -la build/
    echo "📊 Build size:"
    du -sh build/
else
    echo "❌ Frontend build failed - no build directory found!"
    exit 1
fi

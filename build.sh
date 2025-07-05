#!/bin/bash

# Railway Build Script for Accessibility Analyzer
set -e

echo "🚀 Starting Railway build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build frontend
echo "🎨 Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "⚙️ Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ Build completed successfully!"
echo "📁 Frontend build available at: frontend/build/"
echo "🚀 Ready to start server with: npm start"

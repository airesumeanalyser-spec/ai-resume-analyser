#!/bin/bash

# Build script for Vercel deployment
echo "🔧 Starting React Router build..."

# Run npm build script which uses the locally installed react-router CLI
npm run build

echo "✅ Build completed!"

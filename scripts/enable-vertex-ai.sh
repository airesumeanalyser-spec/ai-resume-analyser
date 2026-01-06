#!/bin/bash

# Script to enable Vertex AI API

PROJECT_ID="stackresume-ai-473406"

echo "🤖 Enabling Vertex AI API for AI Resume Analyzer"
echo "================================================="
echo "Project: $PROJECT_ID"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --format="value(account)" 2>/dev/null | grep -q "@"; then
    echo "❌ Not authenticated with gcloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Set the project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo ""
echo "Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com

echo ""
echo "✅ Vertex AI API has been enabled!"
echo ""
echo "⏰ Please wait 1-2 minutes for the changes to propagate."
echo "   Then try uploading your resume again."
echo ""
echo "You can also enable it manually at:"
echo "https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=$PROJECT_ID"

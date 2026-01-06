#!/bin/bash

# Script to fix Google Cloud Storage permissions for the service account

PROJECT_ID="animated-tracer-473406-t5"
SERVICE_ACCOUNT="ai-resume-analyzer@animated-tracer-473406-t5.iam.gserviceaccount.com"
BUCKET_NAME="ai-resume-analyzer-uploads"

echo "🔧 Fixing GCS permissions for AI Resume Analyzer"
echo "================================================="
echo "Project: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo "Bucket: $BUCKET_NAME"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ Not authenticated with gcloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Set the project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo ""
echo "Option 1: Grant permissions at project level (recommended)"
echo "-----------------------------------------------------------"
echo "Run these commands:"
echo ""
echo "# Grant Storage Object Admin role"
echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "    --member=\"serviceAccount:$SERVICE_ACCOUNT\" \\"
echo "    --role=\"roles/storage.objectAdmin\""
echo ""

echo "Option 2: Grant permissions at bucket level"
echo "--------------------------------------------"
echo "Run this command:"
echo ""
echo "gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:roles/storage.objectAdmin gs://$BUCKET_NAME"
echo ""

echo "Option 3: Use gcloud to grant bucket-level permissions"
echo "-------------------------------------------------------"
echo "Run this command:"
echo ""
echo "gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \\"
echo "    --member=\"serviceAccount:$SERVICE_ACCOUNT\" \\"
echo "    --role=\"roles/storage.objectAdmin\""
echo ""

echo "📝 Quick fix (choose one method above and run it):"
echo ""
read -p "Would you like to run Option 1 now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Granting Storage Object Admin role at project level..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/storage.objectAdmin"
    
    echo ""
    echo "✅ Permissions granted! Try uploading again."
else
    echo ""
    echo "Please run one of the commands above manually."
fi

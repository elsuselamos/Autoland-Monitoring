#!/bin/bash
# Deploy Cloud Run - Autoland Monitoring
# Script to deploy with Bug #3 & #4 fixes

export PROJECT_ID="autoland-vj"
export REGION="asia-southeast1"
export REPO_NAME="autoland-vj"
# NOTE: No :latest suffix here - will be added in gcloud command
export IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/autoland-vj"
export SA_EMAIL="autoland-vj-runner@$PROJECT_ID.iam.gserviceaccount.com"
export CONNECTION_NAME="$PROJECT_ID:asia-southeast1:autoland-db"

echo "=== Step 1: Build Docker image ==="
echo "Image: $IMAGE_NAME:latest"
echo ""

gcloud builds submit \
  --tag $IMAGE_NAME:latest \
  --project=$PROJECT_ID \
  --timeout=1200

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Docker build failed!"
    exit 1
fi

echo ""
echo "=== Step 2: Deploy to Cloud Run ==="
echo ""

gcloud run deploy autoland-vj \
  --image $IMAGE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account $SA_EMAIL \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "APP_ENV=production" \
  --set-env-vars "DB_HOST=/cloudsql/$CONNECTION_NAME" \
  --set-env-vars "DB_PORT=5432" \
  --set-env-vars "DB_NAME=autoland" \
  --set-env-vars "DB_USER=autoland" \
  --set-secrets "DB_PASSWORD=autoland-db-password:latest" \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID" \
  --set-env-vars "GCP_STORAGE_BUCKET=autoland-reports" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://autoland.blocksync.me" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --project=$PROJECT_ID

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Cloud Run deployment failed!"
    exit 1
fi

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Service URL: https://autoland-vj-555768155013.$REGION.run.app"
echo "Custom Domain: https://autoland.blocksync.me"
echo ""
echo "Deployment Status:"
echo "- Bug #3 (Timestamp Format): FIXED"
echo "- Bug #4 (VARCHAR Constraint): FIXED"
echo ""
echo "Next: Test by sending email with 'Autoland' in subject + PDF attachment"
echo ""

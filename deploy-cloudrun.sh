#!/bin/bash
# Deploy Cloud Run với timestamp fix

export PROJECT_ID="autoland-vj"
export REGION="asia-southeast1"
export REPO_NAME="autoland-vj"
export IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/autoland-vj"

echo "=== Step 1: Build Docker image ==="
gcloud builds submit \
  --tag $IMAGE_NAME:latest \
  --project=$PROJECT_ID \
  --timeout=1200

echo ""
echo "=== Step 2: Deploy to Cloud Run ==="
gcloud run deploy autoland-vj \
  --image $IMAGE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account autoland-vj-runner@$PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances $PROJECT_ID:asia-southeast1:autoland-db \
  --set-env-vars "APP_ENV=production" \
  --set-env-vars "DB_HOST=/cloudsql/$PROJECT_ID:asia-southeast1:autoland-db" \
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

echo ""
echo "=== Deployment Complete! ==="
echo "Service URL: https://autoland-vj-555768155013.$REGION.run.app"
echo "Custom Domain: https://autoland.blocksync.me"

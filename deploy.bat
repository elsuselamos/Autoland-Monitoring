@echo off
REM Deploy Cloud Run - Autoland Monitoring
REM Bat file de deploy len Google Cloud Run

set PROJECT_ID=autoland-vj
set REGION=asia-southeast1
set REPO_NAME=autoland-vj
set IMAGE_NAME=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/autoland-vj

echo.
echo === Step 1: Build Docker image using Cloud Build ===
echo.

gcloud builds submit ^
  --tag %IMAGE_NAME%:latest ^
  --project=%PROJECT_ID% ^
  --timeout=1200

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo.
echo === Step 2: Deploy to Cloud Run ===
echo.

gcloud run deploy autoland-vj ^
  --image %IMAGE_NAME%:latest ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --service-account autoland-vj-runner@%PROJECT_ID%.iam.gserviceaccount.com ^
  --add-cloudsql-instances %PROJECT_ID%:%REGION%:autoland-db ^
  --set-env-vars "APP_ENV=production" ^
  --set-env-vars "DB_HOST=/cloudsql/%PROJECT_ID%:%REGION%/autoland-db" ^
  --set-env-vars "DB_PORT=5432" ^
  --set-env-vars "DB_NAME=autoland" ^
  --set-env-vars "DB_USER=autoland" ^
  --set-secrets "DB_PASSWORD=autoland-db-password:latest" ^
  --set-env-vars "GCP_PROJECT_ID=%PROJECT_ID%" ^
  --set-env-vars "GCP_STORAGE_BUCKET=autoland-reports" ^
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://autoland.blocksync.me" ^
  --memory 1Gi ^
  --cpu 1 ^
  --timeout 300 ^
  --min-instances 0 ^
  --max-instances 10 ^
  --project=%PROJECT_ID%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Cloud Run deployment failed!
    pause
    exit /b 1
)

echo.
echo === Deployment Complete! ===
echo.
echo Service URL: https://autoland-vj-555768155013.%REGION%.run.app
echo Custom Domain: https://autoland.blocksync.me
echo.
echo Deployment Status:
echo - Bug #3 (Timestamp Format): FIXED
echo - Bug #4 (VARCHAR Constraint): FIXED
echo.
pause

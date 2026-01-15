# Script to check Cloud Function logs
# Usage: In PowerShell, run: .\check-logs.ps1

Write-Host "Checking Cloud Function logs..." -ForegroundColor Green

gcloud functions logs read gmail-pubsub-processor `
  --region=asia-southeast1 `
  --limit=50 `
  --project=autoland-vj

Write-Host "`nLogs check completed!" -ForegroundColor Cyan

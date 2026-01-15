# Script to publish test Pub/Sub message and check logs
# Usage: In PowerShell, run: .\test-pubsub.ps1

Write-Host "Publishing test message to Pub/Sub..." -ForegroundColor Green

gcloud pubsub topics publish gmail-notifications `
  --message='{"emailAddress":"tiendat2407@gmail.com","historyId":2499999}' `
  --project=autoland-vj

Write-Host "`nMessage published! Checking logs..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

gcloud functions logs read gmail-pubsub-processor `
  --region=asia-southeast1 `
  --limit=20 `
  --project=autoland-vj

Write-Host "`nTest completed!" -ForegroundColor Cyan

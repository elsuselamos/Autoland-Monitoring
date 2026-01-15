# Google Cloud SDK Installation Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "Starting Google Cloud SDK installation..." -ForegroundColor Green

# Create temp directory
$tempDir = "$env:TEMP\gcloud-install"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Download installer
$installerUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
$installerPath = "$tempDir\GoogleCloudSDKInstaller.exe"

Write-Host "Downloading Google Cloud SDK installer..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

# Run installer
Write-Host "Running installer..." -ForegroundColor Yellow
Start-Process -FilePath $installerPath -Wait

# Clean up
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Please CLOSE this PowerShell and open a NEW one to use gcloud command." -ForegroundColor Cyan
Write-Host "Then run: gcloud init" -ForegroundColor Cyan

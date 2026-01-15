#!/bin/bash

# Script to trigger Gmail Watch renewal
# Run this in PowerShell or Cloud Shell

echo "Triggering Gmail Watch renewal..."

gcloud functions call renew-gmail-watch \
  --region=asia-southeast1 \
  --project=autoland-vj

echo ""
echo "If the function doesn't exist, you can invoke it via HTTP:"
echo "curl -X POST https://asia-southeast1-autoland-vj.cloudfunctions.net/renew-gmail-watch"

# Deployment Review Session - 2026-01-15

## Session Summary

Đã thực hiện rà soát toàn bộ codebase Autoland Monitoring và sửa các lỗi quan trọng để chuẩn bị deploy lên Google Cloud.

---

## Các Vấn Đề Đã Phát Hiện và Sửa

### 🔴 CRITICAL - Đã Sửa

| # | Vấn đề | File | Trạng thái |
|---|--------|------|------------|
| 1 | **Private Key lộ ra ngoài** - `gcp-key.json` không có trong `.gitignore` | `.gitignore` | ✅ Đã sửa |
| 2 | **Dockerfile không build được** - Thiếu `npm run build`, sai cấu trúc | `docker/Dockerfile` | ✅ Đã sửa |

### 🟠 MEDIUM - Đã Sửa

| # | Vấn đề | File | Trạng thái |
|---|--------|------|------------|
| 3 | Sai đường dẫn `seed_data.sql` | `docker-compose.yml` | ✅ Đã sửa |
| 4 | Dùng `gcr.io` thay vì Artifact Registry | `cloudbuild.yaml` | ✅ Đã sửa |
| 5 | Cloud Function thiếu OAuth2 handling | `cloud-functions/gmail-pubsub-processor/index.js` | ✅ Đã sửa |

### 🟢 IMPROVEMENTS - Đã Thực Hiện

| # | Cải tiến | File |
|---|----------|------|
| 6 | Thêm `output: 'standalone'` cho Docker | `next.config.js` |
| 7 | Cập nhật `process-internal` route để nhận PDF trực tiếp | `src/app/api/reports/process-internal/route.ts` |
| 8 | Thêm các APIs cần thiết (Eventarc) | `README.md` |
| 9 | Thêm Grant Permissions cho Build Service Account | `README.md` |
| 10 | Thêm hướng dẫn tạo Secrets cho Cloud Function | `README.md` |

---

## Thay Đổi Lớn Trong README.md

### Cấu Trúc Mới

README đã được tổ chức lại theo flow phù hợp với production deployment sử dụng custom domain:

```
PHẦN A: INFRASTRUCTURE (Bước 1-9)
├── Google Cloud Account & CLI
├── Project & Enable APIs
├── Service Account & Document AI
├── Cloud Storage & Cloud SQL
└── Secret Manager (DB password ONLY)

PHẦN B: DEPLOY APPLICATION (Bước 10-13)
├── Build Docker Image
├── Deploy to Cloud Run
├── ⭐ MAP CUSTOM DOMAIN (VD: autoland.yourdomain.com)
└── Run Database Migrations

PHẦN C: GMAIL INTEGRATION (Bước 14-17)
├── Setup OAuth2 (redirect URI = custom domain đã map)
├── Setup Pub/Sub Topic
├── Setup Gmail Watch
└── Deploy Cloud Functions

PHẦN D: VERIFY & AUTOMATION (Bước 17-18)
├── Verify Deployment
└── Setup Gmail Watch Renewal Automation
```

### Lý Do Thay Đổi

- OAuth2 yêu cầu redirect URI chính xác
- Redirect URI phải là domain đã hoạt động
- Nếu setup OAuth2 trước khi có domain → Phải quay lại update → Dễ gây lỗi

---

## Tiến Độ Deployment (Project: autoland-monitoring-test)

### ✅ Hoàn Thành

- [x] Enable APIs (bao gồm Eventarc)
- [x] Grant permissions cho Build Service Account
- [x] Tạo Pub/Sub Topic `gmail-notifications`
- [x] Tạo Secrets: `google-client-secret`, `gmail-oauth-refresh-token` (placeholder)
- [x] Deploy Cloud Function `gmail-pubsub-processor`

### ⏳ Đang Thực Hiện

- [ ] Deploy Cloud Run (Next.js app)
- [ ] Map custom domain `autoland.blocksync.me`
- [ ] Setup OAuth2 với redirect URI production
- [ ] Chạy `setup-gmail-watch.js` để lấy refresh token
- [ ] Update refresh token vào Secret Manager

### 📋 Chưa Làm

- [ ] Run Database Migrations
- [ ] Verify Deployment
- [ ] Setup Gmail Watch Renewal Automation

---

## Thông Tin Quan Trọng

### OAuth2 Credentials

```
Client ID: 555768155013-2hm72qls36fd0umk5d6ak0fln422it7r.apps.googleusercontent.com
Client Secret: [Stored in Secret Manager]
```

**⚠️ Cần thêm redirect URI vào OAuth Client:**
```
https://autoland.blocksync.me/api/test/gmail/callback
```

### Cloud Function URL

```
https://asia-southeast1-autoland-monitoring-test.cloudfunctions.net/gmail-pubsub-processor
```

### Document AI Processor ID

```
projects/autoland-monitoring-test/locations/us/processors/ac5cded15d980c63
```

---

## Commands Để Tiếp Tục

### 1. Build và Deploy Cloud Run

```bash
export PROJECT_ID="autoland-monitoring-test"
export REGION="asia-southeast1"

# Build Docker image
gcloud builds submit \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/autoland-monitoring/autoland-monitoring:latest \
  --project=$PROJECT_ID

# Deploy Cloud Run
export SA_EMAIL="autoland-monitoring-runner@$PROJECT_ID.iam.gserviceaccount.com"
export CONNECTION_NAME="$PROJECT_ID:asia-southeast1:autoland-db"

gcloud run deploy autoland-monitoring \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/autoland-monitoring/autoland-monitoring:latest \
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
  --set-env-vars "DOCUMENT_AI_PROCESSOR_ID=projects/autoland-monitoring-test/locations/us/processors/ac5cded15d980c63" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://autoland.blocksync.me" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --project=$PROJECT_ID
```

### 2. Map Custom Domain

```bash
gcloud run domain-mappings create \
  --service=autoland-monitoring \
  --domain=autoland.blocksync.me \
  --region=asia-southeast1 \
  --project=$PROJECT_ID
```

### 3. Setup Gmail Watch (Sau khi domain hoạt động)

```bash
cd ~/Autoland-Monitoring
npm install

export GCP_PROJECT_ID="autoland-monitoring-test"
export GOOGLE_CLIENT_ID="555768155013-2hm72qls36fd0umk5d6ak0fln422it7r.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="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"
export GOOGLE_REDIRECT_URI="https://autoland.blocksync.me/api/test/gmail/callback"
export PUBSUB_TOPIC="gmail-notifications"
export MANUAL_FLOW=true

node scripts/setup-gmail-watch.js
```

### 4. Update Refresh Token

```bash
export REFRESH_TOKEN="1//0g..."  # Copy từ output
echo -n "$REFRESH_TOKEN" | gcloud secrets versions add gmail-oauth-refresh-token \
  --data-file=- \
  --project=$PROJECT_ID
```

---

## Files Đã Thay Đổi Trong Session Này

1. `.gitignore` - Thêm `gcp-key.json`, `*-key.json`, `service-account*.json`
2. `docker/Dockerfile` - Viết lại hoàn toàn với standalone output
3. `next.config.js` - Thêm `output: 'standalone'`
4. `docker-compose.yml` - Fix đường dẫn volumes
5. `cloudbuild.yaml` - Chuyển sang Artifact Registry
6. `cloud-functions/gmail-pubsub-processor/index.js` - Thêm OAuth2 handling
7. `src/app/api/reports/process-internal/route.ts` - Nhận PDF trực tiếp
8. `README.md` - Tổ chức lại cấu trúc, thêm hướng dẫn chi tiết

---

## Lưu Ý Quan Trọng

1. **GCP Key đã bị lộ** - Cần tạo key mới và revoke key cũ sau khi hoàn thành setup
2. **OAuth Client Secret đã share** - Nên reset sau khi test xong
3. **Custom Domain** - Cần cấu hình DNS cho `autoland.blocksync.me` trỏ về Google

---

*Last Updated: 2026-01-15*

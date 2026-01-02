# Autoland Monitoring System - Production Deployment Guide

**Vietjet AMO - Hệ thống giám sát Autoland**

Hướng dẫn deploy hệ thống Autoland Monitoring lên Google Cloud Platform (Production).

> **Lưu ý:** 
> - Để setup môi trường development local, xem [DEVELOPMENT.md](./DEVELOPMENT.md)
> - **Production deployment KHÔNG cần file `.env`** - Tất cả config được quản lý qua Secret Manager và Cloud Run environment variables
> - **File `.env` CHỈ cần cho local development** - Xem [DEVELOPMENT.md](./DEVELOPMENT.md) để biết cách tạo

---

## 📋 Mục Lục

1. [Tổng quan](#tổng-quan)
2. [Prerequisites](#prerequisites)
3. [Bước 1: Tạo Google Cloud Account](#bước-1-tạo-google-cloud-account)
4. [Bước 2: Cài đặt Google Cloud CLI](#bước-2-cài-đặt-google-cloud-cli)
5. [Bước 3: Tạo Project](#bước-3-tạo-project)
6. [Bước 4: Enable APIs](#bước-4-enable-apis)
7. [Bước 5: Tạo Service Account](#bước-5-tạo-service-account)
8. [Bước 6: Tạo Document AI Processor](#bước-6-tạo-document-ai-processor)
9. [Bước 7: Tạo Cloud Storage Bucket](#bước-7-tạo-cloud-storage-bucket)
10. [Bước 8: Setup OAuth2 cho Gmail](#bước-8-setup-oauth2-cho-gmail)
11. [Bước 9: Setup Database (Cloud SQL)](#bước-9-setup-database-cloud-sql)
12. [Bước 10: Setup Pub/Sub và Cloud Functions](#bước-10-setup-pubsub-và-cloud-functions)
13. [Bước 11: Cấu hình Secret Manager](#bước-11-cấu-hình-secret-manager)
14. [Bước 12: Build Docker Image](#bước-12-build-docker-image)
15. [Bước 13: Deploy to Cloud Run](#bước-13-deploy-to-cloud-run)
16. [Bước 14: Run Database Migrations](#bước-14-run-database-migrations)
17. [Bước 15: Verify Deployment](#bước-15-verify-deployment)

---

## Tổng quan

**Autoland Monitoring System** là hệ thống giám sát tình trạng thực hiện Autoland của đội tàu bay VietJet Air. Hệ thống:

- Tự động đọc email từ Gmail và extract PDF báo cáo Autoland
- Parse và lưu trữ dữ liệu vào PostgreSQL database
- Hiển thị dashboard với thống kê, alerts, và reports
- Track deadline autoland (mỗi 30 ngày/lần)
- Lưu trữ PDF files trên Cloud Storage
- **Hybrid PDF Parser System** (pdf2json FREE → Document AI PAID fallback) để tiết kiệm chi phí

**Tech Stack:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: PostgreSQL (Cloud SQL)
- Storage: Google Cloud Storage
- Deployment: Google Cloud Run
- APIs: Gmail API, Document AI (fallback), Pub/Sub
- PDF Processing: **pdf2json** (primary, FREE), **Document AI** (fallback, PAID)

---

## Prerequisites

### Yêu cầu hệ thống:
- ✅ Google Cloud account với billing enabled
- ✅ Gmail account để nhận báo cáo Autoland
- ✅ Google Cloud CLI (gcloud) đã được cài đặt và authenticated
- ✅ Docker (để build Docker image, optional - có thể dùng Cloud Build thay thế)

### Yêu cầu kiến thức:
- Cơ bản về command line (Bash/Linux)
- Hiểu cơ bản về Google Cloud Platform
- Cơ bản về PostgreSQL

---

## Bước 1: Tạo Google Cloud Account

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập với Google account
3. Click **Get started for free** hoặc **Try free trial**
4. Điền thông tin billing (cần credit card, nhưng có $300 free credit)
5. Chấp nhận terms và conditions
6. Click **Start my free trial**

**Lưu ý:** Free trial có $300 credit trong 90 ngày. Sau khi hết trial, bạn sẽ được charge theo usage.

---

## Bước 2: Cài đặt Google Cloud CLI

### Linux/Mac:

```bash
# Download và cài đặt
curl https://sdk.cloud.google.com | bash

# Restart shell
exec -l $SHELL

# Initialize
gcloud init

# Authenticate
gcloud auth login
```

### Verify installation:

```bash
gcloud --version
```

Bạn sẽ thấy output tương tự:
```
Google Cloud SDK 450.0.0
```

---

## Bước 3: Tạo Project

### Cách 1: Sử dụng gcloud CLI

```bash
# Set biến PROJECT_ID
export PROJECT_ID="autoland-monitoring"

# Tạo project mới
gcloud projects create $PROJECT_ID --name="Autoland Monitoring"

# Set project vừa tạo
gcloud config set project $PROJECT_ID

# Verify project
gcloud config get-value project
```

### Cách 2: Sử dụng Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Click vào dropdown project ở góc trên cùng
3. Click **NEW PROJECT**
4. **Project name:** `Autoland Monitoring`
5. **Project ID:** `autoland-monitoring` (hoặc tự chọn)
6. Click **CREATE**
7. Chọn project vừa tạo

### Enable Billing

**⚠️ BẮT BUỘC:** Billing account phải được link trước khi tạo các tài nguyên có phí như Cloud SQL, Cloud Run, Document AI, v.v.

1. Vào [Billing](https://console.cloud.google.com/billing)
2. Click **LINK A BILLING ACCOUNT**
3. Chọn billing account hoặc tạo mới
4. Link với project `autoland-monitoring`

**Lưu ý:** 
- Free trial có $300 credit trong 90 ngày
- Cloud SQL là dịch vụ có phí, cần billing account để tạo instance
- Nếu chưa link billing, lệnh `gcloud sql instances create` sẽ báo lỗi

---

## Bước 4: Enable APIs

### Enable APIs qua gcloud CLI:

```bash
export PROJECT_ID="autoland-monitoring"

# Enable Cloud Run API
gcloud services enable run.googleapis.com --project=$PROJECT_ID

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID

# Enable Cloud SQL APIs
gcloud services enable sql-component.googleapis.com --project=$PROJECT_ID
gcloud services enable sqladmin.googleapis.com --project=$PROJECT_ID

# Enable Cloud Storage API
gcloud services enable storage.googleapis.com --project=$PROJECT_ID

# Enable Document AI API
gcloud services enable documentai.googleapis.com --project=$PROJECT_ID

# Enable Pub/Sub API (nếu dùng Pub/Sub)
gcloud services enable pubsub.googleapis.com --project=$PROJECT_ID

# Enable Cloud Functions API (nếu dùng Pub/Sub)
gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Enable Cloud Scheduler API (để tự động renew Gmail Watch)
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID
```

### Enable Gmail API qua Google Cloud Console

Gmail API thường không thể enable qua CLI do permission issues. **Phải enable qua Console:**

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project `autoland-monitoring`
3. Vào **APIs & Services** > **Library**
4. Tìm "Gmail API":
   - Gõ "Gmail API" vào search box
   - Click vào "Gmail API" trong kết quả
   - Click **ENABLE**
5. Đợi vài giây để API được enable

### Verify APIs đã được enable:

```bash
gcloud services list --enabled --project=$PROJECT_ID | grep -E "(gmail|storage|documentai|run|cloudbuild|sql|pubsub|functions|secretmanager|scheduler)"
```

Hoặc kiểm tra trong Console:
- Vào **APIs & Services** > **Enabled APIs**
- Kiểm tra có các APIs sau:
  - ✅ Gmail API
  - ✅ Cloud Storage API
  - ✅ Document AI API
  - ✅ Cloud Run API
  - ✅ Cloud Build API
  - ✅ Cloud SQL Admin API (sqladmin.googleapis.com)
  - ✅ Cloud SQL Component API (sql-component.googleapis.com)
  - ✅ Pub/Sub API (nếu dùng)
  - ✅ Cloud Functions API (nếu dùng)
  - ✅ Secret Manager API
  - ✅ Cloud Scheduler API (để tự động renew Gmail Watch)

---

## Bước 5: Tạo Service Account

### Tạo Service Account:

```bash
export PROJECT_ID="autoland-monitoring"

# Tạo Service Account
gcloud iam service-accounts create autoland-service \
    --display-name="Autoland Monitoring Service Account" \
    --project=$PROJECT_ID
```

### Grant permissions:

```bash
# Storage Admin (để upload/download PDF)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:autoland-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Document AI API User (để extract text từ PDF)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:autoland-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/documentai.apiUser"

# Cloud SQL Client (để kết nối database)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:autoland-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Secret Manager Secret Accessor (để đọc secrets)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:autoland-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

#roles/cloudbuild.builds.builder
gcloud projects add-iam-policy-binding autoland-monitoring \
 --member=serviceAccount:748321344074-compute@developer.gserviceaccount.com \
 --role=roles/cloudbuild.builds.builder 
```

### Download Service Account Key (Cho các services khác):

```bash
# Download key file
gcloud iam service-accounts keys create ./gcp-key.json \
    --iam-account=autoland-service@$PROJECT_ID.iam.gserviceaccount.com \
    --project=$PROJECT_ID
```

**Lưu ý:**
- File `gcp-key.json` sẽ được tạo trong thư mục hiện tại
- Đảm bảo file này nằm trong thư mục root của project
- **KHÔNG commit file này lên Git!** (đã có trong `.gitignore`)

---

## Bước 6: Tạo Document AI Processor

Document AI processors không thể tạo qua gcloud CLI. **Phải tạo qua Google Cloud Console:**

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project `autoland-monitoring`
3. Vào **Document AI** (tìm trong menu hoặc search "Document AI")
4. Nếu lần đầu, click **GET STARTED** hoặc **CREATE PROCESSOR**
5. **Processor Type:** Chọn **OCR Processor**
6. **Location:** Chọn `asia-southeast1` (Singapore)
7. **Display Name:** `Autoland PDF Processor`
8. Click **CREATE**

### Lấy Processor ID:

1. Trong Document AI Console, vào **Processors**
2. Click vào processor vừa tạo (`Autoland PDF Processor`)
3. Trong trang **Details**, tìm **Processor ID** hoặc **Resource Name**
4. Format sẽ là:
   ```
   projects/autoland-monitoring/locations/asia-southeast1/processors/abc123def456
   ```
5. **Copy toàn bộ Processor ID này** để dùng trong Cloud Run deployment (Bước 13)

**Lưu ý:** Processor ID cần để cấu hình trong Cloud Run environment variables

---

## Bước 7: Tạo Cloud Storage Bucket

```bash
export PROJECT_ID="autoland-monitoring"
export BUCKET_NAME="autoland-reports"

# Tạo bucket để lưu PDF files
gsutil mb -p $PROJECT_ID -c STANDARD -l asia-southeast1 gs://$BUCKET_NAME

# Verify bucket đã được tạo
gsutil ls gs://$BUCKET_NAME
```

**Lưu ý:** Ghi nhớ `BUCKET_NAME` để dùng trong Cloud Run deployment (Bước 13)

---

## Bước 8: Setup OAuth2 cho Gmail

**⚠️ QUAN TRỌNG:** Gmail API không sử dụng IAM roles. Để đọc Gmail personal account, bạn **PHẢI** dùng OAuth2.

### Bước 8.1: Tạo OAuth Consent Screen

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project `autoland-monitoring`
3. Vào **APIs & Services** > **OAuth consent screen**
4. **User Type:** Chọn **External** (cho personal Gmail)
5. Click **CREATE**
6. **App information:**
   - **App name:** `Autoland Monitoring`
   - **User support email:** `moc@vietjetair.com` (hoặc email của bạn)
   - **Developer contact:** `moc@vietjetair.com` (hoặc email của bạn)
7. Click **SAVE AND CONTINUE**
8. **Scopes:** Click **ADD OR REMOVE SCOPES**
   - Tìm và chọn: `https://www.googleapis.com/auth/gmail.readonly`
   - Click **UPDATE** > **SAVE AND CONTINUE**
9. **Test users:** Click **ADD USERS**
   - Thêm email Gmail của bạn (ví dụ: `your-email@gmail.com`)
   - Click **ADD** > **SAVE AND CONTINUE**
10. **Summary:** Review và click **BACK TO DASHBOARD**

### Bước 8.2: Tạo OAuth Client ID

1. Vào **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. **Application type:** Chọn **Web application**
4. **Name:** `Autoland Monitoring Web Client`
5. **Authorized redirect URIs:** ⚠️ **QUAN TRỌNG - Phải chính xác 100%**
   
   **Thêm redirect URI cho production:**
   ```
   https://autoland.amoict.com/api/test/gmail/callback
   ```
   
   **Lưu ý:**
   - ✅ Copy-paste để tránh lỗi đánh máy
   - ✅ Phải dùng `https://` với domain production
   - ✅ Không có dấu `/` ở cuối
   - ✅ Không có khoảng trắng thừa
   - ✅ Domain phải khớp chính xác với domain đã map trong Cloud Run
   - ⚠️ **Nếu cần test local, thêm localhost URIs sau khi deploy production xong** (xem [DEVELOPMENT.md](./DEVELOPMENT.md))

6. Click **CREATE**
7. **Lưu lại:**
   - **Client ID** (ví dụ: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (ví dụ: `GOCSPX-xxxxx`)
   
   **⚠️ Lưu ý:** Copy chính xác, không có khoảng trắng thừa!

---

## Bước 9: Setup Database (Cloud SQL)

**⚠️ QUAN TRỌNG:** Đảm bảo đã link billing account ở Bước 3 trước khi tạo Cloud SQL instance. Cloud SQL là dịch vụ có phí và yêu cầu billing account.

### Tạo Cloud SQL Instance:

```bash
export PROJECT_ID="autoland-monitoring"
export DB_PASSWORD="YOUR_SECURE_PASSWORD"  # Thay bằng password mạnh

# Tạo PostgreSQL instance
gcloud sql instances create autoland-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-auto-increase \
  --storage-size=10GB \
  --project=$PROJECT_ID

# Đợi instance được tạo (có thể mất 5-10 phút)
# Kiểm tra status:
gcloud sql instances describe autoland-db --project=$PROJECT_ID
```

### Tạo Database:

```bash
# Tạo database
gcloud sql databases create autoland \
  --instance=autoland-db \
  --project=$PROJECT_ID
```

### Tạo User:

```bash
# Tạo user
gcloud sql users create autoland \
  --instance=autoland-db \
  --password=$DB_PASSWORD \
  --project=$PROJECT_ID
```

### Lấy Connection Name:

```bash
# Lấy connection name để dùng trong Cloud Run
gcloud sql instances describe autoland-db \
  --project=$PROJECT_ID \
  --format='value(connectionName)'
```

Output sẽ là: `PROJECT_ID:asia-southeast1:autoland-db`

**Lưu ý:** Ghi nhớ connection name này để dùng trong deployment

---

## Bước 10: Setup Pub/Sub và Cloud Functions

Nếu muốn tự động xử lý email qua Pub/Sub, thực hiện các bước sau:

### Tạo Pub/Sub Topic:

```bash
export PROJECT_ID="autoland-monitoring"
export TOPIC_NAME="gmail-notifications"

# Tạo Pub/Sub topic
gcloud pubsub topics create $TOPIC_NAME --project=$PROJECT_ID
```

### Grant Gmail Service Account Permission:

```bash
# Gmail service account email (của Google, không phải email của bạn)
export GMAIL_SA="gmail-api-push@system.gserviceaccount.com"

# Grant permission để Gmail có thể publish messages vào topic
gcloud pubsub topics add-iam-policy-binding $TOPIC_NAME \
    --member="serviceAccount:$GMAIL_SA" \
    --role="roles/pubsub.publisher" \
    --project=$PROJECT_ID
```

**Lưu ý:** `gmail-api-push@system.gserviceaccount.com` là service account của Google, không cần thay đổi.

### Deploy Cloud Function:

**Lưu ý:** Đảm bảo đã tạo secrets trong Bước 11 (Secret Manager) trước khi deploy.

```bash
cd cloud-functions/gmail-pubsub-processor

# Install dependencies
npm install

# Deploy Cloud Function
# Đảm bảo export các biến cần thiết trước
export PROJECT_ID="autoland-monitoring"
export TOPIC_NAME="gmail-notifications"
export FUNCTION_NAME="gmail-pubsub-processor"
export REGION="asia-southeast1"
export SA_EMAIL="autoland-service@$PROJECT_ID.iam.gserviceaccount.com"
export CONNECTION_NAME="$PROJECT_ID:asia-southeast1:autoland-db"

# Deploy với custom service account và Secret Manager
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=processGmailNotification \
  --trigger-topic=$TOPIC_NAME \
  --service-account=$SA_EMAIL \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
  --set-env-vars="GCP_STORAGE_BUCKET=autoland-reports" \
  --set-env-vars="DOCUMENT_AI_PROCESSOR_ID=projects/$PROJECT_ID/locations/asia-southeast1/processors/YOUR_PROCESSOR_ID" \
  --set-env-vars="DB_HOST=/cloudsql/$CONNECTION_NAME" \
  --set-env-vars="DB_PORT=5432" \
  --set-env-vars="DB_NAME=autoland" \
  --set-env-vars="DB_USER=autoland" \
  --set-secrets="DB_PASSWORD=autoland-db-password:latest" \
  --set-secrets="GCP_KEY_FILE=gcp-service-account-key:latest" \
  --memory=2GB \
  --timeout=540s \
  --max-instances=1 \
  --min-instances=0 \
  --allow-unauthenticated \
  --project=$PROJECT_ID
```

**Lưu ý:** 
- Thay `YOUR_PROCESSOR_ID` bằng Processor ID từ Bước 6
- Tất cả secrets đã được tạo trong Bước 11 (Secret Manager)
- Cloud Function sẽ sử dụng secrets từ Secret Manager thay vì hardcode trong environment variables

### Setup Gmail Watch:

**Bước 1: Cài đặt dependencies:**

```bash
npm install googleapis
```

**Bước 2: Chạy script setup Gmail Watch:**

**Cho Cloud Shell hoặc remote servers (Manual Flow - Khuyến nghị):**

```bash
# Export các biến môi trường
export GCP_PROJECT_ID="autoland-monitoring"
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"  # Từ OAuth2 credentials
export GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"  # Từ OAuth2 credentials
export PUBSUB_TOPIC="gmail-notifications"
export MANUAL_FLOW=true  # Bật manual flow cho Cloud Shell

# Chạy script
node scripts/setup-gmail-watch.js
```

**Quy trình Manual Flow:**
1. Script sẽ hiển thị URL authorization
2. Copy URL và mở trong browser
3. Đăng nhập và cấp quyền cho ứng dụng
4. Sau khi authorize, browser sẽ redirect về production URL hoặc hiển thị authorization code
5. Copy toàn bộ redirect URL (hoặc chỉ phần `code=...`) từ browser address bar
6. Paste vào terminal khi script hỏi
7. Script sẽ tự động extract code và setup Gmail Watch

**Lưu ý:** 
- Gmail Watch expires sau 7 ngày, cần renew định kỳ
- Refresh token sẽ được lưu để có thể refresh access token khi cần
- Xem phần "Setup Cloud Scheduler để tự động renew Watch" bên dưới

### Setup Cloud Scheduler để tự động renew Watch:

Để tự động renew Gmail Watch hàng tuần (trước khi hết hạn 7 ngày):

```bash
export PROJECT_ID="autoland-monitoring"
export REGION="asia-southeast1"
export FUNCTION_NAME="gmail-pubsub-processor"  # Hoặc tạo Cloud Function riêng
export SCHEDULER_NAME="renew-gmail-watch"
export SA_EMAIL="autoland-service@$PROJECT_ID.iam.gserviceaccount.com"

# Tạo Cloud Scheduler job (chạy mỗi 6 ngày một lần)
gcloud scheduler jobs create http $SCHEDULER_NAME \
  --location=$REGION \
  --schedule="0 0 * * 0" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME/renew-watch" \
  --http-method=POST \
  --oidc-service-account-email=$SA_EMAIL \
  --project=$PROJECT_ID
```

**Hoặc chạy script thủ công mỗi tuần:**

```bash
# Set environment variables và chạy lại script
export MANUAL_FLOW=true
node scripts/setup-gmail-watch.js
```

---

## Bước 11: Cấu hình Secret Manager

Tất cả các secrets và sensitive data sẽ được lưu trong Secret Manager để đảm bảo bảo mật.

### Tạo các secrets:

**⚠️ QUAN TRỌNG:** Password trong secret `autoland-db-password` PHẢI khớp chính xác với password đã tạo cho Cloud SQL user ở Bước 9.

```bash
export PROJECT_ID="autoland-monitoring"
# ⚠️ Sử dụng CÙNG password đã dùng khi tạo Cloud SQL user ở Bước 9
# Ví dụ: Nếu ở Bước 9 bạn dùng password "Abcxyz", thì ở đây cũng phải dùng "Abcxyz"
export DB_PASSWORD="Abcxyz"  # Thay bằng password đã tạo cho Cloud SQL user
export GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"  # Từ OAuth2 credentials

# 1. Database password
echo -n "$DB_PASSWORD" | gcloud secrets create autoland-db-password \
  --data-file=- \
  --project=$PROJECT_ID

# 2. Service Account key (từ file gcp-key.json)
gcloud secrets create gcp-service-account-key \
  --data-file=./gcp-key.json \
  --project=$PROJECT_ID

# 3. OAuth2 Client Secret
echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- \
  --project=$PROJECT_ID
```

### Grant quyền truy cập secrets cho service account:

```bash
export SA_EMAIL="autoland-monitoring-runner@$PROJECT_ID.iam.gserviceaccount.com"

# Grant quyền cho tất cả secrets
gcloud secrets add-iam-policy-binding autoland-db-password \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding gcp-service-account-key \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding google-client-secret \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

**Lưu ý:** 
- Tất cả secrets sẽ được sử dụng trong Cloud Run deployment
- Không lưu secrets trong environment variables trực tiếp
- Secrets được inject vào container thông qua `--set-secrets` flag

---

## Bước 12: Build Docker Image

### Tạo Artifact Registry repository:

```bash
export PROJECT_ID="autoland-monitoring"
export REGION="asia-southeast1"
export REPO_NAME="autoland-monitoring"

# Tạo repository
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for Autoland Monitoring" \
  --project=$PROJECT_ID
```

### Configure Docker authentication:

```bash
gcloud auth configure-docker $REGION-docker.pkg.dev --project=$PROJECT_ID
```

### Build và push Docker image:

```bash
export IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/autoland-monitoring"
export IMAGE_TAG="latest"

# Build image
docker build -t $IMAGE_NAME:$IMAGE_TAG -f docker/Dockerfile .

# Push image
docker push $IMAGE_NAME:$IMAGE_TAG
```

Hoặc sử dụng Cloud Build:

```bash
# Build với Cloud Build
gcloud builds submit \
  --tag $IMAGE_NAME:$IMAGE_TAG \
  --project=$PROJECT_ID
```

---

## Bước 13: Deploy to Cloud Run

### Tạo Service Account cho Cloud Run:

```bash
export PROJECT_ID="autoland-monitoring"

# Tạo service account
gcloud iam service-accounts create autoland-monitoring-runner \
  --display-name="Autoland Monitoring Cloud Run Service Account" \
  --project=$PROJECT_ID

export SA_EMAIL="autoland-monitoring-runner@$PROJECT_ID.iam.gserviceaccount.com"

# Grant Cloud Run Invoker role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.invoker"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.client"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"

# Grant Document AI API User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/documentai.apiUser"
```

### Deploy to Cloud Run:

```bash
export PROJECT_ID="autoland-monitoring"
export REGION="asia-southeast1"
export IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/autoland-monitoring/autoland-monitoring:latest"
export SA_EMAIL="autoland-monitoring-runner@$PROJECT_ID.iam.gserviceaccount.com"
export CONNECTION_NAME="$PROJECT_ID:asia-southeast1:autoland-db"

# Deploy
gcloud run deploy autoland-monitoring \
  --image $IMAGE_NAME \
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
  --set-env-vars "DOCUMENT_AI_PROCESSOR_ID=projects/$PROJECT_ID/locations/asia-southeast1/processors/YOUR_PROCESSOR_ID" \
  --set-env-vars "GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" \
  --set-secrets "GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-secrets "GCP_KEY_FILE=gcp-service-account-key:latest" \
  --set-env-vars "GOOGLE_REDIRECT_URI=https://autoland.amoict.com/api/test/gmail/callback" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://autoland.amoict.com" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 1 \
  --max-instances 10 \
  --project=$PROJECT_ID
```

**Lưu ý:**
- Thay `YOUR_PROCESSOR_ID` bằng Processor ID từ Bước 6
- Thay `your-client-id` bằng OAuth2 Client ID từ Bước 8
- Tất cả secrets đã được tạo trong Bước 11 (Secret Manager)
- Production domain: `https://autoland.amoict.com`
- Tất cả sensitive data được lưu trong Secret Manager, không hardcode trong environment variables

### Map Custom Domain (autoland.amoict.com):

Sau khi deploy, cần map custom domain `autoland.amoict.com` với Cloud Run service:

```bash
export PROJECT_ID="autoland-monitoring"
export REGION="asia-southeast1"
export DOMAIN="autoland.amoict.com"

# Map domain với Cloud Run service
gcloud run domain-mappings create \
  --service=autoland-monitoring \
  --domain=$DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID
```

**Lưu ý:** Sau khi map domain, bạn cần:
1. Cập nhật DNS records cho `autoland.amoict.com` theo hướng dẫn từ Google Cloud Console
2. Đợi DNS propagation (có thể mất vài phút đến vài giờ)
3. Verify domain mapping trong Cloud Run Console

---

## Bước 14: Run Database Migrations

### Connect to Cloud SQL:

```bash
export PROJECT_ID="autoland-monitoring"

# Connect to Cloud SQL
gcloud sql connect autoland-db --user=autoland --project=$PROJECT_ID
```

### Run migrations trong psql:

```sql
-- Run migration 1
\i database/migrations/001_create_autoland_tables.sql

-- Run migration 2
\i database/migrations/002_create_dashboard_tables.sql

-- Run migration 3
\i database/migrations/003_fix_calculate_autoland_to_go.sql

-- Run migration 4
\i database/migrations/004_change_visibility_rvr_to_varchar.sql

-- Run migration 5 (NEW - Hybrid PDF Parser metrics)
\i database/migrations/005_add_extraction_metrics.sql

-- Verify tables
\dt

-- Verify new columns from migration 5
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'autoland_reports'
  AND column_name IN ('extraction_method', 'extraction_cost', 'extraction_cost_saved');

-- Exit
\q
```

Hoặc sử dụng Cloud SQL Proxy:

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy
./cloud-sql-proxy $PROJECT_ID:asia-southeast1:autoland-db

# Trong terminal khác, run migrations
export PGPASSWORD=YOUR_PASSWORD
psql -h 127.0.0.1 -U autoland -d autoland -f database/migrations/001_create_autoland_tables.sql
psql -h 127.0.0.1 -U autoland -d autoland -f database/migrations/002_create_dashboard_tables.sql
psql -h 127.0.0.1 -U autoland -d autoland -f database/migrations/003_fix_calculate_autoland_to_go.sql
psql -h 127.0.0.1 -U autoland -d autoland -f database/migrations/004_change_visibility_rvr_to_varchar.sql
psql -h 127.0.0.1 -U autoland -d autoland -f database/migrations/005_add_extraction_metrics.sql
```

---

## Bước 15: Verify Deployment

### Check service status:

```bash
gcloud run services describe autoland-monitoring \
  --region $REGION \
  --project=$PROJECT_ID
```

### Test service:

```bash
# Test health endpoint (nếu có)
curl https://autoland.amoict.com/api/health

# Test dashboard
curl https://autoland.amoict.com/dashboard
```

### View logs:

```bash
# Stream logs
gcloud run logs read autoland-monitoring \
  --region $REGION \
  --follow \
  --project=$PROJECT_ID

# View last 100 lines
gcloud run logs read autoland-monitoring \
  --region $REGION \
  --limit 100 \
  --project=$PROJECT_ID
```

### Update OAuth2 Redirect URI:

Đảm bảo OAuth2 redirect URI đã được cấu hình với custom domain:

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project `autoland-monitoring`
3. Vào **APIs & Services** > **Credentials**
4. Click vào OAuth Client ID đã tạo
5. Kiểm tra **Authorized redirect URIs** có:
   ```
   https://autoland.amoict.com/api/test/gmail/callback
   ```
   Nếu chưa có, thêm vào và click **SAVE**

### Verify Domain Mapping:

```bash
# Kiểm tra domain mapping status
gcloud run domain-mappings describe autoland.amoict.com \
  --region $REGION \
  --project=$PROJECT_ID
```

**Lưu ý:** Nếu domain chưa được map, thực hiện Bước 14 (Map Custom Domain) trước.

---

## 🎉 Hoàn thành!

Hệ thống Autoland Monitoring đã được deploy thành công lên Google Cloud Run!

### Next Steps:

1. ✅ Test OAuth2 flow để authorize Gmail access
2. ✅ Test PDF processing với email thật
3. ✅ Verify data được lưu vào database
4. ✅ Setup monitoring và alerts
5. ✅ Verify custom domain `autoland.amoict.com` hoạt động đúng
6. ✅ **Monitor cost savings từ Hybrid PDF Parser system**

---

## 📊 Hybrid PDF Parser System

### Tổng quan

Hệ thống sử dụng **Hybrid PDF Parser** với chiến lược tối ưu chi phí:

1. **Primary (FREE):** pdf2json - Thư viện open-source, không tốn chi phí
2. **Fallback (PAID):** Document AI - Chỉ dùng khi pdf2json thất bại (~15% cases)

### Luồng xử lý:

```
PDF File → pdf2json (FREE) → Regex Parser → SUCCESS ✅
              ↓ FAIL
         Document AI (PAID) → Regex Parser → SUCCESS ✅
```

### Chi phí & Tiết kiệm:

| Scenario | PDFs/Tháng | Cost (Document AI) | Cost (Hybrid) | Tiết kiệm |
|----------|------------|--------------------|---------------|-----------|
| Low | 100 | $1.50 | $0.15-0.30 | **80-90%** |
| Medium | 500 | $7.50 | $0.75-1.50 | **80-90%** |
| High | 1000 | $15.00 | $1.50-3.00 | **80-90%** |

*Assuming 85-95% success rate với pdf2json*

### Tracking Cost Savings:

**API Endpoint để xem metrics:**
```bash
curl https://autoland.amoict.com/api/dashboard/cost-savings
```

**Response:**
```json
{
  "overview": {
    "totalProcessed": 100,
    "freeSuccessCount": 90,
    "paidFallbackCount": 10,
    "freeSuccessRate": "90.0%",
    "costWithoutHybrid": "$1.5000",
    "actualCost": "$0.1500",
    "savedCost": "$1.3500",
    "savingsPercentage": "90.0%"
  }
}
```

### Test Hybrid Parser:

```bash
# Test hybrid parser trên production
curl https://autoland.amoict.com/api/test/pdf/hybrid-test
```

### Database Schema (Migration 005):

```sql
-- New columns để tracking extraction metrics
ALTER TABLE autoland_reports
ADD COLUMN extraction_method VARCHAR(20) DEFAULT 'document-ai',
ADD COLUMN extraction_cost DECIMAL(10, 4) DEFAULT 0.0000 NOT NULL,
ADD COLUMN extraction_cost_saved DECIMAL(10, 4) DEFAULT 0.0000 NOT NULL;
```

**Giá trị `extraction_method`:**
- `pdf2json` - FREE method (primary)
- `document-ai` - PAID method (fallback)

**Query để xem statistics:**
```sql
-- Extraction method breakdown
SELECT
  extraction_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage,
  COALESCE(SUM(extraction_cost), 0) as total_cost
FROM autoland_reports
WHERE extraction_method IS NOT NULL
GROUP BY extraction_method;

-- Cost savings summary
SELECT
  COUNT(*) as total_processed,
  COUNT(*) FILTER (WHERE extraction_method = 'pdf2json') as free_count,
  COUNT(*) FILTER (WHERE extraction_method = 'document-ai') as paid_count,
  COALESCE(SUM(extraction_cost), 0) as actual_cost,
  COALESCE(SUM(extraction_cost_saved), 0) as saved_cost
FROM autoland_reports;
```

### Useful Commands:

```bash
# View service details
gcloud run services describe autoland-monitoring --region $REGION --project=$PROJECT_ID

# Update service
gcloud run services update autoland-monitoring --region $REGION --project=$PROJECT_ID

# View logs
gcloud run logs read autoland-monitoring --region $REGION --follow --project=$PROJECT_ID

# Delete service (nếu cần)
gcloud run services delete autoland-monitoring --region $REGION --project=$PROJECT_ID

# --- NEW: Cost Savings Tracking ---

# View cost savings metrics
curl https://autoland.amoict.com/api/dashboard/cost-savings | jq '.data.overview'

# Test hybrid parser
curl https://autoland.amoict.com/api/test/pdf/hybrid-test | jq '.statistics'

# View extraction statistics from database
gcloud sql connect autoland-db --user=autoland --project=$PROJECT_ID --quiet --command="
SELECT
  extraction_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage,
  COALESCE(SUM(extraction_cost), 0) as total_cost
FROM autoland_reports
WHERE extraction_method IS NOT NULL
GROUP BY extraction_method;
"

# View overall cost savings from database
gcloud sql connect autoland-db --user=autoland --project=$PROJECT_ID --quiet --command="
SELECT
  COUNT(*) as total_processed,
  COUNT(*) FILTER (WHERE extraction_method = 'pdf2json') as free_count,
  COUNT(*) FILTER (WHERE extraction_method = 'document-ai') as paid_count,
  ROUND(COUNT(*) FILTER (WHERE extraction_method = 'pdf2json') * 100.0 / COUNT(*), 2) as free_success_rate,
  COALESCE(SUM(extraction_cost), 0) as actual_cost,
  COALESCE(SUM(extraction_cost_saved), 0) as saved_cost
FROM autoland_reports;
"
```

---

---

## 📚 Tài liệu liên quan

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Hướng dẫn setup môi trường development local
- [Hybrid PDF Parser System](#-hybrid-pdf-parser-system) - Chi tiết về hệ thống tối ưu chi phí

---

**Maintained by:** Vietjet AMO ICT Department  
**Contact:** moc@vietjetair.com  
**Last Updated:** 2025-01-02

**Changelog:**
- **2025-01-02:** Tách phần development sang DEVELOPMENT.md, tập trung vào production deployment với Secret Manager và OAuth2
- **2025-12-30:** Added Hybrid PDF Parser System (pdf2json + Document AI fallback) - Cost optimization feature
- **2025-12-28:** Initial deployment guide

# Kế hoạch Chi tiết - Dashboard Autoland Monitoring (Next.js + Tailwind CSS)

**Last Updated:** 2025-12-27  
**Version:** v2.0 (Next.js + Tailwind CSS)  
**Author:** Vietjet AMO IT Department

---

## 📋 Tổng quan

### Mục tiêu dự án
Xây dựng dashboard giám sát tình trạng thực hiện Autoland CAT 3 của đội tàu bay VietJet, bao gồm:
- Monitor deadline autoland (mỗi 30 ngày/lần)
- Theo dõi success/failure rate
- Lưu trữ và track PDF báo cáo autoland
- Alert khi aircraft sắp đến hạn hoặc quá hạn

### Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Charts**: Chart.js + react-chartjs-2
- **Forms**: React Hook Form + Zod
- **Database**: PostgreSQL (Cloud SQL)
- **Backend**: Next.js API Routes
- **Deployment**: Google Cloud Run
- **Storage**: Cloud Storage (PDFs)

### UI Style
- **Màu chủ đạo**: Trắng + Đỏ VietJet (#E31837)
- **Theme**: Clean, modern, professional
- **Components**: shadcn/ui (Radix UI based)

---

## 🏗️ Kiến trúc Tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                    Gmail API (Email Processing)                 │
│  - Nhận email từ e-techlog                                     │
│  - Tải PDF attachments                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    [Cloud Functions - Backend Processing]
                    - Gmail API integration
                    - PDF parsing (Document AI)
                    - Data storage
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
        ▼                                        ▼
┌───────────────┐                     ┌────────────────┐
│ Cloud SQL     │                     │ Cloud Storage │
│ PostgreSQL    │◄────────────────────┤ (PDF Files)    │
└───────┬───────┘                     └────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS DASHBOARD UI                        │
│  - App Router (SSR)                                     │
│  - API Routes (Backend)                                 │
│  - Tailwind CSS (Styling)                               │
│  - shadcn/ui (Components)                               │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
  ┌───────────┐                  ┌──────────────┐
  │ Localhost  │                  │ Google Cloud │
  │ (Dev)      │                  │ (Production) │
  │ Port:3000  │                  │ Cloud Run    │
  └───────────┘                  └──────────────┘
```

---

## 📊 Database Schema

### Bảng autoland_reports

```sql
CREATE TABLE autoland_reports (
    id SERIAL PRIMARY KEY,
    
    -- Report Identification
    report_number VARCHAR(100) UNIQUE NOT NULL,
    aircraft_reg VARCHAR(20) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    
    -- General Information
    airport VARCHAR(10) NOT NULL,
    runway VARCHAR(10) NOT NULL,
    captain VARCHAR(100),
    first_officer VARCHAR(100),
    date_utc DATE NOT NULL,
    time_utc TIME NOT NULL,
    datetime_utc TIMESTAMP NOT NULL,
    
    -- Data Section
    wind_velocity VARCHAR(20),
    td_point VARCHAR(10),
    tracking VARCHAR(10),
    qnh INTEGER,
    alignment VARCHAR(10),
    speed_control VARCHAR(10),
    temperature INTEGER,
    landing VARCHAR(10),
    aircraft_dropout VARCHAR(10),
    visibility_rvr INTEGER,
    other TEXT,
    
    -- Result
    result VARCHAR(20) NOT NULL, -- 'SUCCESSFUL' or 'UNSUCCESSFUL'
    reasons TEXT,
    captain_signature VARCHAR(100),
    
    -- File Storage
    email_id VARCHAR(100),
    email_subject TEXT,
    email_sender VARCHAR(255),
    email_received_time TIMESTAMP,
    pdf_filename VARCHAR(255) NOT NULL,
    pdf_storage_path VARCHAR(500) NOT NULL,
    pdf_storage_bucket VARCHAR(100) NOT NULL,
    
    -- Processing Metadata
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extraction_status VARCHAR(20) DEFAULT 'SUCCESS',
    extraction_errors TEXT,
    raw_extracted_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_aircraft_reg (aircraft_reg),
    INDEX idx_flight_number (flight_number),
    INDEX idx_date_utc (date_utc),
    INDEX idx_datetime_utc (datetime_utc),
    INDEX idx_result (result),
    INDEX idx_aircraft_date (aircraft_reg, date_utc)
);
```

### Bảng autoland_to_go

```sql
CREATE TABLE autoland_to_go (
    id SERIAL PRIMARY KEY,
    aircraft_reg VARCHAR(20) NOT NULL UNIQUE,
    last_autoland_date DATE NOT NULL,
    last_autoland_report_id INTEGER REFERENCES autoland_reports(id),
    next_required_date DATE NOT NULL,
    days_remaining INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'ON_TIME', 'DUE_SOON', 'OVERDUE'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_next_required_date (next_required_date),
    INDEX idx_status (status)
);
```

### Bảng dashboard_settings

```sql
CREATE TABLE dashboard_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO dashboard_settings (setting_key, setting_value) VALUES
('due_soon_threshold', '7'),
('alert_recipients', '[]'),
('auto_refresh_interval', '60');
```

### Bảng audit_log

```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    user_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 Cấu trúc Project

```
autoland-monitoring/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                # Auth group (optional)
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── dashboard/             # Dashboard routes
│   │   │   ├── page.tsx          # Dashboard overview
│   │   │   └── layout.tsx        # Dashboard layout
│   │   ├── aircraft/              # Aircraft pages
│   │   │   ├── page.tsx          # Aircraft list
│   │   │   └── [reg]/            # Aircraft detail
│   │   │       └── page.tsx
│   │   ├── reports/               # Reports pages
│   │   │   ├── page.tsx          # Reports list
│   │   │   └── [id]/            # Report detail
│   │   │       └── page.tsx
│   │   ├── fleet/                # Fleet monitoring
│   │   │   └── page.tsx
│   │   ├── api/                   # API Routes
│   │   │   ├── dashboard/
│   │   │   │   └── stats/route.ts
│   │   │   ├── aircraft/
│   │   │   │   ├── route.ts      # List aircraft
│   │   │   │   └── [reg]/route.ts # Aircraft detail
│   │   │   ├── reports/
│   │   │   │   ├── route.ts      # List reports
│   │   │   │   └── [id]/route.ts # Report detail
│   │   │   └── fleet/
│   │   │       └── route.ts
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles (Tailwind)
│   │
│   ├── components/                # React components
│   │   ├── ui/                    # UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── dashboard/            # Dashboard components
│   │   │   ├── summary-cards.tsx
│   │   │   ├── success-rate-chart.tsx
│   │   │   ├── alert-queue.tsx
│   │   │   ├── recent-autolands.tsx
│   │   │   └── aircraft-distribution-chart.tsx
│   │   ├── aircraft/              # Aircraft components
│   │   │   ├── aircraft-grid.tsx
│   │   │   ├── aircraft-detail.tsx
│   │   │   ├── autoland-history-table.tsx
│   │   │   └── aircraft-trend-chart.tsx
│   │   ├── reports/               # Reports components
│   │   │   ├── reports-table.tsx
│   │   │   ├── report-detail-modal.tsx
│   │   │   ├── reports-filters.tsx
│   │   │   └── reports-batch-actions.tsx
│   │   ├── fleet/                # Fleet components
│   │   │   ├── fleet-grid.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── progress-bar.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── navigation.tsx     # Navigation bar
│   │   │   ├── sidebar.tsx        # Sidebar
│   │   │   └── footer.tsx
│   │   └── shared/               # Shared components
│   │       ├── loading-skeleton.tsx
│   │       ├── error-boundary.tsx
│   │       └── not-found.tsx
│   │
│   ├── lib/                       # Utility functions
│   │   ├── db.ts                 # Database client
│   │   ├── api.ts                # API utilities
│   │   ├── utils.ts              # General utilities
│   │   ├── auth.ts               # Auth utilities (optional)
│   │   └── format.ts             # Formatting utilities
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-autoland.ts       # Autoland data hooks
│   │   ├── use-aircraft.ts       # Aircraft data hooks
│   │   ├── use-reports.ts        # Reports data hooks
│   │   └── use-dashboard.ts      # Dashboard data hooks
│   │
│   ├── stores/                    # State management (Zustand)
│   │   ├── use-dashboard-store.ts
│   │   ├── use-filters-store.ts
│   │   └── use-theme-store.ts
│   │
│   ├── types/                     # TypeScript types
│   │   ├── autoland.ts
│   │   ├── aircraft.ts
│   │   ├── reports.ts
│   │   └── index.ts
│   │
│   └── config/                    # Configuration
│       ├── site.ts               # Site config
│       └── constants.ts          # Constants (colors, etc.)
│
├── public/                         # Static assets
│   ├── images/
│   │   └── logo.png
│   ├── favicon.ico
│   └── ...
│
├── database/                       # SQL migrations
│   ├── migrations/
│   │   ├── 001_create_autoland_tables.sql
│   │   ├── 002_create_dashboard_tables.sql
│   │   └── 003_seed_data.sql
│   └── seed_data.sql
│
├── docs/                           # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
├── docker/
│   └── Dockerfile
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── components.json              # shadcn/ui config
├── cloudbuild.yaml
├── .env.example
├── .gitignore
├── README.md
└── PLAN_UPDATED.md
```

---

## 🎨 UI Components & Styling

### Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VietJet colors
        vj: {
          red: {
            DEFAULT: "#E31837",
            dark: "#B71530",
            light: "#FF5A6E",
          },
          yellow: {
            DEFAULT: "#FFD700",
            dark: "#FFAA00",
          },
        },
        // Status colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### shadcn/ui Components

```bash
# Install shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add label
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
```

---

## 📊 Các Màn hình Chính

### 1. Dashboard Overview
- Summary cards:
  - Total aircraft
  - Overdue count
  - Due soon count
  - Success rate
- Charts:
  - Success rate trend (line chart)
  - Aircraft distribution (bar/pie chart)
- Alert queue: Aircraft cần attention
- Recent autolands: List recent activities

### 2. Fleet Monitoring
- Grid view tất cả aircraft
- Status badges (ON_TIME, DUE_SOON, OVERDUE)
- Progress bar: days remaining / 30 days
- Filter theo status, station
- Sort theo days remaining

### 3. Aircraft Detail
- Aircraft info card
- Autoland history table
- Trend chart (success rate theo thời gian)
- Next due date countdown
- Quick actions

### 4. Reports Management
- Table list all reports
- Filters: aircraft, date range, result, status
- Search: report number, captain, flight
- Detail modal with extracted data
- Download PDF action
- Batch actions (download multiple, export CSV)

---

## 🔌 API Routes

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/autolands/recent` - Recent autolands
- `GET /api/dashboard/alerts` - Alert queue

### Aircraft
- `GET /api/aircraft` - List all aircraft
- `GET /api/aircraft/[reg]` - Aircraft detail
- `GET /api/aircraft/[reg]/autolands` - Autoland history

### Reports
- `GET /api/reports` - List reports (with filters)
- `GET /api/reports/[id]` - Report detail
- `GET /api/reports/[id]/pdf` - Download PDF

### Fleet
- `GET /api/fleet` - Fleet overview
- `GET /api/fleet/status/[status]` - Filter by status

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.300.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0",
    "date-fns": "^2.30.0",
    "pg": "^8.11.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/pg": "^8.10.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

## 🚀 Deployment

### Local Development
```bash
# Create virtual environment (Python for database setup)
python -m venv .venv
source .venv/bin/activate

# Setup PostgreSQL
docker run -d \
  --name autoland-db \
  -e POSTGRES_DB=autoland \
  -e POSTGRES_USER=autoland \
  -e POSTGRES_PASSWORD=autoland123 \
  -p 5432:5432 \
  postgres:15

# Run migrations
psql -h localhost -U autoland -d autoland -f database/migrations/001_create_autoland_tables.sql
psql -h localhost -U autoland -d autoland -f database/migrations/002_create_dashboard_tables.sql

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Google Cloud Run (Production)

```bash
# Build Docker image
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions "_SHORT_SHA=latest"

# Deploy to Cloud Run
gcloud run deploy autoland-monitoring \
    --image "gcr.io/$PROJECT_ID/autoland-monitoring:latest" \
    --region asia-southeast1 \
    --platform managed \
    --allow-unauthenticated \
    --service-account "autoland-monitoring-runner@$PROJECT_ID.iam.gserviceaccount.com" \
    --set-env-vars "APP_ENV=production" \
    --set-env-vars "DB_HOST=/cloudsql/$PROJECT_ID:asia-southeast1:autoland-db" \
    --set-env-vars "DB_NAME=autoland" \
    --set-secrets "DB_PASSWORD=autoland-db-password:latest" \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --min-instances 1 \
    --max-instances 1
```

---

## 📅 Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Phase 0** | Project setup, Next.js init, Tailwind config, shadcn/ui | 3-4 days |
| **Phase 1** | Database setup, API routes implementation | 5-7 days |
| **Phase 2** | Dashboard UI (overview page, charts) | 5-7 days |
| **Phase 3** | Aircraft & Reports pages | 7-10 days |
| **Phase 4** | Fleet Monitoring page | 5-7 days |
| **Phase 5** | Deployment (local + Cloud Run) | 3-4 days |
| **Phase 6** | Testing & Polish | 5-7 days |
| **Total** | | **~35-45 days** |

---

## 📝 Checklist

### Phase 0: Project Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Setup Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Create folder structure
- [ ] Setup environment variables
- [ ] Create base layout (navigation, footer)
- [ ] Setup database connection

### Phase 1: Backend
- [ ] Create database schema
- [ ] Run migrations
- [ ] Implement API routes for dashboard stats
- [ ] Implement API routes for aircraft
- [ ] Implement API routes for reports
- [ ] Implement API routes for fleet
- [ ] Create database utility functions

### Phase 2: Dashboard UI
- [ ] Create dashboard page layout
- [ ] Implement summary cards component
- [ ] Implement success rate chart
- [ ] Implement aircraft distribution chart
- [ ] Implement alert queue component
- [ ] Implement recent autolands component

### Phase 3: Aircraft & Reports Pages
- [ ] Create aircraft list page
- [ ] Create aircraft detail page
- [ ] Implement aircraft grid component
- [ ] Implement autoland history table
- [ ] Create reports list page
- [ ] Create report detail modal
- [ ] Implement reports filters

### Phase 4: Fleet Monitoring
- [ ] Create fleet monitoring page
- [ ] Implement fleet grid component
- [ ] Implement status badge component
- [ ] Implement progress bar component
- [ ] Add filter and sort functionality

### Phase 5: Deployment
- [ ] Create Dockerfile
- [ ] Create Cloud Build configuration
- [ ] Deploy to local development
- [ ] Test all features locally
- [ ] Deploy to Cloud Run
- [ ] Setup monitoring and logging

### Phase 6: Testing & Polish
- [ ] Unit tests for API routes
- [ ] Integration tests
- [ ] E2E tests with Playwright (optional)
- [ ] Performance optimization
- [ ] UI/UX polish
- [ ] Documentation

---

## 🔧 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autoland
DB_USER=autoland
DB_PASSWORD=autoland123

# App
APP_ENV=development
NODE_ENV=development
PORT=3000

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloud Storage (production)
GCP_PROJECT_ID=your-project-id
GCP_STORAGE_BUCKET=autoland-reports

# Secret Manager (production)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## 📚 Additional Notes

### Business Rules
- Mỗi aircraft phải thực hiện autoland **mỗi 30 ngày**
- Next required date = Last autoland date + 30 days
- Status definitions:
  - `ON_TIME`: Days remaining > 7
  - `DUE_SOON`: 0 < Days remaining ≤ 7
  - `OVERDUE`: Days remaining < 0

### Alert Thresholds
- Due soon threshold: 7 ngày (có thể config trong dashboard_settings)
- Alert recipients: Email addresses (có thể config)

### File Storage
- PDF files lưu trong Cloud Storage bucket
- Organized by aircraft_reg and date
- Original PDFs always kept for audit trail

---

## 🤝 Team & Contacts

**Developer:** Vietjet AMO IT Department  
**Email:** datnguyentien@vietjetair.com  
**Website:** vietjetair.com

---

**Document Version:** 2.0  
**Last Updated:** 2025-12-27


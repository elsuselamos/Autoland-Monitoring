# Beads Implementation Plan - Autoland Monitoring

**Date:** 2025-12-27  
**Based on:** PLAN_UPDATED.md v2.0  
**Status:** Ready for Beads Implementation

---

## 📋 Overview

Based on PLAN_UPDATED.md, the Autoland Monitoring project is divided into 7 major phases. This document provides the detailed breakdown into Beads epics and issues.

**Project Status:** Phase 0 (Project Setup) - ✅ COMPLETED  
**Next Phase:** Phase 1 (Backend Implementation)

---

## 🎯 Epics Overview

### Epic 1: Backend API Implementation (Phase 1)
**Priority:** P0 (Critical)  
**Estimated Time:** 5-7 days

Description: Implement all backend API routes for dashboard, aircraft, reports, and fleet. Includes database connection setup, utility functions, and API endpoint implementation.

**Acceptance Criteria:**
- All API routes return valid JSON responses
- Database connection works correctly
- Error handling implemented for all endpoints
- API documentation matches implementation

---

### Epic 2: Dashboard UI Enhancement (Phase 2)
**Priority:** P1 (High)  
**Estimated Time:** 5-7 days

Description: Enhance the dashboard page with real data integration, proper charts, and fully functional components. Currently uses mock data.

**Acceptance Criteria:**
- Dashboard loads real data from API
- Charts display actual data with proper legends
- Alert queue shows aircraft needing attention
- Recent autolands displays live data
- Loading states and error handling implemented

**Dependencies:** Epic 1 (Backend API)

---

### Epic 3: Aircraft Pages (Phase 3 - Part 1)
**Priority:** P1 (High)  
**Estimated Time:** 3-5 days

Description: Create aircraft list page and aircraft detail page with autoland history and trend charts.

**Acceptance Criteria:**
- Aircraft list page displays all aircraft
- Aircraft detail page shows full aircraft information
- Autoland history table is paginated
- Trend chart displays success rate over time
- Next due date countdown is accurate

**Dependencies:** Epic 1 (Backend API)

---

### Epic 4: Reports Pages (Phase 3 - Part 2)
**Priority:** P1 (High)  
**Estimated Time:** 4-5 days

Description: Create reports list page with filtering, search, and detail modal for viewing extracted data and downloading PDFs.

**Acceptance Criteria:**
- Reports list page displays all reports
- Filters work (aircraft, date range, result, status)
- Search functionality works
- Report detail modal shows full extracted data
- PDF download functionality works
- Batch actions (download multiple, export CSV) work

**Dependencies:** Epic 1 (Backend API)

---

### Epic 5: Fleet Monitoring (Phase 4)
**Priority:** P2 (Medium)  
**Estimated Time:** 5-7 days

Description: Create fleet monitoring page with grid view, status badges, and progress bars for all aircraft.

**Acceptance Criteria:**
- Fleet grid displays all aircraft
- Status badges (ON_TIME, DUE_SOON, OVERDUE) are correct
- Progress bars show accurate days remaining
- Filter by status works
- Sort functionality works

**Dependencies:** Epic 1 (Backend API), Epic 3 (Aircraft Pages)

---

### Epic 6: Deployment Infrastructure (Phase 5)
**Priority:** P1 (High)  
**Estimated Time:** 3-4 days

Description: Setup deployment infrastructure including Docker configuration, Cloud Build setup, local deployment, and Cloud Run deployment.

**Acceptance Criteria:**
- Docker builds successfully
- Local deployment works with docker-compose
- Cloud Build triggers work
- Cloud Run deployment succeeds
- Environment variables are properly configured
- Database connection works in production

**Dependencies:** All previous epics

---

### Epic 7: Testing & Polish (Phase 6)
**Priority:** P2 (Medium)  
**Estimated Time:** 5-7 days

Description: Implement unit tests, integration tests, E2E tests, performance optimization, and UI/UX polish.

**Acceptance Criteria:**
- Unit tests cover all API routes (80%+ coverage)
- Integration tests work correctly
- E2E tests cover critical user flows
- Performance meets acceptable thresholds
- UI is polished and consistent with VietJet style
- Documentation is complete

**Dependencies:** All previous epics

---

## 📝 Detailed Issues Breakdown

### Epic 1: Backend API Implementation

#### Issues for Epic 1:

1. **Create Dashboard Stats API**
   - Type: Feature
   - Priority: P0
   - File: `src/app/api/dashboard/stats/route.ts`
   - Description: Implement GET endpoint that returns dashboard statistics (total aircraft, overdue count, due soon count, success rate)
   - Acceptance: Returns JSON with all required stats fields
   - Technical Notes: Use existing database schema, calculate success rate from last 30 days

2. **Create Recent Autolands API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/dashboard/autolands/recent/route.ts`
   - Description: Implement GET endpoint that returns recent autoland reports
   - Acceptance: Returns paginated list of recent autolands
   - Technical Notes: Limit to last 10 by default, support limit query param

3. **Create Alerts API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/dashboard/alerts/route.ts`
   - Description: Implement GET endpoint that returns aircraft needing attention (overdue or due soon)
   - Acceptance: Returns list of aircraft with status OVERDUE or DUE_SOON
   - Technical Notes: Filter by status from autoland_to_go table

4. **Create Aircraft List API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/aircraft/route.ts`
   - Description: Implement GET endpoint that lists all aircraft with pagination and filtering
   - Acceptance: Supports status filter, sort_by, sort_order, page, per_page parameters
   - Technical Notes: Query from autoland_to_go table

5. **Create Aircraft Detail API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/aircraft/[reg]/route.ts`
   - Description: Implement GET endpoint that returns detailed information for a specific aircraft
   - Acceptance: Returns aircraft info from autoland_to_go table
   - Technical Notes: Use dynamic route parameter [reg]

6. **Create Aircraft Autoland History API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/aircraft/[reg]/autolands/route.ts`
   - Description: Implement GET endpoint that returns autoland history for an aircraft
   - Acceptance: Returns paginated list of autoland reports for the aircraft
   - Technical Notes: Join with autoland_reports table, filter by aircraft_reg

7. **Create Reports List API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/reports/route.ts`
   - Description: Implement GET endpoint that lists all reports with advanced filtering
   - Acceptance: Supports aircraft_reg, date_from, date_to, result, search, pagination, sort
   - Technical Notes: Query from autoland_reports table with WHERE conditions

8. **Create Report Detail API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/reports/[id]/route.ts`
   - Description: Implement GET endpoint that returns full details for a specific report
   - Acceptance: Returns complete report data including all fields
   - Technical Notes: Use dynamic route parameter [id]

9. **Create Report PDF Download API**
   - Type: Feature
   - Priority: P1
   - File: `src/app/api/reports/[id]/pdf/route.ts`
   - Description: Implement GET endpoint that streams PDF file from Cloud Storage
   - Acceptance: Returns PDF file with correct content-type
   - Technical Notes: Use Cloud Storage client, handle errors gracefully

10. **Create Fleet Overview API**
    - Type: Feature
    - Priority: P1
    - File: `src/app/api/fleet/route.ts`
    - Description: Implement GET endpoint that returns fleet overview with filtering
    - Acceptance: Supports status, station filters and sorting
    - Technical Notes: Query from autoland_to_go table

11. **Create Database Utility Functions**
    - Type: Feature
    - Priority: P0
    - Files: `src/lib/api.ts`
    - Description: Create utility functions for common API operations (error handling, response formatting)
    - Acceptance: All API routes use these utilities consistently
    - Technical Notes: Include error logging, standard response format

---

### Epic 2: Dashboard UI Enhancement

#### Issues for Epic 2:

1. **Integrate Real Data in Summary Cards**
   - Type: Feature
   - Priority: P1
   - File: `src/components/dashboard/summary-cards.tsx`
   - Description: Replace mock data with real data fetched from API
   - Acceptance: Cards display live data from /api/dashboard/stats
   - Technical Notes: Use React hooks or SWR, handle loading/error states
   - Dependencies: Epic 1 Issue 1

2. **Implement Success Rate Chart with Real Data**
   - Type: Feature
   - Priority: P1
   - File: `src/components/dashboard/success-rate-chart.tsx`
   - Description: Replace placeholder with actual Chart.js implementation using real data
   - Acceptance: Chart displays success rate trend from API data
   - Technical Notes: Use Chart.js with react-chartjs-2, VietJet colors
   - Dependencies: Epic 1 Issue 1

3. **Implement Aircraft Distribution Chart**
   - Type: Feature
   - Priority: P1
   - File: `src/components/dashboard/aircraft-distribution-chart.tsx`
   - Description: Create new chart component showing aircraft distribution by status
   - Acceptance: Pie/bar chart showing ON_TIME, DUE_SOON, OVERDUE counts
   - Technical Notes: Use Chart.js, match VietJet colors
   - Dependencies: Epic 1 Issue 1

4. **Enhance Alert Queue with Real Data**
   - Type: Feature
   - Priority: P1
   - File: `src/components/dashboard/alert-queue.tsx`
   - Description: Replace mock data with real data from API
   - Acceptance: Shows actual alerts from /api/dashboard/alerts
   - Technical Notes: Link to aircraft detail page, show countdown
   - Dependencies: Epic 1 Issue 3

5. **Enhance Recent Autolands with Real Data**
   - Type: Feature
   - Priority: P1
   - File: `src/components/dashboard/recent-autolands.tsx`
   - Description: Replace mock data with real data from API
   - Acceptance: Shows actual recent autolands from /api/dashboard/autolands/recent
   - Technical Notes: Link to report detail, show status badges
   - Dependencies: Epic 1 Issue 2

6. **Implement Auto-refresh for Dashboard**
   - Type: Feature
   - Priority: P2
   - File: `src/app/dashboard/page.tsx`
   - Description: Add auto-refresh functionality to update dashboard data every N seconds
   - Acceptance: Dashboard auto-refreshes based on settings
   - Technical Notes: Use setInterval or SWR revalidate, display last updated time
   - Dependencies: Epic 2 Issues 1-5

---

### Epic 3: Aircraft Pages

#### Issues for Epic 3:

1. **Create Aircraft List Page**
   - Type: Feature
   - Priority: P1
   - File: `src/app/aircraft/page.tsx`
   - Description: Create page displaying list of all aircraft with filters and pagination
   - Acceptance: Grid/list view of aircraft, filters work, pagination works
   - Technical Notes: Use server-side pagination for large datasets
   - Dependencies: Epic 1 Issue 4

2. **Create Aircraft Grid Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/aircraft/aircraft-grid.tsx`
   - Description: Create grid component displaying aircraft cards with status and progress
   - Acceptance: Each card shows aircraft info, status badge, progress bar
   - Technical Notes: Responsive design, link to detail page
   - Dependencies: Epic 3 Issue 1

3. **Create Aircraft Detail Page**
   - Type: Feature
   - Priority: P1
   - File: `src/app/aircraft/[reg]/page.tsx`
   - Description: Create page showing detailed information for a specific aircraft
   - Acceptance: Shows aircraft info, autoland history, trend chart, countdown
   - Technical Notes: Dynamic route [reg], fetch data from API
   - Dependencies: Epic 1 Issues 5, 6

4. **Create Aircraft Detail Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/aircraft/aircraft-detail.tsx`
   - Description: Create component displaying aircraft information card
   - Acceptance: Shows aircraft_reg, last_autoland_date, next_required_date, status
   - Technical Notes: Use Card component, status badges, proper formatting
   - Dependencies: Epic 3 Issue 3

5. **Create Autoland History Table**
   - Type: Feature
   - Priority: P1
   - File: `src/components/aircraft/autoland-history-table.tsx`
   - Description: Create table component showing autoland history for an aircraft
   - Acceptance: Paginated table, shows date, flight, airport, result, captain
   - Technical Notes: Use shadcn/ui Table component, sorting, proper date formatting
   - Dependencies: Epic 1 Issue 6

6. **Create Aircraft Trend Chart**
   - Type: Feature
   - Priority: P2
   - File: `src/components/aircraft/aircraft-trend-chart.tsx`
   - Description: Create line chart showing success rate trend over time for an aircraft
   - Acceptance: Chart displays success rate by month/quarter
   - Technical Notes: Use Chart.js, VietJet colors, proper legends
   - Dependencies: Epic 1 Issue 6

---

### Epic 4: Reports Pages

#### Issues for Epic 4:

1. **Create Reports List Page**
   - Type: Feature
   - Priority: P1
   - File: `src/app/reports/page.tsx`
   - Description: Create page displaying list of all autoland reports
   - Acceptance: Table view, filters work, search works, pagination works
   - Technical Notes: Use server-side filtering, maintain URL state
   - Dependencies: Epic 1 Issue 7

2. **Create Reports Table Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/reports/reports-table.tsx`
   - Description: Create table component with columns for report data
   - Acceptance: Shows all report fields, sorting works, status badges
   - Technical Notes: Use shadcn/ui Table, link to detail modal
   - Dependencies: Epic 4 Issue 1

3. **Create Reports Filters Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/reports/reports-filters.tsx`
   - Description: Create component with filter inputs (aircraft, date range, result, search)
   - Acceptance: All filters work together, clear filters button
   - Technical Notes: Use Input, Select, DatePicker components from shadcn/ui
   - Dependencies: Epic 4 Issue 1

4. **Create Report Detail Modal**
   - Type: Feature
   - Priority: P1
   - File: `src/components/reports/report-detail-modal.tsx`
   - Description: Create modal component showing full report details
   - Acceptance: Shows all extracted data, download PDF button, close button
   - Technical Notes: Use shadcn/ui Dialog, proper spacing, error handling
   - Dependencies: Epic 1 Issue 8

5. **Implement Report PDF Download**
   - Type: Feature
   - Priority: P1
   - File: `src/components/reports/report-detail-modal.tsx`
   - Description: Add functionality to download PDF from Cloud Storage
   - Acceptance: Download button triggers PDF download, handles errors
   - Technical Notes: Call /api/reports/[id]/pdf, handle large files
   - Dependencies: Epic 1 Issue 9

6. **Create Reports Batch Actions**
   - Type: Feature
   - Priority: P2
   - File: `src/components/reports/reports-batch-actions.tsx`
   - Description: Create component with batch actions (download multiple, export CSV)
   - Acceptance: Checkbox selection works, batch download works, export CSV works
   - Technical Notes: Keep state in URL or Zustand store, handle large selections
   - Dependencies: Epic 4 Issue 1

---

### Epic 5: Fleet Monitoring

#### Issues for Epic 5:

1. **Create Fleet Monitoring Page**
   - Type: Feature
   - Priority: P1
   - File: `src/app/fleet/page.tsx`
   - Description: Create page displaying fleet overview with all aircraft
   - Acceptance: Grid view, filters work, sort works
   - Technical Notes: Use Epic 3 components, add fleet-specific features
   - Dependencies: Epic 1 Issue 10, Epic 3 Issues 1-2

2. **Create Fleet Grid Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/fleet/fleet-grid.tsx`
   - Description: Create grid component optimized for fleet view (similar to aircraft-grid but enhanced)
   - Acceptance: Shows all aircraft, status badges, progress bars, clickable
   - Technical Notes: Reuse aircraft-grid with modifications, responsive design
   - Dependencies: Epic 5 Issue 1

3. **Create Enhanced Status Badge Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/fleet/status-badge.tsx`
   - Description: Create reusable status badge component with tooltip
   - Acceptance: Shows status with color, tooltip shows days remaining
   - Technical Notes: Use shadcn/ui Badge as base, add tooltip
   - Dependencies: Epic 5 Issue 1

4. **Create Progress Bar Component**
   - Type: Feature
   - Priority: P1
   - File: `src/components/fleet/progress-bar.tsx`
   - Description: Create progress bar showing days remaining out of 30
   - Acceptance: Visual representation of progress, color-coded by status
   - Technical Notes: Use Tailwind progress, calculate percentage, add animation
   - Dependencies: Epic 5 Issue 1

5. **Implement Fleet Filters and Sort**
   - Type: Feature
   - Priority: P1
   - File: `src/app/fleet/page.tsx`
   - Description: Add filter by status and sort functionality
   - Acceptance: Filter shows correct subset, sort changes order, URL state maintained
   - Technical Notes: Use URL params, maintain scroll position
   - Dependencies: Epic 5 Issue 1

---

### Epic 6: Deployment Infrastructure

#### Issues for Epic 6:

1. **Create docker-compose.yml for Local Development**
   - Type: Feature
   - Priority: P1
   - File: `docker-compose.yml`
   - Description: Create Docker Compose file for easy local development setup
   - Acceptance: `docker-compose up` works, database starts, app starts
   - Technical Notes: Include PostgreSQL service, volumes for persistence, env vars
   - Dependencies: Phase 0 completion

2. **Test Docker Build Locally**
   - Type: Task
   - Priority: P1
   - Description: Build Docker image locally and test
   - Acceptance: Docker build succeeds, container runs without errors
   - Technical Notes: Test with `docker build`, check logs, verify env vars
   - Dependencies: Epic 6 Issue 1

3. **Setup Cloud Build Configuration**
   - Type: Feature
   - Priority: P1
   - File: `cloudbuild.yaml` (already exists)
   - Description: Verify Cloud Build configuration is correct
   - Acceptance: Cloud Build triggers work on push, builds successfully
   - Technical Notes: Check substitutions, Dockerfile paths, image tags
   - Dependencies: Epic 6 Issue 2

4. **Test Cloud Run Deployment**
   - Type: Task
   - Priority: P1
   - Description: Deploy to Cloud Run and verify
   - Acceptance: Service runs, all endpoints work, database connects
   - Technical Notes: Use `gcloud run deploy`, check logs, monitor resource usage
   - Dependencies: Epic 6 Issues 1-3

5. **Setup Monitoring and Logging**
   - Type: Feature
   - Priority: P2
   - Files: Multiple (Cloud Monitoring, Cloud Logging)
   - Description: Setup monitoring and alerting for production
   - Acceptance: Logs are visible, alerts trigger on errors, dashboards work
   - Technical Notes: Use Cloud Monitoring for metrics, Cloud Logging for logs
   - Dependencies: Epic 6 Issue 4

---

### Epic 7: Testing & Polish

#### Issues for Epic 7:

1. **Create Unit Tests for API Routes**
   - Type: Feature
   - Priority: P2
   - Files: `tests/api/*.test.ts` (new directory)
   - Description: Create unit tests for all API routes
   - Acceptance: 80%+ code coverage, all critical paths tested
   - Technical Notes: Use Jest or Vitest, mock database calls, test error cases
   - Dependencies: Epic 1

2. **Create Component Tests**
   - Type: Feature
   - Priority: P2
   - Files: `tests/components/*.test.tsx` (new directory)
   - Description: Create unit tests for UI components
   - Acceptance: All components have tests, props are validated
   - Technical Notes: Use React Testing Library, test user interactions
   - Dependencies: Epics 2-5

3. **Setup Integration Tests**
   - Type: Feature
   - Priority: P2
   - Files: `tests/integration/*.test.ts` (new directory)
   - Description: Create integration tests for critical user flows
   - Acceptance: Key user journeys tested from end to end
   - Technical Notes: Use Testcontainers or mock database, test API integration
   - Dependencies: Epic 7 Issue 1

4. **Create E2E Tests (Optional)**
   - Type: Feature
   - Priority: P3
   - Files: `tests/e2e/*.spec.ts` (new directory)
   - Description: Create E2E tests using Playwright
   - Acceptance: Critical user flows tested in browser
   - Technical Notes: Use Playwright, test in Chrome/Firefox, run in CI
   - Dependencies: Epic 7 Issue 3

5. **Performance Optimization**
   - Type: Task
   - Priority: P2
   - Files: Multiple
   - Description: Optimize application performance
   - Acceptance: Page load time < 3s, API response time < 500ms
   - Technical Notes: Use Next.js caching, optimize images, lazy load, code splitting
   - Dependencies: Epic 7 Issues 1-3

6. **UI/UX Polish**
   - Type: Task
   - Priority: P2
   - Files: Multiple components and pages
   - Description: Polish UI/UX based on testing and user feedback
   - Acceptance: Consistent VietJet styling, smooth animations, proper error states
   - Technical Notes: Add transitions, improve accessibility, fix visual bugs
   - Dependencies: Epics 2-5

7. **Complete Documentation**
   - Type: Task
   - Priority: P2
   - Files: docs/ (various)
   - Description: Complete all documentation
   - Acceptance: All features documented, API docs match implementation
   - Technical Notes: Update README, API.md, DEVELOPMENT.md, DEPLOYMENT.md
   - Dependencies: All previous epics

---

## 🔗 Dependency Graph

```
Epic 1 (Backend API) - P0
├── No dependencies
└── Blocks: Epic 2, Epic 3, Epic 4, Epic 5

Epic 2 (Dashboard UI) - P1
├── Depends on: Epic 1
├── Parallel with: Epic 3, Epic 4 (after Epic 1)
└── Blocks: Epic 6 (Deployment), Epic 7 (Testing)

Epic 3 (Aircraft Pages) - P1
├── Depends on: Epic 1
├── Parallel with: Epic 2, Epic 4 (after Epic 1)
├── Blocks: Epic 5 (uses Aircraft Grid)
└── Blocks: Epic 6 (Deployment), Epic 7 (Testing)

Epic 4 (Reports Pages) - P1
├── Depends on: Epic 1
├── Parallel with: Epic 2, Epic 3 (after Epic 1)
└── Blocks: Epic 6 (Deployment), Epic 7 (Testing)

Epic 5 (Fleet Monitoring) - P2
├── Depends on: Epic 1, Epic 3
├── Parallel with: Epic 2, Epic 4 (after Epic 1, Epic 3)
└── Blocks: Epic 6 (Deployment), Epic 7 (Testing)

Epic 6 (Deployment) - P1
├── Depends on: Epic 2, Epic 3, Epic 4, Epic 5
├── Parallel with: None (must wait for features)
└── Blocks: Epic 7 (Testing)

Epic 7 (Testing & Polish) - P2
├── Depends on: Epic 6
├── Parallel with: None (must wait for deployment)
└── Blocks: None (final phase)
```

---

## 🚀 Starting Points (Ready Issues)

### Ready to Start Immediately (No Dependencies):

**From Epic 1 (Backend API):**
1. Create Dashboard Stats API (P0)
2. Create Recent Autolands API (P1)
3. Create Alerts API (P1)
4. Create Aircraft List API (P1)
5. Create Aircraft Detail API (P1)
6. Create Aircraft Autoland History API (P1)
7. Create Reports List API (P1)
8. Create Report Detail API (P1)
9. Create Report PDF Download API (P1)
10. Create Fleet Overview API (P1)
11. Create Database Utility Functions (P0)

### Parallelization Opportunities:

**Wave 1 (Can start immediately in parallel):**
- All Epic 1 issues (11 issues) - Backend team
- Epic 6 Issues 1-3 (Infrastructure setup) - DevOps team

**Wave 2 (After Epic 1 completes):**
- Epic 2 issues (6 issues) - Frontend team
- Epic 3 issues (6 issues) - Frontend team
- Epic 4 issues (6 issues) - Frontend team
- Epic 5 issues (5 issues) - Frontend team

**Wave 3 (After Features complete):**
- Epic 6 Issue 4 (Monitoring) - DevOps team
- Epic 7 issues (1-7) - QA/DevOps team

---

## 📊 Summary

### By Epic:

| Epic | Issues | Est. Time | Priority |
|-------|---------|------------|----------|
| 1. Backend API | 11 | 5-7 days | P0 |
| 2. Dashboard UI | 6 | 5-7 days | P1 |
| 3. Aircraft Pages | 6 | 3-5 days | P1 |
| 4. Reports Pages | 6 | 4-5 days | P1 |
| 5. Fleet Monitoring | 5 | 5-7 days | P2 |
| 6. Deployment | 5 | 3-4 days | P1 |
| 7. Testing & Polish | 7 | 5-7 days | P2 |
| **Total** | **46** | **30-42 days** | - |

### By Priority:

| Priority | Count | Percentage |
|----------|--------|------------|
| P0 (Critical) | 2 | 4.3% |
| P1 (High) | 31 | 67.4% |
| P2 (Medium) | 10 | 21.7% |
| P3 (Low) | 3 | 6.5% |

---

## 🎯 Execution Order (Recommended)

### Sprint 1 (Week 1): Backend API Foundation
- Focus: Epic 1 (Backend API)
- Deliverables: All 11 API routes working
- Team: Backend developers
- Duration: 5-7 days

### Sprint 2 (Week 2-3): Core Features
- Focus: Epic 2 (Dashboard), Epic 3 (Aircraft), Epic 4 (Reports)
- Deliverables: Dashboard, Aircraft pages, Reports pages functional
- Team: Frontend developers
- Duration: 8-12 days

### Sprint 3 (Week 4-5): Fleet & Infrastructure
- Focus: Epic 5 (Fleet), Epic 6 (Deployment)
- Deliverables: Fleet monitoring complete, local and cloud deployment working
- Team: Frontend + DevOps
- Duration: 8-11 days

### Sprint 4 (Week 6-7): Testing & Polish
- Focus: Epic 7 (Testing & Polish)
- Deliverables: Tests passing, performance optimized, documentation complete
- Team: QA + DevOps
- Duration: 5-7 days

---

## 📝 Notes for Beads Implementation

1. **Issue Title Format**: Always use action-oriented titles (e.g., "Create X API", not "API for X")
2. **Technical Notes**: Always provide specific file paths, function names, or component references
3. **Acceptance Criteria**: Must be testable and measurable
4. **Dependencies**: Link only to immediate dependencies, don't over-constrain
5. **Parallel Work**: Identify clearly what can be worked on simultaneously

---

**Implementation Plan Complete!**

Ready to file Beads epics and issues using `bd create` commands.


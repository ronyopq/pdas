# API Route Design

## Purpose
এই document-এ initial Worker API route design define করা হয়েছে, যাতে frontend, backend এবং database mapping consistent থাকে।

## 1. API Design Principles
- JSON only for phase 1
- role-based authorization on every route
- feature-oriented route grouping
- every write action should be auditable
- export routes should return files or queued export job metadata

## 2. Current Scaffolded Routes
- `GET /api/health`
- `GET /api/meta/navigation`
- `GET /api/dashboard/summary`
- `GET /api/blueprint/routes`

## 3. Recommended Route Groups

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users
- `GET /api/users`
- `GET /api/users/:userId`
- `POST /api/users`
- `PATCH /api/users/:userId`

### Monthly Work Plans
- `GET /api/work-plans?month=&year=`
- `POST /api/work-plans`
- `GET /api/work-plans/:planId`
- `PATCH /api/work-plans/:planId`
- `POST /api/work-plans/:planId/submit`
- `POST /api/work-plans/:planId/approve`
- `POST /api/work-plans/:planId/request-revision`

### Work Plan Rows
- `POST /api/work-plans/:planId/rows`
- `PATCH /api/work-plans/:planId/rows/:rowId`
- `DELETE /api/work-plans/:planId/rows/:rowId`

### Travel Plan Rows
- `POST /api/work-plans/:planId/travel-rows`
- `PATCH /api/work-plans/:planId/travel-rows/:travelRowId`
- `DELETE /api/work-plans/:planId/travel-rows/:travelRowId`

### Daily Sheets
- `GET /api/daily-sheets?date=`
- `POST /api/daily-sheets`
- `GET /api/daily-sheets/:sheetId`
- `PATCH /api/daily-sheets/:sheetId`
- `POST /api/daily-sheets/:sheetId/submit`

### Daily Activity Rows
- `POST /api/daily-sheets/:sheetId/rows`
- `PATCH /api/daily-sheets/:sheetId/rows/:rowId`
- `DELETE /api/daily-sheets/:sheetId/rows/:rowId`

### Pending and Carry-Forward
- `GET /api/pending`
- `POST /api/pending/:planRowId/continue`
- `POST /api/pending/:planRowId/reschedule`
- `POST /api/pending/:planRowId/move-next-month`
- `POST /api/pending/:planRowId/cancel`

### Weekly Reviews
- `GET /api/weekly-reviews`
- `POST /api/weekly-reviews`
- `PATCH /api/weekly-reviews/:reviewId`

### Monthly Reports
- `GET /api/monthly-reports?month=&year=`
- `POST /api/monthly-reports/generate`
- `GET /api/monthly-reports/:reportId`
- `PATCH /api/monthly-reports/:reportId`
- `POST /api/monthly-reports/:reportId/submit`
- `POST /api/monthly-reports/:reportId/approve`

### KPI
- `GET /api/kpis/definitions`
- `POST /api/kpis/definitions`
- `GET /api/kpis/plans?cycle=`
- `POST /api/kpis/plans`
- `GET /api/kpis/plans/:kpiPlanId`
- `PATCH /api/kpis/plans/:kpiPlanId`
- `POST /api/kpis/plans/:kpiPlanId/submit`
- `POST /api/kpis/plans/:kpiPlanId/finalize`

### Attachments
- `POST /api/files/upload`
- `DELETE /api/files/:fileId`

### Exports
- `POST /api/exports/work-plan-excel`
- `POST /api/exports/monthly-report-word`
- `POST /api/exports/daily-report-pdf`
- `POST /api/exports/kpi-summary-pdf`
- `POST /api/exports/kpi-summary-excel`

### Manager Routes
- `GET /api/team/dashboard`
- `GET /api/team/work-plans`
- `GET /api/team/daily-sheets`
- `GET /api/team/pending`
- `GET /api/team/reports`
- `GET /api/team/kpis`

### Admin Routes
- `GET /api/admin/dashboard`
- `GET /api/admin/templates`
- `PATCH /api/admin/templates/:templateId`
- `GET /api/admin/audit-logs`
- `GET /api/admin/export-jobs`

## 4. Request/Response Pattern
- read routes:
  - return `{ data, generatedAt }`
- write routes:
  - return `{ data, generatedAt }`
  - plus validation error payload when needed

## 5. Validation Rules
- `month` must be 1-12
- `year` must be numeric
- one user must not have more than one active approved plan per month
- daily sheet must be unique per user per date
- ad hoc daily row must include reason
- KPI finalization requires manager role or higher

## 6. Authorization Matrix
- employee:
  - own resources only
- manager:
  - own resources + assigned team resources
- admin:
  - all resources except super admin settings
- super admin:
  - full access

## 7. Suggested Backend Module Split

```text
src/server/
  index.ts
  routes/
    auth.ts
    workPlans.ts
    dailySheets.ts
    pending.ts
    monthlyReports.ts
    kpis.ts
    exports.ts
    admin.ts
  services/
    approvals.ts
    carryForward.ts
    reportGenerator.ts
    exportGenerator.ts
    kpiCalculator.ts
  db/
    queries/
    mutations/
```

## 8. Immediate Implementation Order
1. `GET /api/auth/me`
2. `GET/POST/PATCH /api/work-plans`
3. `GET/POST/PATCH /api/daily-sheets`
4. `GET /api/pending`
5. `POST /api/monthly-reports/generate`
6. export endpoints
7. KPI endpoints

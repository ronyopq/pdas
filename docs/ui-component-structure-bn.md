# UI Component Structure

## Purpose
এই document-এ React codebase-এর recommended component structure দেওয়া হয়েছে, যাতে feature growth-এর সাথে UI maintainable থাকে।

## 1. Top-Level Structure

```text
src/
  client/
    App.tsx
    main.tsx
    styles.css
    components/
    pages/
    features/
```

## 2. Recommended Feature-Oriented Expansion

```text
src/client/
  components/
    AppShell.tsx
    StatCard.tsx
  pages/
    DashboardPage.tsx
    SimplePage.tsx
  features/
    work-plan/
      components/
      hooks/
      api.ts
      types.ts
    daily-activity/
      components/
      hooks/
      api.ts
      types.ts
    monthly-report/
      components/
      hooks/
      api.ts
      types.ts
    kpi/
      components/
      hooks/
      api.ts
      types.ts
    admin/
      components/
      hooks/
      api.ts
      types.ts
```

## 3. Shared UI Layer
- `AppShell`
  - global layout
  - sidebar
  - topbar
  - responsive framing
- `StatCard`
  - summary KPI/plan/report cards
- future shared components:
  - `PageHeader`
  - `FilterBar`
  - `DataTable`
  - `StatusBadge`
  - `ExportButtonGroup`
  - `EmptyState`

## 4. Page Layer
- `DashboardPage`
  - employee landing page
- `SimplePage`
  - current placeholder page for scaffold
- future feature pages:
  - `WorkPlanPage`
  - `TravelPlanPage`
  - `TodayPage`
  - `DailySheetPage`
  - `PendingBoardPage`
  - `MonthlyReportWizardPage`
  - `KpiPage`
  - `ManagerDashboardPage`
  - `AdminDashboardPage`
  - `ExportCenterPage`

## 5. Suggested Component Boundaries by Module

### Work Plan
- `WorkPlanHeaderForm`
- `WorkPlanRowTable`
- `WorkPlanRowEditor`
- `TravelPlanTable`
- `ApprovalCommentPanel`
- `SignatureBlockPreview`

### Daily Activity
- `DailySheetHeader`
- `ActivityRowTable`
- `ActivityRowCardMobile`
- `DeliveryChecklist`
- `DailyNoteBox`
- `AttachmentUploader`

### Pending
- `PendingFilters`
- `PendingTaskCard`
- `CarryForwardActionMenu`

### Monthly Report
- `ReportHeaderForm`
- `CompletedTaskList`
- `OngoingTaskList`
- `NextMonthTaskList`
- `LessonsLearnedEditor`
- `CommentsEditor`

### KPI
- `KpiSummaryCards`
- `KpiScoreTable`
- `KpiEvidenceUploader`
- `KpiReviewPanel`

### Admin/Manager
- `ApprovalQueue`
- `ComplianceTable`
- `EmployeeQuickSummary`
- `TemplateManager`
- `ExportScopePicker`

## 6. State Ownership
- top-level app state:
  - auth session
  - navigation metadata
  - current month/year context
- feature state:
  - form drafts
  - filters
  - async loading status
  - local optimistic UI state

## 7. Recommended Shared Hooks
- `useCurrentMonth`
- `useDashboardSummary`
- `useWorkPlan`
- `useDailySheet`
- `usePendingTasks`
- `useMonthlyReport`
- `useKpiPlan`
- `useExportJobs`

## 8. Recommended Shared Types
- `NavigationItem`
- `SummaryCard`
- `DashboardPayload`
- `WorkPlan`
- `WorkPlanRow`
- `TravelPlanRow`
- `DailySheet`
- `DailyActivityRow`
- `MonthlyReport`
- `KpiItem`

## 9. Styling Strategy
- keep layout classes shared in `styles.css`
- add feature-level CSS files only when a module becomes large
- use design tokens for:
  - color
  - radius
  - spacing
  - shadow
  - typography

## 10. Immediate Next Refactor
বর্তমান scaffold intentionally simple. পরের coding step-এ `SimplePage` ভেঙে real feature pages বানানো উচিত, starting with:
1. `WorkPlanPage`
2. `TodayPage`
3. `MonthlyReportWizardPage`
4. `KpiPage`

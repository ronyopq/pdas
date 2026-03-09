# Page-Wise UI Wireframes

## Purpose
এই document low-fidelity wireframe guide হিসেবে লেখা হয়েছে, যাতে design, frontend এবং product discussion একই page structure follow করতে পারে।

## 1. Global Navigation

### Desktop Navigation
- Left sidebar:
  - Dashboard
  - My Plan
  - Today
  - Pending
  - Monthly Report
  - KPI
  - Exports
  - Team
  - Admin
  - Settings
- Top bar:
  - month switcher
  - search
  - notifications
  - profile menu

### Mobile Navigation
- Bottom navigation:
  - Home
  - Plan
  - Today
  - Report
  - Menu

## 2. Login Page

```text
+------------------------------------------------------+
| PRAAN logo                                           |
| Work Plan, Daily Activity and KPI App                |
|------------------------------------------------------|
| Email / Employee ID                                  |
| Password                                             |
| [ Sign In ]                                          |
|------------------------------------------------------|
| Forgot password | Support contact                    |
+------------------------------------------------------+
```

## 3. Employee Dashboard

```text
+----------------------------------------------------------------------------------+
| Header: Month selector | Search | Notifications | Profile                        |
+----------------------------------------------------------------------------------+
| KPI Score | Plan Status | Daily Submission | Pending | Monthly Report Status      |
+----------------------------------------------------------------------------------+
| Today Plan                                                                    > |
| - Planned task 1                                                                |
| - Planned task 2                                                                |
| - Travel due today                                                              |
+----------------------------------------------------------------------------------+
| Pending Tasks                                                                  > |
| - Yesterday carry-forward                                                       |
| - Overdue item                                                                  |
+----------------------------------------------------------------------------------+
| Quick Actions                                                                    |
| [Open Plan] [Write Daily Activity] [Open Report] [Open KPI] [Export]            |
+----------------------------------------------------------------------------------+
```

## 4. Monthly Work Plan Page

```text
+------------------------------------------------------------------------------------------------+
| Month: March 2026 | Status: Draft/Subm/Approved | [Save Draft] [Submit] [Print] [Export XLSX] |
+------------------------------------------------------------------------------------------------+
| Name | Designation | Department/Project | Supervisor | Prepared Date                            |
+------------------------------------------------------------------------------------------------+
| Sl | Date         | Activity                                  | Expected Output        | Status       |
|----+--------------+-------------------------------------------+------------------------+--------------|
| 1  | 01 Mar 2026  | KPI format preparation                    | Draft KPI prepared     | Planned      |
| 2  | 02 Mar 2026  | KPI format finalization                   | KPI approved           | Planned      |
| 3  | 03 Mar 2026  | Prep for Women's Day                      | Event materials ready  | Planned      |
| .. | ...          | ...                                       | ...                    | ...          |
+------------------------------------------------------------------------------------------------+
| [Add Row] [Auto-fill Month Dates] [Copy Previous Month]                                          |
+------------------------------------------------------------------------------------------------+
```

## 5. Travel Plan Section

```text
+----------------------------------------------------------------------------------+
| Monthly Travel Plan                                                              |
+----------------------------------------------------------------------------------+
| Sl | Date       | Destination / Route                     | Purpose | Output      |
|----+------------+------------------------------------------+---------+-------------|
| 1  | 03 Mar     | Subarnachar                              | Field   | Story collect|
| 2  | 08 Mar     | Women's Day event venue                  | Event   | Conducted    |
+----------------------------------------------------------------------------------+
| [Add Travel Row]                                                                 |
+----------------------------------------------------------------------------------+
```

## 6. Work Plan Approval Screen

```text
+----------------------------------------------------------------------------------+
| Employee: Nure Alam Siddiqi | Month: March 2026 | Status: Submitted              |
+----------------------------------------------------------------------------------+
| Plan summary: 31 rows | 4 travel rows | 3 holidays | 2 Fridays                    |
+----------------------------------------------------------------------------------+
| Row list with inline comments                                                    |
| [Approve] [Request Revision] [Reject]                                            |
+----------------------------------------------------------------------------------+
| Reviewer comment box                                                             |
+----------------------------------------------------------------------------------+
```

## 7. Today Page

```text
+----------------------------------------------------------------------------------+
| Date: 09 Mar 2026 | [Open Daily Sheet] | [Mark Quick Complete]                   |
+----------------------------------------------------------------------------------+
| Today's Planned Tasks                                                            |
| - KHANI Women's Day event preparation                                            |
| - Blog post preparation                                                          |
+----------------------------------------------------------------------------------+
| Carry Forward                                                                    |
| - Activity log monitoring system preparation                                     |
+----------------------------------------------------------------------------------+
| Travel Due Today                                                                 |
| - Destination: Subarnachar                                                       |
+----------------------------------------------------------------------------------+
| Quick Add                                                                        |
| [From Plan] [Ad Hoc Task] [Travel Task]                                          |
+----------------------------------------------------------------------------------+
```

## 8. Daily Activity Entry Page

```text
+------------------------------------------------------------------------------------------------+
| Date: 09 Mar 2026 | Status: Draft | [Save Draft] [Submit] [Print] [PDF]                       |
+------------------------------------------------------------------------------------------------+
| Time        | Linked Plan                         | Task Description          | Output           |
|-------------+-------------------------------------+---------------------------+------------------|
| 10:00-11:00 | KHANI event preparation             | Prepared event brief      | Brief shared     |
| 11:00-12:30 | Blog post preparation               | Wrote blog draft          | Draft completed  |
| 02:00-03:00 | Ad hoc                              | Coordination call         | Notes taken      |
+------------------------------------------------------------------------------------------------+
| Note                                                                                           |
| [text area]                                                                                   |
+------------------------------------------------------------------------------------------------+
| Delivery                                                                                       |
| [ ] Submitted to manager  [ ] Sent to partner  [ ] Uploaded file                              |
+------------------------------------------------------------------------------------------------+
```

## 9. Pending Board

```text
+----------------------------------------------------------------------------------+
| Filters: Pending | Overdue | This Week | This Month | Travel | Ad Hoc           |
+----------------------------------------------------------------------------------+
| Card 1: Activity log monitoring system preparation                               |
| Source: Work Plan 05 Mar                                                         |
| Status: Overdue by 4 days                                                        |
| Actions: [Continue Tomorrow] [Reschedule] [Move Next Month] [Cancel]            |
+----------------------------------------------------------------------------------+
| Card 2: KHANI website update                                                     |
| Source: Work Plan 12 Mar                                                         |
| Status: Pending                                                                  |
+----------------------------------------------------------------------------------+
```

## 10. Monthly Report Wizard

```text
+----------------------------------------------------------------------------------+
| Step 1 Header | Step 2 Completed | Step 3 Ongoing | Step 4 Next Month | Step 5 Final |
+----------------------------------------------------------------------------------+
| Project Name | Employee Name | Designation | Reporting Month | Submission Date     |
+----------------------------------------------------------------------------------+
| Completed Tasks                                                                  |
| 1. Prepared KPI format                                                           |
| 2. Submitted DC Report                                                           |
| 3. Updated KHANI website plan                                                    |
+----------------------------------------------------------------------------------+
| Ongoing Tasks / Tasks for Next Month / Lesson Learned / Comments                 |
+----------------------------------------------------------------------------------+
| [Generate Draft] [Save Draft] [Submit] [Export DOCX] [PDF] [Print]              |
+----------------------------------------------------------------------------------+
```

## 11. KPI Page

```text
+------------------------------------------------------------------------------------------------+
| KPI Cycle: March 2026 | Status: Under Review | [Save] [Submit] [Export PDF] [Export Excel]    |
+------------------------------------------------------------------------------------------------+
| KPI Title               | Target | Achieved | Weight | Auto Score | Final Score | Status      |
|-------------------------+--------+----------+--------+------------+-------------+-------------|
| Daily submission rate   | 95%    | 92%      | 20     | 18.4       | 18.0        | Partial     |
| Completion rate         | 90%    | 88%      | 25     | 22.0       | 22.0        | Partial     |
| Manager qualitative KPI | 5      | 4        | 15     | -          | 12.0        | Manual      |
+------------------------------------------------------------------------------------------------+
| Employee comment / evidence upload                                               |
| Manager comment / override score                                                 |
+------------------------------------------------------------------------------------------------+
```

## 12. Manager Dashboard

```text
+----------------------------------------------------------------------------------+
| Team Summary: 12 employees | 3 pending approvals | 5 missing daily sheets        |
+----------------------------------------------------------------------------------+
| Work Plan Queue                                                                  |
| - Rony | March 2026 | Submitted | [Review]                                      |
| - Poppy | March 2026 | Revision requested | [Open]                              |
+----------------------------------------------------------------------------------+
| Daily Compliance                                                                 |
| - Missing today                                                                  |
| - Overdue tasks                                                                  |
+----------------------------------------------------------------------------------+
| KPI Review Queue                                                                 |
| - 4 KPI sheets pending review                                                    |
+----------------------------------------------------------------------------------+
```

## 13. Employee Detail Page for Manager/Admin

```text
+----------------------------------------------------------------------------------+
| Employee profile | Month selector | Tabs: Plan | Daily | Pending | Report | KPI |
+----------------------------------------------------------------------------------+
| Summary cards: plan completion | daily submission | pending | KPI score          |
+----------------------------------------------------------------------------------+
| Selected tab content                                                             |
+----------------------------------------------------------------------------------+
```

## 14. Admin Dashboard

```text
+------------------------------------------------------------------------------------------------+
| Filters: Month | Department | Project | Supervisor | Employee | Status                         |
+------------------------------------------------------------------------------------------------+
| Cards: Work Plan Submitted | Daily Compliance | Reports Submitted | KPI Finalized               |
+------------------------------------------------------------------------------------------------+
| Team / Department table                                                                        |
| Employee | Plan | Daily | Pending | Monthly Report | KPI | Exports                            |
+------------------------------------------------------------------------------------------------+
| Bulk actions: [Export Summary] [Print Batch] [Open Missing Submission Report]                 |
+------------------------------------------------------------------------------------------------+
```

## 15. Export Center

```text
+----------------------------------------------------------------------------------+
| Export Type                                                                     |
| [Work Plan Excel] [Monthly Report Word] [Daily PDF] [KPI Excel/PDF]             |
+----------------------------------------------------------------------------------+
| Scope                                                                           |
| ( ) My document                                                                 |
| ( ) Team document                                                               |
| ( ) Department batch                                                            |
+----------------------------------------------------------------------------------+
| Filters and generate button                                                     |
+----------------------------------------------------------------------------------+
```

## 16. Settings and Template Manager

```text
+----------------------------------------------------------------------------------+
| Branding | Templates | KPI Masters | Master Data | Workflow Rules                |
+----------------------------------------------------------------------------------+
| Template list                                                                    |
| - monthly_workplan_xlsx                                                          |
| - monthly_report_docx                                                            |
| - daily_activity_print                                                           |
| - kpi_summary_pdf                                                                |
+----------------------------------------------------------------------------------+
| [Upload New Template] [Preview] [Activate]                                      |
+----------------------------------------------------------------------------------+
```

## 17. Suggested Mobile Priority Screens
- Dashboard
- Today
- Daily Activity Entry
- Pending Board
- Monthly Report Wizard

## 18. Suggested Desktop Priority Screens
- Work Plan Editor
- Approval Queue
- Admin Dashboard
- KPI Review
- Export Center

## 19. Screen Relationship Summary
- Employee starts from Dashboard
- Dashboard routes to Plan, Today, Pending, Report, KPI
- Manager starts from Team Dashboard
- Admin starts from org-wide Dashboard
- Export Center can be accessed from each major module and from admin navigation

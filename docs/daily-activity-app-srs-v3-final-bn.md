# Software Requirements Specification (SRS) v3.0 Final

## Project Title
PRAAN Work Plan, Daily Activity, KPI and Monthly Reporting Web App

## Document Info
- Version: 3.0 Final
- Date: 9 March 2026
- Prepared for: PRAAN internal use
- Prepared from:
  - `Monthly_Workplan_March_2026.xlsx`
  - `Daily Action Schedule_2026.pdf`
  - `02. Feb _Rony_ Monthly Report Feb 2026.doc`
  - user workflow requirements
- Important assumption:
  - KPI-এর separate sample format পাওয়া যায়নি
  - তাই KPI module-কে configurable scorecard system হিসেবে define করা হয়েছে

## 1. Executive Summary
এই app-এর লক্ষ্য হলো একজন কর্মী যেন একই platform-এ:
- monthly work plan তৈরি করতে পারে
- daily activity লিখতে পারে
- monthly report তৈরি করতে পারে
- KPI update করতে পারে
- এবং existing office format অনুযায়ী Excel, Word, PDF বা Print output নিতে পারে

একই সাথে manager/admin যেন:
- সবার work plan, daily activity, monthly report, KPI দেখতে পারে
- review/approve করতে পারে
- overdue/pending কাজ track করতে পারে
- report filter, print, export করতে পারে

## 2. Core Product Principle
System-এর central workflow হবে:

`Monthly Work Plan -> Daily Activity -> Pending / Carry Forward -> Monthly Report -> KPI Review -> Export / Print`

এই system একটি isolated form-filling tool না; এটি planning, execution, monitoring, evaluation এবং reporting platform।

## 3. Product Goals
- Excel/paper/Word-based current workflow digitize করা
- work plan-কে employee accountability-এর base করা
- daily activity-কে plan-linked করা
- monthly report auto-assisted করা
- KPI tracking এক app-এ আনা
- manager/admin monitoring সহজ করা
- existing official format preserve করে digital output তৈরি করা
- mobile ও laptop উভয় device-এ usable রাখা

## 4. Stakeholders
- Employee / Staff
- Supervisor / Manager
- Admin
- Super Admin

## 5. Role-Based Access

### 5.1 Employee
- নিজের monthly work plan create/edit/submit করবে
- নিজের travel plan create/edit করবে
- নিজের daily activity লিখবে
- নিজের pending task দেখবে
- নিজের monthly report generate/edit/submit করবে
- নিজের KPI view/update করবে where allowed
- নিজের outputs export/print করতে পারবে

### 5.2 Supervisor / Manager
- assigned employee/team-এর work plan view/review/approve করবে
- daily activity দেখবে
- monthly report review/approve করবে
- KPI target review/score/comment করবে
- pending, overdue, missing submission monitor করবে

### 5.3 Admin
- সব user/team/project data দেখবে
- filter, search, export, print করবে
- templates, master data, KPI master manage করবে
- compliance dashboard দেখবে

### 5.4 Super Admin
- all permissions
- workflow settings
- organization branding
- export template setup
- KPI formula rules
- security and audit policies

## 6. Source Format Findings

### 6.1 Monthly Work Plan Format
Provided Excel workbook থেকে পাওয়া গেছে:
- header:
  - Name of the Month
  - Date
  - Name
  - Designation
  - Department / Project
  - Supervisor
- main plan table:
  - Sl.
  - Date
  - Activity
  - Output
- monthly travel plan:
  - Sl.
  - Date
  - Travel / Destination
  - Output
- signoff:
  - Submitted By
  - Approved By

### 6.2 Daily Activity Register Format
Provided register template/PDF থেকে পাওয়া গেছে:
- Date
- Time
- Task Description
- Output
- Note
- Delivery

### 6.3 Monthly Report Format
Provided Word sample থেকে পাওয়া গেছে:
- Project name
- Name
- Designation
- Reporting month
- Submission date
- Completed tasks
- Ongoing tasks
- Tasks for next month
- Lesson learned
- Comments
- Submitted by
- Approved by

## 7. In Scope
- employee self-service work plan
- travel planning
- daily activity entry
- pending/carry-forward tracking
- monthly report generation
- KPI management
- manager/admin review
- Excel/Word/PDF/Print output
- audit trail
- mobile responsive UI
- Cloudflare deployment

## 8. Out of Scope
- payroll
- attendance machine integration
- leave balance automation
- accounting
- recruitment HRM

## 9. End-to-End Workflow

### 9.1 Employee Workflow
1. employee মাসের শুরুতে monthly work plan তৈরি করবে
2. প্রয়োজন হলে travel plan যোগ করবে
3. manager approval-এর জন্য submit করবে
4. approved plan অনুযায়ী প্রতিদিন daily activity লিখবে
5. incomplete কাজ pending হবে
6. month-end এ monthly report auto-draft হবে
7. employee final edit করে submit করবে
8. KPI self-update/evidence upload করবে if enabled
9. প্রয়োজনমতো Excel/Word/PDF/Print output নেবে

### 9.2 Manager Workflow
1. team work plan review করবে
2. specific rows revise করতে পারবে
3. daily activity monitor করবে
4. monthly report approve করবে
5. KPI score/comment/finalize করবে

### 9.3 Admin Workflow
1. organization-wide data monitor করবে
2. missing submissions track করবে
3. export/print করবে
4. KPI dashboard দেখবে
5. master templates maintain করবে

## 10. Functional Requirements

### FR-01 Authentication and Identity
- secure login must be supported
- role-based access must be enforced for every screen and API
- user profile must include:
  - full name
  - designation
  - department/project
  - reporting manager
  - role
  - active status

### FR-02 Employee Workspace
- employee dashboard must show:
  - current month work plan status
  - today’s planned tasks
  - pending tasks
  - overdue tasks
  - travel tasks due
  - monthly report status
  - KPI summary
- employee should navigate quickly between:
  - Plan
  - Today
  - Pending
  - Report
  - KPI

### FR-03 Monthly Work Plan Module
- system must support one monthly work plan per employee per month
- work plan must match the existing Excel structure
- system must auto-generate date-wise rows for the selected month
- each plan row must support:
  - serial no.
  - date
  - activity
  - expected output
  - row type
  - status
  - remarks
  - linked project/category
- supported row types should include:
  - regular work
  - meeting
  - field visit
  - holiday
  - Friday/weekend
  - leave
  - reserved/ad hoc
- system should allow blank or low-activity dates where needed
- rows should remain printable in the current office layout

### FR-04 Monthly Travel Plan Module
- each monthly work plan must contain a travel plan section
- each travel row must support:
  - serial no.
  - date
  - destination / travel route
  - purpose
  - expected output
  - linked main plan row (optional)
  - status
- travel plan must be visible in employee, manager and admin views
- travel rows must be printable in the existing format

### FR-05 Work Plan Approval Workflow
- work plan statuses:
  - draft
  - submitted
  - under review
  - approved
  - revision requested
  - rejected
  - locked
- manager must be able to comment on specific rows
- system must maintain revision history
- approved work plan becomes the source for the daily entry screen

### FR-06 Daily Activity Module
- employee must be able to create one daily sheet per date
- system should preload current date’s approved planned rows
- employee must be able to create multiple actual activity rows
- each daily row must support:
  - start time
  - end time
  - linked plan row
  - linked travel row if relevant
  - actual task description
  - actual output
  - status
  - note
  - delivery required
  - delivery done
  - attachment/evidence
- ad hoc tasks must be allowed with a mandatory reason
- sheet-level note must be supported

### FR-07 Pending, Overdue and Carry-Forward
- incomplete planned tasks must appear in pending list
- overdue tasks must be highlighted
- carry-forward must preserve original plan linkage
- employee must be able to mark a pending task as:
  - continue next day
  - reschedule in current month
  - move to next month
  - cancel with reason
- manager/admin must be able to filter pending tasks by aging

### FR-08 Monthly Report Module
- monthly report must be generated from:
  - approved work plan
  - completed daily activities
  - open pending items
  - travel activities
- monthly report must support:
  - project name
  - employee name
  - designation
  - reporting month
  - submission date
  - completed tasks
  - ongoing tasks
  - tasks for next month
  - lesson learned
  - comments
  - submitted by
  - approved by
- employee must be able to edit generated content before submission
- manager must be able to approve or return for revision

### FR-09 KPI Module
- system must support KPI setup by role, department, project or employee
- KPI must support monthly, quarterly or yearly cycle
- each KPI item must support:
  - KPI title
  - description
  - measurement unit
  - target value
  - weight
  - achieved value
  - auto/manual source
  - evidence/attachment
  - employee comment
  - manager comment
  - score
  - final rating/status
- KPI may be linked to system data sources such as:
  - work plan submission timeliness
  - daily submission rate
  - task completion rate
  - overdue task ratio
  - monthly report submission timeliness
  - travel completion
  - manager-defined qualitative KPI
- manager/admin must be able to configure formulas for auto-calculated KPIs
- manager must be able to manually adjust or override score with comment

### FR-10 KPI Review and Approval
- employee can view own KPI dashboard
- manager can review team KPIs
- admin can see organization-wide KPI summary
- KPI statuses may include:
  - draft
  - submitted
  - under review
  - finalized
  - locked
- KPI review history must be auditable

### FR-11 Manager Dashboard
- manager dashboard must show:
  - pending work plan approvals
  - missing daily sheets
  - overdue tasks by employee
  - monthly report submissions
  - KPI pending review
  - low completion rate alerts

### FR-12 Admin Dashboard
- admin dashboard must support filters by:
  - date range
  - month
  - employee
  - supervisor
  - department
  - project
  - status
- admin must be able to open any employee’s:
  - work plan
  - travel plan
  - daily sheet
  - monthly report
  - KPI scorecard

### FR-13 Export and Print Module
- system must support template-based outputs matching the current official formats
- export/print must be available for employee, manager and admin based on permission
- system must support:
  - Excel export
  - Word export
  - PDF export
  - Print preview

### FR-14 Monthly Work Plan Excel Output
- system must generate `.xlsx` output matching the current monthly work plan layout
- output must include:
  - header fields
  - date-wise plan rows
  - monthly travel plan rows
  - submitted by / approved by block
- admin may export:
  - single employee workbook
  - month-wise multi-user workbook with one sheet per employee

### FR-15 Monthly Report Word Output
- system must generate `.docx` output matching the current monthly report structure
- output must include:
  - employee/project header
  - completed tasks
  - ongoing tasks
  - tasks for next month
  - lessons learned
  - comments
  - submitted by / approved by

### FR-16 Daily Activity PDF/Print Output
- system must generate print-friendly daily activity output matching the current register style
- output must include:
  - date
  - time rows
  - task description
  - output
  - note
  - delivery
- daily output must be printable in A4 portrait

### FR-17 Generic PDF Output
- any major document should be exportable to PDF:
  - monthly work plan
  - travel plan
  - daily activity
  - monthly report
  - KPI summary

### FR-18 Print Template Management
- admin/super admin must be able to manage:
  - organization logo
  - header/footer text
  - signature labels
  - optional branding fields
- structure of official templates should remain locked unless admin has template permission

### FR-19 Import Module
- system should support import of existing monthly work plan Excel files
- import must validate:
  - employee mapping
  - month/year
  - plan rows
  - travel rows
- import errors must be shown before save

### FR-20 Audit and Versioning
- system must log create/edit/submit/approve/reject/lock/export actions
- work plan revisions must keep row-level history
- monthly report submissions must keep snapshot history
- KPI score revisions must keep audit trail

### FR-21 Notifications and Reminders
- system should send reminders for:
  - monthly work plan not submitted
  - revision requested
  - daily sheet not submitted
  - overdue tasks
  - monthly report due
  - KPI submission/review due

## 11. Business Rules
- one employee can have only one active approved monthly work plan per month
- daily activity should default to approved work plan rows for that date
- ad hoc task is allowed but must remain separately reportable
- travel plan is part of the monthly planning process
- monthly report data must be based on that month’s execution snapshot
- KPI can be partly auto-calculated and partly manually scored
- locked documents cannot be edited by normal employees

## 12. Data Model (Logical)

### 12.1 User
- id
- employee_code
- full_name
- designation
- department_id
- project_id
- manager_user_id
- role
- status

### 12.2 MonthlyWorkPlan
- id
- user_id
- month
- year
- prepared_date
- status
- version_no
- submitted_at
- approved_at
- approved_by

### 12.3 MonthlyWorkPlanRow
- id
- work_plan_id
- serial_no
- work_date
- row_type
- planned_activity
- expected_output
- row_status
- remarks
- project_tag

### 12.4 MonthlyTravelPlanRow
- id
- work_plan_id
- serial_no
- travel_date
- destination
- purpose
- expected_output
- status
- linked_plan_row_id

### 12.5 DailySheet
- id
- user_id
- work_date
- note
- status
- submitted_at

### 12.6 DailyActivityRow
- id
- daily_sheet_id
- linked_plan_row_id
- linked_travel_row_id
- start_time
- end_time
- actual_activity
- actual_output
- status
- delivery_required
- delivery_done
- ad_hoc_reason

### 12.7 MonthlyReport
- id
- user_id
- month
- year
- completed_tasks_snapshot
- ongoing_tasks_snapshot
- next_month_tasks_snapshot
- lessons_learned
- comments
- status
- submitted_at
- approved_at

### 12.8 KPIPlan
- id
- cycle_type
- month
- year
- user_id
- status

### 12.9 KPIItem
- id
- kpi_plan_id
- title
- description
- measurement_unit
- target_value
- achieved_value
- weight
- score
- source_type
- formula_config
- employee_comment
- manager_comment
- final_status

### 12.10 Attachment
- id
- entity_type
- entity_id
- file_name
- file_url
- mime_type

### 12.11 AuditLog
- id
- actor_id
- entity_type
- entity_id
- action
- before_json
- after_json
- created_at

## 13. Derived Logic

### 13.1 Today Screen Logic
- current date-এর approved work plan rows দেখাবে
- previous pending tasks দেখাবে
- today due travel tasks দেখাবে

### 13.2 Monthly Report Logic
- completed tasks = month-এর completed daily activities
- ongoing tasks = month-end এ incomplete tasks
- next month tasks = carry-forward tasks + next month plan draft items

### 13.3 KPI Auto Metrics Logic
- work plan submission timeliness = submit date vs deadline
- daily submission rate = submitted daily sheets / expected working days
- completion rate = completed plan rows / active plan rows
- overdue ratio = overdue rows / active plan rows
- report timeliness = monthly report submit date vs deadline

## 14. Reporting Requirements
- employee-wise monthly work plan report
- employee-wise travel plan report
- employee-wise daily activity report
- employee-wise monthly report
- employee-wise KPI sheet
- team-wise pending report
- team-wise plan vs actual report
- project-wise KPI summary
- missing submission report

## 15. UX Requirements
- mobile-first responsive UI
- desktop sidebar, mobile bottom navigation recommended
- app-like quick access for frequent actions
- row-based editing on desktop
- card-based editing on mobile
- print preview separate from edit mode
- Bangla-friendly labels

## 16. Non-Functional Requirements
- 360px+ mobile support
- standard laptop support
- page load target under 3 seconds for normal screens
- secure HTTPS-only access
- role-based authorization
- auditability of approval and KPI review
- printable A4 output
- timezone default: Asia/Dhaka
- high data integrity for report snapshots

## 17. Recommended Cloudflare Architecture
- Frontend: React + Vite + TypeScript
- API: Cloudflare Workers
- Database: Cloudflare D1
- File Storage: Cloudflare R2
- Scheduled reminders: Workers Cron Triggers
- Optional internal access restriction: Cloudflare Access

## 18. MVP Scope

### Phase 1 MVP
- authentication and role model
- employee dashboard
- monthly work plan
- monthly travel plan
- work plan approval
- daily activity
- pending/carry-forward
- monthly report
- Excel/Word/PDF/Print output
- manager/admin dashboards
- basic KPI module

### Phase 2
- advanced KPI formulas
- richer analytics
- template editor UI
- offline draft support
- bulk import/export

## 19. Acceptance Criteria
- employee can create and submit monthly work plan inside the app
- employee can create and submit daily activity inside the app
- employee can create and submit monthly report inside the app
- employee can view/update KPI inside the app
- manager/admin can view everyone’s data based on permission
- monthly work plan can be exported to Excel in the given office format
- monthly report can be exported to Word in the given office format
- daily activity can be exported to PDF and printed in the given office format
- KPI summary can be exported to PDF/Excel
- pending tasks and overdue tasks are visible in dashboards

## 20. Delivery Recommendation
Recommended implementation order:
1. roles and user model
2. monthly work plan and travel plan
3. approval workflow
4. daily activity linked to plan
5. pending/carry-forward engine
6. monthly report module
7. export/print engine
8. KPI module
9. dashboards and reminders

## 21. Final Summary
হ্যাঁ, এই app-এ একজন কর্মী একই জায়গায় work plan, daily activity, monthly report, KPI করতে পারবে; manager/admin সবারটা দেখতে পারবে; এবং তোমার দেওয়া format অনুযায়ী Excel, Word, PDF ও print output নেওয়া যাবে। এই v3 SRS সেই full system-এর build-ready requirements define করে।

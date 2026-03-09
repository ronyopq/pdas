# Software Requirements Specification (SRS) v2.0

## Project Title
PRAAN Daily Activity, Monthly Work Plan, Travel Plan and Monthly Reporting Web App

## Document Info
- Version: 2.0
- Date: 9 March 2026
- Prepared for: PRAAN internal productivity and reporting system
- Prepared from:
  - `Daily Action Schedule_2026.pdf`
  - `02. Feb _Rony_ Monthly Report Feb 2026.doc`
  - `Monthly_Workplan_March_2026.xlsx`
  - user workflow description

## 1. Executive Summary
এই revised SRS-এ monthly work plan-কে system-এর primary source of truth ধরা হয়েছে। অর্থাৎ:
- মাস শুরু হবে approved monthly work plan দিয়ে
- প্রতিদিনের daily activity work plan row থেকে চালিত হবে
- pending/carry-forward task work plan context হারাবে না
- monthly report work plan + daily execution + pending status থেকে তৈরি হবে

এই system শুধু daily log app না; এটি একটি work-planning-to-reporting platform।

## 2. Review of Previous SRS (v1.0)
আগের SRS-এর মূল সীমাবদ্ধতা ছিল:
- monthly work plan module generic ছিল, actual template-driven ছিল না
- plan sheet-এর `row-per-date` structure ধরা হয়নি
- `monthly travel plan` section বাদ ছিল
- `submitted by / approved by` signoff section plan module-এ explicit ছিল না
- daily activity এবং monthly work plan-এর parent-child relationship যথেষ্ট শক্তভাবে define করা হয়নি
- weekly review instruction-based workflow ধরা হয়নি

এই v2.0 document-এ উপরের gap গুলো address করা হয়েছে।

## 3. Product Vision
একটি unified, mobile-responsive, app-like internal web application যেখানে:
- user মাসিক work plan জমা দেবে
- system calendar/date-wise planned work তৈরি করবে
- user প্রতিদিন actual কাজ log করবে
- unfinished work carry-forward হবে
- travel plan track হবে
- supervisor review করবে
- month-end report auto-draft হবে
- admin সব user/team/project অনুযায়ী monitor, print, export করতে পারবে

## 4. Core Product Principle
System data flow হবে:

`Monthly Work Plan -> Daily Activity Execution -> Pending/Carry Forward -> Monthly Report -> Print/Export`

এর মানে:
- দৈনিক entry plan ছাড়া ideally হবে না
- ad hoc কাজ allowed হবে, কিন্তু reason-tagged হবে
- monthly report হবে actual execution-এর summary, not a separate isolated document

## 5. Business Objectives
- paper/Excel-based work plan এবং daily register digital করা
- কাজের prior planning বাধ্যতামূলক করা
- date-wise accountability নিশ্চিত করা
- pending ও overdue কাজ visible করা
- travel-related work আলাদা track করা
- monthly reporting দ্রুত, consistent এবং printable করা

## 6. Source Template Findings

### 6.1 Monthly Work Plan Excel Template
Provided workbook থেকে নিম্ন structure পাওয়া গেছে:

#### Header Section
- Name of the Month
- Date
- Name
- Designation
- Department / Project
- Supervisor

#### Main Work Plan Table
- Sl.
- Date
- Activity
- Output

#### Monthly Travel Plan Section
- Sl.
- Date
- Travel / Destination
- Output

#### Signoff Section
- Submitted By
- Approved By

#### Instruction / Policy Note
- month-end productivity maximize করতে হবে
- weekly review conduct করতে হবে
- report direct supervisor-এর সাথে share করতে হবে

### 6.2 Daily Activity Register Template
- Date
- Time
- Task Description
- Output
- Note
- Delivery

### 6.3 Monthly Report Sample
- Project name
- Employee name
- Designation
- Reporting month
- Submission date
- Completed tasks
- Ongoing tasks
- Tasks for next month
- Lesson learned
- Comments
- Submitted by / Approved by

## 7. Scope

### 7.1 In Scope
- monthly work plan creation, approval and revision
- date-wise planned activity rows
- monthly travel plan
- daily activity logging against plan
- pending, carry-forward and overdue logic
- plan vs actual dashboard
- monthly report generation
- admin reporting
- print/export
- attachment support
- mobile and desktop responsive interface
- Cloudflare deployment

### 7.2 Out of Scope
- payroll
- leave balance management
- attendance device integration
- HR file archive
- finance/accounting modules

## 8. Stakeholders
- Staff/User
- Supervisor
- Admin
- Super Admin

## 9. Roles and Access

### 9.1 Staff/User
- নিজের monthly work plan create/edit/submit করবে
- daily activity submit করবে
- travel entries manage করবে
- pending কাজ review করবে
- monthly report generate/edit/submit করবে

### 9.2 Supervisor
- work plan approve/reject করবে
- daily execution review করবে
- monthly report approve/reject করবে
- weekly review notes দেখতে পারবে

### 9.3 Admin
- organization-wide reports দেখবে
- filters and exports manage করবে
- user/project master data maintain করবে

### 9.4 Super Admin
- permission matrix
- settings
- workflow configuration
- system policies

## 10. Workplan-First Business Process

### 10.1 Monthly Planning Process
1. user month select করবে
2. system month-এর সব date auto-generate করবে
3. user প্রতিটি relevant date-এর জন্য planned activity এবং expected output লিখবে
4. user আলাদা travel plan section পূরণ করবে
5. user plan submit করবে
6. supervisor approve/reject/revise করবে
7. approved plan daily dashboard-এর source হবে

### 10.2 Daily Execution Process
1. user Today screen-এ ঢুকবে
2. system approved work plan থেকে আজকের planned task দেখাবে
3. user planned task select করে actual work log করবে
4. user time, task description, output, status, note, delivery লিখবে
5. incomplete task pending হিসেবে carry হবে
6. completed task monthly report dataset-এ যাবে

### 10.3 Weekly Review Process
1. প্রতি সপ্তাহ শেষে system current week planned vs completed summary দেখাবে
2. user short weekly review note submit করতে পারবে
3. supervisor weekly review দেখতে পারবে

### 10.4 Monthly Reporting Process
1. month-end এ system completed/ongoing/carry-forward aggregate করবে
2. monthly report draft generate করবে
3. user lessons learned/comments edit করবে
4. supervisor approve করবে
5. final printable report export হবে

## 11. Functional Requirements

### FR-01 Authentication and User Management
- secure login must be supported
- role-based authorization must be enforced
- user profile must include name, designation, department/project, supervisor, status
- each user must have one primary supervisor

### FR-02 Monthly Work Plan Template Engine
- system must support a monthly work plan template matching the current Excel structure
- system must auto-create date rows for the selected month
- each plan row must support:
  - serial no.
  - date
  - activity
  - expected output
  - row status
  - remarks
  - linked project/category
- system should allow row types such as:
  - working day task
  - holiday
  - Friday/weekend
  - leave
  - field visit
  - meeting
  - ad hoc reserved
- user must be able to keep blank dates if no task is planned
- system must preserve the template order in print mode

### FR-03 Monthly Travel Plan
- each monthly work plan must have a travel plan sub-section
- each travel entry must support:
  - serial no.
  - date
  - destination / route
  - purpose
  - expected output
  - linked work-plan row (optional)
  - travel status
- travel plan must appear in printable monthly plan
- admin must be able to report travel plan separately

### FR-04 Work Plan Submission and Approval
- work plan statuses: draft, submitted, under review, approved, rejected, revised, locked
- approval comments must be stored
- supervisor may request revision on specific rows
- approved work plan rows become daily execution source
- once approved, row edits should create a revision trail

### FR-05 Daily Activity Entry
- user must be able to create one daily sheet per date
- daily sheet should prefill today’s planned rows from approved monthly work plan
- user must be able to log multiple actual activity rows against one planned item
- each daily activity row must support:
  - start time
  - end time
  - linked plan row
  - actual task description
  - actual output
  - status
  - note
  - delivery flag
  - attachment
- user may add ad hoc work, but must provide reason

### FR-06 Pending and Carry-Forward
- if a planned task is not completed, it must appear in pending list
- carry-forward should retain original work-plan linkage
- user must be able to choose:
  - continue tomorrow
  - reschedule within month
  - move to next month plan
  - cancel with reason
- overdue tasks must be highlighted

### FR-07 Plan vs Actual Reconciliation
- every monthly work plan row must show actual execution summary
- system must calculate:
  - planned count
  - executed count
  - completion status
  - delay days
  - ad hoc ratio
- dashboard must show:
  - total planned rows
  - completed rows
  - pending rows
  - overdue rows
  - travel rows
  - ad hoc rows

### FR-08 Weekly Review
- system should show a weekly review prompt every 7 days
- user can submit a short weekly review summary
- weekly review should include:
  - planned vs completed count
  - key achievements
  - unresolved items
  - support required

### FR-09 Monthly Report Generation
- system must generate a monthly report from:
  - approved monthly work plan
  - daily actual activity
  - pending and carry-forward state
  - travel outputs
- generated monthly report must contain:
  - employee and project header
  - completed tasks
  - ongoing tasks
  - tasks for next month
  - lessons learned
  - comments
  - submitted by / approved by

### FR-10 Print and Export
- monthly work plan must be printable in a format similar to the current Excel sheet
- print output must include:
  - header section
  - date-wise plan rows
  - monthly travel plan
  - submitted by / approved by
- daily sheet must be printable in current register-like structure
- monthly report must be printable in current official structure
- PDF export is mandatory
- Excel export is recommended for admin reporting

### FR-11 Dashboard
- user dashboard must show:
  - today’s planned items
  - pending items
  - overdue items
  - travel items due today
  - weekly review due status
- supervisor dashboard must show:
  - pending work plan approvals
  - missing daily submissions
  - overdue tasks by user
  - monthly report approvals
- admin dashboard must show:
  - department/team/project filters
  - organization-wide plan vs actual
  - travel plan summary
  - reporting compliance

### FR-12 Search, Filter, and Audit
- system must support search by month, user, supervisor, project, date, status
- all create/update/submit/approve actions must be logged
- row-level change history must be available for work plan revisions

### FR-13 Notifications
- reminders should be sent for:
  - monthly work plan not submitted
  - work plan revision requested
  - daily sheet not submitted
  - weekly review due
  - monthly report due

### FR-14 Existing Excel Import
- admin should be able to import an existing monthly work plan from Excel
- import must map:
  - header fields
  - plan rows
  - travel rows
  - signoff placeholders
- import validation errors must be shown before final save

## 12. Key Business Rules
- monthly work plan is mandatory before daily execution begins for a month
- daily activity should default to approved plan rows for that date
- ad hoc work is allowed but must remain separately reportable
- travel plan is part of monthly planning, not a separate unrelated module
- every work plan belongs to one user and one month
- one user can have only one active approved work plan per month
- work plan must support revision history
- submitted monthly report should snapshot monthly data at submission time

## 13. UI Modules
- Login
- My Month Plan
- Monthly Work Plan Editor
- Travel Plan Editor
- Plan Approval Screen
- Today’s Tasks
- Daily Activity Entry
- Pending Board
- Weekly Review
- Monthly Report Wizard
- Admin Reports
- Print Preview
- Settings and Master Data

## 14. UX Requirements
- mobile-first design
- one-tap navigation between `Plan`, `Today`, `Pending`, `Report`
- calendar/date-centric work plan view
- inline row editing on desktop
- compact card-based row editing on mobile
- quick duplicate/copy output for repetitive tasks
- print preview separate from edit mode
- app-like installable PWA experience recommended

## 15. Logical Data Model

### 15.1 User
- id
- full_name
- designation
- department_id
- project_id
- supervisor_user_id
- role
- status

### 15.2 MonthlyWorkPlan
- id
- user_id
- month
- year
- prepared_date
- submitted_by
- approved_by
- status
- version_no

### 15.3 MonthlyWorkPlanRow
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

### 15.4 MonthlyTravelPlanRow
- id
- work_plan_id
- serial_no
- travel_date
- destination
- purpose
- expected_output
- status
- linked_plan_row_id

### 15.5 DailySheet
- id
- user_id
- work_date
- note
- status
- submitted_at

### 15.6 DailyActivityRow
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

### 15.7 WeeklyReview
- id
- user_id
- week_start_date
- week_end_date
- achievements
- unresolved_items
- support_required
- submitted_at

### 15.8 MonthlyReport
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

### 15.9 Attachment
- id
- entity_type
- entity_id
- file_name
- file_url
- mime_type

### 15.10 AuditLog
- id
- actor_id
- entity_type
- entity_id
- action
- before_json
- after_json
- created_at

## 16. Derived Logic

### 16.1 Today’s Task Logic
- source = approved monthly work plan rows for current date
- plus pending rows from previous dates
- plus due travel rows

### 16.2 Pending Logic
- a row becomes pending when expected completion date passes and status is not completed

### 16.3 Monthly Report Logic
- completed tasks = plan-linked or ad hoc activities completed within month
- ongoing tasks = started but not completed rows at month-end
- tasks for next month = carry-forward rows + manually added next month draft rows

## 17. Non-Functional Requirements
- mobile support from 360px width and above
- desktop support for standard laptop resolution
- page load target under 3 seconds for common screens
- secure role-based access
- auditability for approvals and revisions
- printable A4 layouts
- Bangla-friendly UI
- timezone default: Asia/Dhaka

## 18. Reporting Requirements
- user-wise monthly work plan print
- user-wise travel plan print
- daily activity print
- monthly report print
- supervisor-wise pending report
- team-wise plan vs actual report
- project-wise travel report
- missing submission report

## 19. Recommended Cloudflare Architecture
- Frontend: React + Vite + TypeScript
- API: Cloudflare Workers
- Database: Cloudflare D1
- File Storage: Cloudflare R2
- Scheduled reminders: Workers Cron Triggers
- Auth:
  - application auth for roles
  - optional Cloudflare Access for internal restriction

## 20. MVP Definition

### MVP Phase
- user management
- monthly work plan editor
- monthly travel plan editor
- approval workflow
- daily activity entry linked to plan rows
- pending/carry-forward
- monthly report generation
- print/export
- admin filters

### Phase 2
- Excel import/export improvements
- AI-assisted monthly report drafting
- richer dashboard analytics
- offline draft support

## 21. Acceptance Criteria
- user can prepare one monthly work plan for a month with date-wise rows
- travel plan can be entered and printed with the work plan
- supervisor can approve the work plan
- approved plan rows appear on the daily screen by date
- user can log actual work against a planned row
- unfinished rows appear as pending
- monthly report is generated from actual data
- admin can print/view plan, daily log, travel plan and monthly report

## 22. Delivery Recommendation
Development order should be:
1. user/role model
2. monthly work plan and travel plan schema
3. work plan approval flow
4. daily execution linked to plan rows
5. pending/carry-forward engine
6. monthly report generation
7. print/export templates
8. admin dashboards
9. reminders and weekly review

## 23. Final Summary
এই revised SRS অনুযায়ী system-এর heart হবে `Monthly Work Plan`. Daily activity, pending tracking, travel plan, weekly review এবং monthly report সবই এর সাথে linked থাকবে। এটি তোমার existing Excel and paper workflow-কে replace না করে, digital এবং monitorable রূপে recreate করবে।

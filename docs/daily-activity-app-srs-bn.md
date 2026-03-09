# Software Requirements Specification (SRS)

## Project Title
Daily Activity, Work Plan, and Monthly Reporting Web App for PRAAN

## Document Info
- Version: 1.0
- Date: 9 March 2026
- Prepared from: provided daily register template image/PDF, February 2026 monthly report sample, and the user's workflow description
- Note: a separate work-plan file was not available in the provided inputs; the work-plan module below is designed from the described business process

## 1. Purpose
এই SRS-এর উদ্দেশ্য হলো PRAAN-এর জন্য এমন একটি মোবাইল-রেসপনসিভ, app-like web application define করা, যেখানে:
- প্রত্যেক user মাসিক work plan জমা দিতে পারবে
- প্রতিদিন digital daily activity sheet পূরণ করতে পারবে
- system work plan অনুযায়ী আজকের planned task, pending task, overdue task দেখাবে
- admin/supervisor সবার activity, pending কাজ, monthly output দেখতে পারবে
- daily ও monthly report print/export করা যাবে
- month-end report তৈরিতে system draft সহায়তা করবে
- পুরো system Cloudflare-এ host করা যাবে

## 2. Business Context and Problem Statement
বর্তমানে daily activity register আলাদা template-এ পূরণ করতে হয়, monthly report আলাদা document-এ তৈরি করতে হয়, এবং work plan ও actual কাজের মধ্যে continuity কম থাকে। এর ফলে:
- একই তথ্য একাধিকবার লিখতে হয়
- গত দিনের pending task track করা কঠিন
- মাস শেষে report তৈরিতে বেশি সময় লাগে
- admin-এর জন্য consolidated monitoring কঠিন
- mobile থেকে entry করা ঝামেলাপূর্ণ
- print-friendly কিন্তু searchable/reportable না

## 3. Product Vision
একটি unified productivity and reporting platform, যেখানে monthly planning, daily execution, pending tracking, approval, reporting এবং print/export এক জায়গায় হবে।

## 4. Goals
- manual daily sheet কে digital, searchable, printable system-এ রূপান্তর করা
- work plan বনাম actual কাজ visible করা
- pending task carry-forward automation আনা
- monthly report preparation time উল্লেখযোগ্যভাবে কমানো
- mobile এবং laptop উভয় device-এ fast data entry নিশ্চিত করা
- admin monitoring ও printable archive তৈরি করা

## 5. Success Metrics
- 90%+ daily entries system-এ same-day submit হবে
- month-end monthly report draft 5 মিনিটের মধ্যে generate হবে
- manual monthly report preparation time কমে 60-80% হবে
- admin team-wise pending tasks 10 সেকেন্ডের মধ্যে filter করতে পারবে
- daily printable sheet current paper format-এর functional equivalent হবে

## 6. Stakeholders
- Staff/User: নিজের work plan, daily activity, monthly report draft manage করবে
- Supervisor/Approver: team member-এর plan/report review ও approve করবে
- Admin: সকল user, department, project, report, print/export manage করবে
- Super Admin: system settings, roles, master data, policy manage করবে

## 7. User Roles and Permissions

### 7.1 Staff/User
- নিজের profile দেখতে পারবে
- monthly work plan create/edit/submit করতে পারবে
- daily activity sheet create/edit/submit করতে পারবে
- planned task, pending task, overdue task দেখতে পারবে
- monthly report draft generate/edit/submit করতে পারবে
- নিজের past report print/export করতে পারবে

### 7.2 Supervisor/Approver
- assigned user/team-এর work plan review করতে পারবে
- approve/reject/comment করতে পারবে
- daily and monthly reports দেখতে পারবে
- pending task ও performance summary দেখতে পারবে

### 7.3 Admin
- সব user data দেখতে পারবে
- filters দিয়ে daily/monthly reports view করতে পারবে
- print/export করতে পারবে
- missing submission, pending workload, plan vs actual dashboard দেখতে পারবে
- master data manage করতে পারবে

### 7.4 Super Admin
- role matrix
- security rules
- organization settings
- report templates
- notification rules
- audit visibility

## 8. In Scope
- user authentication and role-based access
- monthly work plan creation and approval
- daily activity sheet submission
- automatic pending/carry-forward logic
- plan vs actual tracking
- monthly report draft generation
- print/export of daily sheet and monthly report
- admin dashboards and filters
- attachments for evidence/output
- mobile responsive UI with app-like navigation
- Cloudflare-compatible deployment architecture

## 9. Out of Scope
- payroll
- leave management
- attendance device integration
- full HRM suite
- accounting/budget management
- external beneficiary/client portal

## 10. Source-Based Business Requirements

### 10.1 Daily Activity Register Template
Provided template/image থেকে নিম্নলিখিত structure পাওয়া গেছে:
- date
- multiple rows of time + task description
- output section
- note section
- delivery section

System-এ এটি modern form হিসেবে capture হবে, কিন্তু print view-এ existing format-এর কাছাকাছি রাখা হবে।

### 10.2 Monthly Report Sample
Provided February 2026 monthly report sample থেকে নিম্ন sections পাওয়া গেছে:
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
- submitted by / approved by

এই structure system-generated monthly report module-এ support করতে হবে।

## 11. Key User Journeys

### 11.1 Monthly Work Plan Submission
1. user নতুন month select করবে
2. planned tasks add করবে
3. প্রতিটি task-এর expected output, target date, priority set করবে
4. pending/carry-forward task auto-suggest হবে
5. user plan submit করবে
6. supervisor approve/reject/comment করবে

### 11.2 Daily Activity Entry
1. user Today screen খুলবে
2. system আজকের planned tasks ও overdue tasks দেখাবে
3. user planned task থেকে activity add করবে অথবা ad hoc task create করবে
4. task-এর time, description, output, status, delivery flag, note পূরণ করবে
5. day-end submit করবে
6. incomplete task পরের দিনের pending list-এ carry forward হবে

### 11.3 Monthly Report Generation
1. user month select করবে
2. system ওই মাসের completed, ongoing, carry-forward data aggregate করবে
3. system monthly report draft generate করবে
4. user lesson learned/comments edit করবে
5. supervisor approve করবে
6. printable final report export হবে

### 11.4 Admin Monitoring
1. admin date range/team/project select করবে
2. submitted vs pending daily sheets দেখবে
3. employee-wise activity দেখতে পারবে
4. printable summary বা detailed report export করবে

## 12. Functional Requirements

### FR-01 Authentication and Access Control
- system must support secure login
- system should support email/password or organization SSO
- role-based access control must be enforced on every API and screen
- user account must include name, designation, department, project/team, reporting manager, active status
- inactive users cannot submit new entries

### FR-02 User Profile and Organization Setup
- admin must be able to manage departments, teams, projects, designations, work categories
- user profile must support Bangla and/or English display name
- system should support organization logo and print header configuration

### FR-03 Monthly Work Plan Module
- user must be able to create a month-specific plan
- each work-plan item must support:
  - title
  - description
  - project/category
  - expected output
  - target date or date range
  - priority
  - status
  - dependency/notes
- system must allow carry-forward of unfinished tasks from previous month
- plan submission status: draft, submitted, approved, rejected, revised
- system must keep version history of revised plans
- supervisor comments must be stored with timestamp

### FR-04 Daily Activity Sheet Module
- user must be able to create one daily sheet per date
- a daily sheet must support multiple activity rows
- each activity row must support:
  - start time
  - end time or time slot
  - task description
  - linked work-plan task (optional but recommended)
  - output summary
  - status: not started, in progress, completed, deferred, cancelled
  - delivery required flag
  - delivery completed flag
  - ad hoc flag
- sheet-level note field must exist
- system must allow save as draft and final submit
- system should support duplicate from yesterday / copy previous row / quick-add planned task
- system should allow attachment upload for evidence or deliverable

### FR-05 Pending, Overdue, and Carry-Forward Logic
- system must show today's planned tasks based on approved work plan
- system must show yesterday's unfinished tasks separately
- system must show overdue tasks with visual priority
- incomplete daily activities must be eligible for carry-forward
- user must be able to mark whether a carry-forward item is continued, postponed, or dropped
- admin/supervisor must be able to see aging of pending tasks

### FR-06 Plan vs Actual Tracking
- system must track actual work against planned tasks
- each work-plan item must show:
  - planned date
  - actual start
  - actual completion
  - completion percentage
  - pending reason if delayed
- dashboard must highlight:
  - on-track
  - due today
  - overdue
  - completed late
  - ad hoc work outside plan

### FR-07 Monthly Report Module
- system must generate a monthly report draft from daily activity data and work-plan status
- report must include:
  - project name
  - employee info
  - reporting month
  - submission date
  - completed tasks
  - ongoing tasks
  - tasks for next month
  - lesson learned
  - comments
  - submitted by / approved by
- user must be able to manually edit generated content before submission
- supervisor must be able to approve or return for revision

### FR-08 Monthly Report Assistance
- system must auto-populate completed tasks from activities marked completed within the month
- system must auto-populate ongoing tasks from tasks still in progress at month end
- system must auto-suggest next month tasks from carry-forward items and open tasks
- system should provide summary assistance for:
  - short monthly narrative
  - lesson learned draft
  - remark consolidation
- any AI-assisted/generated text must remain editable by the user before final submission

### FR-09 Print and Export
- system must provide a print-friendly daily sheet in A4 portrait mode
- printed daily sheet should resemble the current paper register in structure
- system must provide printable monthly report in current official structure
- export formats should include PDF and Excel/CSV where applicable
- admin must be able to print:
  - single user single day
  - single user date range
  - team/day consolidated report
  - monthly report per user

### FR-10 Admin Dashboard and Monitoring
- admin must be able to filter by date, user, team, department, project, status
- admin must see missing submissions
- admin must see top pending tasks and overdue items
- admin must see plan vs actual summaries
- admin must be able to open any employee's daily sheet and report
- admin must have print/export controls from dashboard

### FR-11 Approval Workflow
- work plan approval workflow must be configurable
- monthly report approval workflow must be configurable
- system should optionally support daily sheet locking after submission
- approver comments must be visible to the user

### FR-12 Notification and Reminder
- system should send in-app reminders for:
  - daily sheet not submitted
  - monthly plan due
  - monthly report due
  - task due today
  - task overdue
- email reminders are optional in phase 1 and recommended in phase 2

### FR-13 Search, Filter, and Audit Trail
- system must support full filtering on reports and task lists
- system must log create/edit/submit/approve/reject actions
- audit logs must capture actor, timestamp, entity, action

### FR-14 Localization
- system should support Bangla-first UI with English labels where necessary
- report dates must support local date formatting
- timezone must default to Asia/Dhaka

## 13. Screen/Module List
- Login
- Dashboard
- Today / My Tasks
- Daily Activity Entry Form
- Monthly Work Plan
- Pending and Carry-Forward Board
- Monthly Report Wizard
- Admin Reporting Dashboard
- User Management
- Master Data Settings
- Print Preview

## 14. Recommended UI/UX Direction
- mobile-first responsive layout
- PWA-like installable experience
- desktop sidebar + mobile bottom navigation
- quick entry components for repetitive tasks
- color-coded task states
- one-tap add from planned/pending list
- sticky save/submit action bar on mobile
- print preview separated from data-entry screen
- form wizard for monthly report

## 15. Data Model (Logical)

### 15.1 Core Entities

#### User
- id
- employee_code
- full_name
- designation
- department_id
- team_id
- email
- mobile
- role_id
- manager_user_id
- status

#### Department / Team / Project
- id
- name
- code
- active_status

#### WorkPlan
- id
- user_id
- month
- year
- version_no
- status
- submitted_at
- approved_at
- approved_by

#### WorkPlanTask
- id
- work_plan_id
- project_id
- title
- description
- expected_output
- planned_start_date
- planned_end_date
- target_date
- priority
- status
- carry_forward_from_task_id

#### DailySheet
- id
- user_id
- work_date
- note
- status
- submitted_at

#### DailyActivity
- id
- daily_sheet_id
- work_plan_task_id (nullable)
- start_time
- end_time
- task_description
- output_text
- status
- delivery_required
- delivery_done
- is_ad_hoc
- carry_forward_to_next_day

#### Attachment
- id
- entity_type
- entity_id
- file_name
- file_url
- mime_type
- uploaded_by
- uploaded_at

#### MonthlyReport
- id
- user_id
- month
- year
- generated_at
- status
- completed_tasks_snapshot
- ongoing_tasks_snapshot
- next_month_tasks_snapshot
- lessons_learned
- comments
- approved_by
- approved_at

#### ApprovalAction
- id
- entity_type
- entity_id
- action
- comment
- acted_by
- acted_at

#### AuditLog
- id
- actor_id
- action
- entity_type
- entity_id
- before_json
- after_json
- created_at

## 16. Business Rules
- একজন user প্রতি date-এ একটি daily sheet submit করতে পারবে
- final-submitted sheet normal user আর edit করতে পারবে না unless unlocked by supervisor/admin
- work plan approved না হলে task “planned” হিসেবে dashboard-এ primary source হবে না
- ad hoc task system-এ allowed হবে, তবে plan-vs-actual report-এ আলাদা mark হবে
- monthly report generation only includes data within selected reporting month
- completed tasks list only includes tasks marked completed within the month
- ongoing tasks list includes items still in progress, deferred, or overdue at month-end
- next month tasks list includes carry-forward plus manually added forward plan items

## 17. Reporting Logic

### 17.1 Daily Report Logic
- daily report = all rows entered in `DailyActivity` for a specific `DailySheet`
- printable sections:
  - header
  - date
  - time/task rows
  - output indicators
  - note
  - delivery

### 17.2 Monthly Report Logic
- completed tasks = unique tasks completed during month, with output and completion date
- ongoing tasks = tasks started but not completed by month-end
- tasks for next month = carry-forward pending items + next month planned tasks
- lesson learned/comments = user-editable narrative section

### 17.3 Admin Reports
- user-wise daily submission report
- date-wise consolidated activity report
- pending/overdue task report
- plan vs actual report
- monthly report tracker

## 18. Non-Functional Requirements

### 18.1 Performance
- normal dashboard page should load within 3 seconds on standard broadband or 4G
- form actions should respond within 1 second for common operations
- report filters up to one month of data should return within 5 seconds for normal team size

### 18.2 Responsiveness
- must support 360px mobile width and above
- must support tablet and desktop layouts
- print layout must remain clean in A4 format

### 18.3 Availability
- target uptime: 99.5% or better
- graceful error handling for failed save/export operations

### 18.4 Security
- HTTPS only
- secure session management
- password hashing if password auth is used
- role-based authorization on every server endpoint
- audit log for critical actions
- attachment access must be permission-controlled

### 18.5 Data Integrity
- no silent deletion of submitted reports
- soft delete for master data where possible
- version history for revised plans/reports

### 18.6 Backup and Recovery
- database backup/export strategy must exist
- monthly report snapshots must remain reproducible even if tasks later change

### 18.7 Accessibility
- keyboard-friendly navigation on desktop
- accessible labels for form controls
- sufficient color contrast

## 19. Recommended Cloudflare-Friendly Technical Architecture

### 19.1 Recommended Stack
- Frontend: React + Vite + TypeScript
- UI: responsive component library or custom design system
- API: Cloudflare Workers with Hono or equivalent lightweight router
- Database: Cloudflare D1
- File storage: Cloudflare R2
- Background reminders: Cloudflare Workers Cron Triggers
- Auth:
  - Option A: app-level auth with role-based sessions
  - Option B: Cloudflare Access for internal-only organizational restriction

### 19.2 Why This Fits the Requirement
- mobile responsive SPA can be served globally
- API and frontend can live in a single Cloudflare deployment flow
- structured relational data fits D1
- attachments and generated PDFs fit R2
- reminders and scheduled summaries fit Cron Triggers
- internal organization access can be additionally protected with Access

### 19.3 Suggested Deployment Topology
- custom domain: `activity.your-org-domain.com`
- frontend static assets served from Cloudflare
- `/api/*` served by Worker routes
- D1 binding for application data
- R2 bucket for uploads and exports
- optional Access policy for organization email restriction

## 20. Suggested API Domains
- `/auth/*`
- `/users/*`
- `/work-plans/*`
- `/daily-sheets/*`
- `/tasks/*`
- `/monthly-reports/*`
- `/admin/reports/*`
- `/files/*`

## 21. MVP Definition

### Phase 1 MVP
- login and roles
- user management
- monthly work plan
- daily activity sheet
- pending/carry-forward logic
- monthly report generation
- admin filters and print/export
- mobile responsive UI

### Phase 2
- richer notifications
- AI-assisted summary improvement
- analytics charts
- bulk import/export
- advanced approval chains
- offline draft sync

## 22. Acceptance Criteria
- user can submit monthly plan from mobile and desktop
- user can see today's planned and pending tasks in one screen
- user can fill daily activity with multiple rows and submit
- unfinished tasks appear next day as pending
- monthly report draft is generated from daily entries
- admin can filter all users' reports and print/export them
- system works on phone and laptop without layout break
- printable daily and monthly documents are organization-ready

## 23. Risks and Mitigations
- Risk: users continue ad hoc work outside plan
  - Mitigation: allow ad hoc entry but track separately in plan-vs-actual
- Risk: monthly report quality depends on poor daily entry quality
  - Mitigation: require output/status fields and provide review prompts
- Risk: approval bottleneck
  - Mitigation: configurable approval flow and reminder system
- Risk: print layout differs from legacy expectation
  - Mitigation: separate print template matching current register/report format

## 24. Open Questions for Final Design
- work-plan approval কি এক ধাপ নাকি multiple approval?
- daily sheet same day edit cut-off লাগবে কি?
- attachments mandatory হবে কি specific task types-এ?
- monthly report AI assistance purely optional থাকবে, নাকি default draft required?
- Bangla-only UI, নাকি bilingual UI?

## 25. Implementation Recommendation
এই SRS অনুযায়ী build শুরু করলে development order হওয়া উচিত:
1. database schema + role model
2. authentication + user management
3. monthly work plan module
4. daily activity module
5. pending logic
6. monthly report wizard
7. admin dashboards
8. print/export templates
9. reminders and polish

## 26. Reference Notes for Cloudflare Deployment
This architecture recommendation is aligned with current official Cloudflare documentation indicating that:
- Workers can serve static assets as part of the same deployment unit
- D1 is available through Worker bindings for relational queries
- R2 buckets can be bound directly to Workers for file read/write
- Cron Triggers can run scheduled Worker jobs
- production deployments are recommended on a custom domain rather than only `workers.dev`
- Access can be used to restrict internal application access where needed

## 27. Final Summary
প্রস্তাবিত systemটি একটি unified internal productivity web app হবে, যা current daily register + monthly report workflow-কে digital করবে, work plan-এর সাথে connect করবে, pending task management দেবে, এবং মাস শেষে report generation ও printing সহজ করবে। এটি mobile-first হলেও desktop-ready হবে, এবং Cloudflare stack-এ deploy করার জন্য design করা যাবে।

## 28. Reference Inputs and Deployment References

### 28.1 Provided Input References
- Daily register visual template: user-provided image and `Daily Action Schedule_2026.pdf`
- Monthly report sample: `02. Feb _Rony_ Monthly Report Feb 2026.doc`

### 28.2 Official Cloudflare References Used for Deployment Recommendation
- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Workers Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- D1 Getting Started: https://developers.cloudflare.com/d1/get-started/
- D1 Worker Binding API: https://developers.cloudflare.com/d1/worker-api/
- R2 Workers API: https://developers.cloudflare.com/r2/get-started/workers-api/
- Workers Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare Access Web Applications: https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/

# Development Task Breakdown

## Goal
এই breakdown-এর উদ্দেশ্য হলো SRS v3 থেকে development backlog তৈরি করা, যাতে implementation priority, dependency এবং deliverable পরিষ্কার থাকে।

## 1. Suggested Delivery Model
- delivery style: phased
- target approach: MVP first, then process hardening
- recommended team shape:
  - 1 product/requirement owner
  - 1 UI/UX designer
  - 1 frontend developer
  - 1 full-stack/backend developer
  - 1 QA/support person

## 2. Phase Overview

| Phase | Focus | Priority | Output |
|---|---|---|---|
| Phase 0 | Product foundation | Critical | setup, schema, auth decisions |
| Phase 1 | Work plan + approval | Critical | monthly planning core |
| Phase 2 | Daily activity + pending | Critical | execution core |
| Phase 3 | Monthly report + exports | Critical | reporting core |
| Phase 4 | KPI + dashboards | High | performance layer |
| Phase 5 | Hardening + deployment | High | production readiness |

## 3. Epic-Wise Breakdown

### Epic 0: Product Foundation
- finalize final SRS signoff
- freeze document templates:
  - monthly work plan Excel
  - daily activity print/PDF
  - monthly report Word
  - KPI summary format
- decide auth method:
  - app login only
  - app login + Cloudflare Access
- create repo and environment structure
- set naming conventions for IDs, statuses and roles

### Deliverables
- approved SRS
- template inventory
- project repo bootstrap
- environment checklist

## 4. Epic 1: Database and Backend Foundation
- create D1 schema from `database-schema-d1.sql`
- define migrations strategy
- create API folder structure
- define validation rules
- implement audit log helper
- implement file upload abstraction for R2

### Deliverables
- initial schema migration
- seed scripts for roles, admin user and template keys
- backend module skeleton

### Dependencies
- Epic 0

## 5. Epic 2: Authentication and User Management
- login screen
- user session handling
- role-based route protection
- user CRUD
- department/project master data CRUD
- manager assignment
- profile page

### Deliverables
- working login flow
- admin user management screens
- role and permission guard

### Dependencies
- Epic 1

## 6. Epic 3: Monthly Work Plan Module
- month selection flow
- auto-generate month date rows
- create work plan editor
- create travel plan editor
- work plan save draft
- submit flow
- manager review and row comment
- revision history
- print preview
- Excel export
- Excel import validator

### Deliverables
- employee work plan editor
- travel plan sub-module
- manager approval page
- work plan Excel export

### Dependencies
- Epic 2

## 7. Epic 4: Daily Activity Module
- Today page
- prefill planned rows for current date
- daily sheet create/edit
- multi-row activity entry
- delivery and note blocks
- attachment upload
- ad hoc task support
- daily submit flow
- print/PDF output

### Deliverables
- employee daily entry screen
- today dashboard widget
- daily print template

### Dependencies
- Epic 3

## 8. Epic 5: Pending and Carry-Forward Engine
- detect incomplete plan rows
- show pending board
- overdue highlighting
- carry-forward action handling
- move-to-next-month logic
- manager/admin pending filters

### Deliverables
- pending board
- carry-forward rules
- overdue reporting

### Dependencies
- Epic 4

## 9. Epic 6: Monthly Report Module
- aggregate monthly activity
- generate completed tasks
- generate ongoing tasks
- generate next month task suggestions
- add lessons learned/comments editor
- report submission workflow
- manager approval
- Word export
- PDF/print output

### Deliverables
- monthly report wizard
- report approval flow
- Word export

### Dependencies
- Epic 5

## 10. Epic 7: KPI Module
- KPI definition master
- assign KPI definitions by role/project/employee
- KPI plan generation by cycle
- manual KPI entry
- auto KPI calculation from system data
- manager review and score override
- KPI summary export

### Deliverables
- KPI definition screens
- employee KPI page
- manager KPI review page
- KPI PDF/Excel export

### Dependencies
- Epic 6

## 11. Epic 8: Dashboards and Monitoring
- employee dashboard
- manager dashboard
- admin dashboard
- missing submission report
- plan vs actual report
- KPI summary report
- export center

### Deliverables
- dashboard suite
- admin reports
- export center

### Dependencies
- Epic 7

## 12. Epic 9: Notifications and Scheduled Jobs
- reminder rules
- daily reminder job
- monthly plan due reminder
- monthly report due reminder
- KPI due reminder
- notification center

### Deliverables
- cron-backed reminder engine
- notification UI

### Dependencies
- Epic 8

## 13. Epic 10: QA, Security and Production Hardening
- role permission testing
- print/export verification against office formats
- mobile responsiveness testing
- audit log validation
- backup/export plan
- UAT feedback fixes

### Deliverables
- UAT-ready build
- bug fix release
- production checklist

### Dependencies
- Epic 9

## 14. Suggested Sprint Plan

| Sprint | Focus | Main Output |
|---|---|---|
| Sprint 0 | foundation + setup | repo, schema, auth strategy |
| Sprint 1 | users + masters | login, roles, users |
| Sprint 2 | work plan core | plan editor, travel section |
| Sprint 3 | approval + Excel | plan review, revision, Excel export |
| Sprint 4 | daily activity | today page, daily sheet, PDF print |
| Sprint 5 | pending + report | carry-forward, monthly report draft |
| Sprint 6 | KPI | scorecards and manager review |
| Sprint 7 | dashboards + notifications | manager/admin views |
| Sprint 8 | QA + launch | fixes, UAT, deployment |

## 15. Priority Matrix

### Must Have
- authentication
- user and role management
- monthly work plan
- travel plan
- approval workflow
- daily activity
- pending/carry-forward
- monthly report
- Excel/Word/PDF/Print output
- manager/admin visibility

### Should Have
- KPI module
- admin export center
- notifications
- template manager

### Could Have
- offline draft support
- analytics charts
- advanced KPI formulas
- batch document generation

## 16. Technical Work Items by Layer

### Frontend
- app shell and navigation
- responsive layout
- forms and validation
- data tables and filters
- print preview screens
- export action UI

### Backend
- auth/session
- role permissions
- CRUD APIs
- approval APIs
- report generation service
- KPI calculation service
- notification scheduler

### Data
- migrations
- seed data
- indexes
- reporting views

### Infra
- Wrangler config
- D1 and R2 provisioning
- environments
- custom domain
- access policy

## 17. Testing Checklist
- employee can complete full monthly workflow
- manager can approve/revise work plan
- daily print matches the paper layout functionally
- monthly report Word export matches sample structure
- KPI score saves and is auditable
- admin filters work correctly
- mobile screens are usable at 360px width

## 18. Recommended Implementation Order
1. Build the data model and auth first.
2. Complete work plan and approval before daily activity.
3. Complete daily activity and pending before monthly report.
4. Complete exports immediately after the module they belong to.
5. Add KPI after core reporting is stable.
6. Finish with dashboards, reminders and production hardening.

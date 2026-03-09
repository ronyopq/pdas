# Cloudflare Deployment Plan

## Purpose
এই document-এ PRAAN app-টিকে Cloudflare stack-এ deploy করার practical plan দেওয়া হয়েছে।

## 1. Recommended Architecture

```text
Browser / Mobile PWA
        |
        v
Cloudflare Worker
  |- serves React static assets
  |- handles /api/*
  |- reads/writes D1
  |- uploads/downloads R2 files
  |- runs scheduled reminders via Cron
        |
        +--> D1 (relational app data)
        +--> R2 (attachments and generated files)
```

## 2. Why This Architecture Fits
- single deployment unit for frontend + backend
- global delivery for mobile and desktop users
- structured data fits D1
- uploaded evidence and exported files fit R2
- reminders fit Workers Cron Triggers
- internal app can be protected further with Cloudflare Access

## 3. Official Cloudflare Points Confirmed
- Static assets can be deployed with Worker code in a single integrated deployment unit, and assets can be served with an `ASSETS` binding or static-assets routing behavior.
  - Source: [Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- D1 databases are bound to Workers via Wrangler config and queried through `env.<BINDING_NAME>`.
  - Source: [D1 Getting Started](https://developers.cloudflare.com/d1/get-started/)
- R2 buckets are bound to Workers through `r2_buckets` in Wrangler config.
  - Source: [Use R2 from Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- Cron Triggers run scheduled Worker jobs and execute on UTC time.
  - Source: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- Custom Domains are recommended when the Worker is the origin for a web app.
  - Source: [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- Access can be used if you want to restrict the app to internal organizational users.
  - Source: [Access HTTP applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/)

## 4. Recommended Stack
- Frontend: React + Vite + TypeScript
- API router: Hono or a minimal Worker router
- Database: Cloudflare D1
- File storage: Cloudflare R2
- Background jobs: Workers Cron Triggers
- Optional access restriction: Cloudflare Access
- Build/deploy CLI: Wrangler

## 5. Suggested App Domains
- production app: `activity.praan.org` or similar internal subdomain
- staging app: `activity-staging.praan.org`

### Recommendation
- use one Worker for the first version
- serve the SPA and `/api/*` from the same Worker

## 6. Suggested Repository Structure

```text
/src
  /client
  /server
  /shared
/migrations
/templates
/public
/docs
wrangler.jsonc
package.json
```

## 7. Environment Plan

### Local
- run React + Worker locally
- use local D1 state
- use local R2 emulation where practical

### Staging
- real D1 staging database
- real R2 staging bucket
- test custom domain
- UAT with sample users

### Production
- production D1
- production R2
- production custom domain
- Access policy if internal-only

## 8. Initial Provisioning Steps

### 8.1 Create the app
```bash
npm create cloudflare@latest praan-activity -- --framework=react
```

### 8.2 Create D1 databases
```bash
npx wrangler d1 create praan-activity-dev
npx wrangler d1 create praan-activity-prod
```

### 8.3 Create R2 buckets
```bash
npx wrangler r2 bucket create praan-activity-files-dev
npx wrangler r2 bucket create praan-activity-files-prod
```

### 8.4 Create secrets
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put APP_ENCRYPTION_KEY
```

## 9. Suggested `wrangler.jsonc` Shape

```jsonc
{
  "name": "praan-activity",
  "main": "./src/server/index.ts",
  "compatibility_date": "2026-03-09",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "praan-activity-prod",
      "database_id": "REPLACE_WITH_DATABASE_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "FILES",
      "bucket_name": "praan-activity-files-prod"
    }
  ],
  "vars": {
    "APP_NAME": "PRAAN Activity App",
    "APP_TIMEZONE": "Asia/Dhaka"
  },
  "triggers": {
    "crons": [
      "0 3 * * *",
      "0 14 * * *"
    ]
  },
  "routes": [
    {
      "pattern": "activity.praan.org",
      "custom_domain": true
    }
  ]
}
```

## 10. Cron Strategy

### Important
- Cloudflare Cron runs on UTC time
- Bangladesh time is UTC+6

### Recommended reminders
- `0 3 * * *`
  - 09:00 Bangladesh time
  - morning reminder for daily activity and pending tasks
- `0 14 * * *`
  - 20:00 Bangladesh time
  - end-of-day reminder for unsubmitted daily sheets
- `0 4 25 * *`
  - around monthly plan/report reminder window

### Suggested jobs
- missing daily sheet reminder
- overdue task reminder
- monthly work plan deadline reminder
- monthly report due reminder
- KPI review reminder

## 11. Migration Plan

### Local migration first
```bash
npx wrangler d1 execute praan-activity-dev --local --file=./docs/database-schema-d1.sql
```

### Remote migration after validation
```bash
npx wrangler d1 execute praan-activity-prod --remote --file=./docs/database-schema-d1.sql
```

### Recommended practice
- keep all schema changes in versioned migration files
- do not edit production schema manually in the dashboard unless emergency

## 12. File Storage Strategy

### Store in R2
- daily attachments
- KPI evidence files
- exported PDFs
- generated Word files
- generated Excel files
- organization logo and template assets

### Store in D1 only as metadata
- file URL
- MIME type
- uploader
- linked entity

## 13. Security Plan
- use HTTPS only
- store secrets in Wrangler secrets, not in git
- protect `/admin/*` and `/manager/*` routes by app role checks
- optionally enforce Cloudflare Access for all users
- log approvals, exports and KPI score changes

## 14. Deployment Flow

### Manual deploy
```bash
npm run build
npx wrangler deploy
```

### Recommended CI/CD
- main branch deploys to staging or production by rule
- migrations run in a controlled step before deploy
- exported template files remain versioned in git

## 15. Backup and Recovery Plan
- D1 regular logical export strategy should be defined by the team
- generated monthly reports should be stored as document snapshots
- critical templates should be versioned in git and in template metadata
- R2 file naming should be deterministic by entity and timestamp

## 16. Access Model

### App-level roles
- employee
- manager
- admin
- super_admin

### Optional Cloudflare Access use cases
- only allow PRAAN email users
- require OTP or identity provider login
- restrict staging to internal reviewers only

## 17. Production Checklist
- D1 production database created and bound
- R2 production bucket created and bound
- all secrets set
- migrations applied
- custom domain attached
- SSL active
- Access policy configured if required
- seed admin user created
- template files uploaded
- export test passed
- mobile smoke test passed

## 18. Rollout Plan
1. Launch with one pilot team.
2. Validate exports against office templates.
3. Validate manager approval process.
4. Validate KPI calculations.
5. Onboard remaining users.

## 19. Recommendation
প্রথম version-এ একটি single Cloudflare Worker, একটি D1 database, এবং একটি R2 bucket দিয়েই system চালু করা উচিত। পরে scale বাড়লে reporting/export বা heavy background tasks আলাদা Worker-এ split করা যেতে পারে। এটি source docs থেকে inferred deployment recommendation।

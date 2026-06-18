# Master Execution & Build Plan - Civil Service Exam Portal

This document details the step-by-step master plan for building the Civil Service Exam Portal. Each step contains precise sub-steps and verification criteria.

---

## Milestone 1: Project Setup & Initialization

### Step 1: Initialize Next.js Project
- **Sub-steps:**
  1. Inspect the help flag for Next.js initialization using `npx create-next-app@latest --help`.
  2. Create a Next.js workspace in the current root using:
     `npx -y create-next-app@latest ./ --typescript --src-dir --app --no-tailwind --eslint --import-alias "@/*" --use-npm --yes`
  3. Clean up the default boilerplate (delete CSS from `src/app/page.module.css` if created, replace `src/app/globals.css` contents with variables, clean up `src/app/page.tsx`).
- **Verification:**
  - Verify `package.json` contains Next.js, React, React-DOM, and TypeScript.
  - Run `npm run dev` locally and verify the app compiles and runs at `http://localhost:3000`.

### Step 2: Install Supabase Client
- **Sub-steps:**
  1. Install `@supabase/supabase-js` package.
  2. Install helper packages if needed (e.g. `lucide-react` for modern icons).
- **Verification:**
  - Inspect `package.json` to confirm `@supabase/supabase-js` is listed.

### Step 3: Configure Environment Variables
- **Sub-steps:**
  1. Create a `.env.local` file.
  2. Populate with placeholder variable keys:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ADMIN_PASSWORD=admin-pass-placeholder
     ```
- **Verification:**
  - Verify that `.env.local` is listed in `.gitignore` to prevent secret leakage.

---

## Milestone 2: Database Migration & Configuration (Supabase/PostgreSQL)

### Step 4: Run PostgreSQL Table Migrations
- **Sub-steps:**
  1. Access the Supabase SQL Editor.
  2. Execute the adapted PostgreSQL DDL schema script written in `Schema.md` to create the tables: `schools`, `agencies`, `education_records`, `employment_records`, `applicants`, `applications`, `disabilities`, and `eligibility_proofs`.
- **Verification:**
  - Verify all 8 tables are visible in the Supabase Database dashboard under the `public` schema.

### Step 5: Seed Static Tables
- **Sub-steps:**
  1. Write SQL queries to insert sample schools into the `schools` table.
  2. Write SQL queries to insert sample agencies into the `agencies` table.
- **Verification:**
  - Run query `SELECT COUNT(*) FROM schools;` and confirm it returns > 0 records.
  - Run query `SELECT COUNT(*) FROM agencies;` and confirm it returns > 0 records.

### Step 6: Configure Row Level Security (RLS) & Policies
- **Sub-steps:**
  1. For university project requirements, set simple public insert/select permissions on all tables so the application frontend can perform inserts (during submission) and lookups (during tracking).
  2. Write RLS policies for:
     - `applicants` / `applications` / `education_records` / `employment_records` / `disabilities` / `eligibility_proofs`: Enable public INSERT. Enable public SELECT based on email/applicant ID query parameters.
- **Verification:**
  - Confirm table RLS status shows configured policy access in the Supabase Auth/RLS dashboard.

---

## Milestone 3: Client Library & Types Setup

### Step 7: Instantiate Supabase Client
- **Sub-steps:**
  1. Create a helper utility in `src/lib/supabase.ts`.
  2. Initialize the client using `createClient` from `@supabase/supabase-js`, reading from environment variables.
- **Verification:**
  - Check that the client exports correctly and does not throw reference errors when imported in server or client files.

### Step 8: Declare Database Types
- **Sub-steps:**
  1. Create `src/types/database.types.ts` (or `src/types/index.ts`).
  2. Map all database columns from PostgreSQL into clean TypeScript interfaces.
- **Verification:**
  - Ensure typescript compiler flags do not show syntax errors inside the type file.

---

## Milestone 4: Global Styles & Typography

### Step 9: Establish Vanilla CSS Design Tokens
- **Sub-steps:**
  1. Edit `src/app/globals.css` with CSS Custom Properties (`--color-primary-indigo`, `--color-background`, `--color-accent-amber`, etc.) following `Design.md`.
  2. Define body fonts using standard `@import` for Google Fonts `Inter` and `Outfit`.
  3. Define global reset, typography scaling, layout wrappers, and transition classes.
- **Verification:**
  - Run `npm run build` to ensure the styles compile cleanly.

---

## Milestone 5: Page Layouts & Frontends

### Step 10: Landing Gateway Page (`src/app/page.tsx`)
- **Sub-steps:**
  1. Implement layout with main container.
  2. Render three large, highly styled CSS cards with Outfit headers:
     - **Card A: File Application** (link to `/apply`)
     - **Card B: Track Status** (link to `/track`)
     - **Card C: Admin Console** (link to `/admin`)
  3. Implement micro-hover scaling and transitions on hover.
- **Verification:**
  - Run page in browser, mouse hover over cards, and check smooth CSS transitions.

### Step 11: Applicant Registration Portal (`src/app/apply/page.tsx`)
- **Sub-steps:**
  1. Build multi-section form styled with CSS Modules or scoped CSS:
     - Personal Info
     - Educational Background (dropdown for Schools fetching from Supabase `schools` table)
     - Employment Record (optional; dropdown for Agencies fetching from Supabase `agencies` table)
     - Disabilities & Eligibility Proofs (optional list inputs)
  2. Create state hooks to track the data.
  3. Implement frontend field validation (required fields, proper formats for emails/phone numbers).
- **Verification:**
  - Check that page dynamically loads the dropdown records for schools and agencies from Supabase.

### Step 12: Business Logic Validation & Database Inserts
- **Sub-steps:**
  1. Before submitting, write check functions:
     - Query Supabase `applications` and `applicants` to see if an applicant with the same email or mobile has already registered on the same `forms_date`.
     - Check if they are registering during an active exam window.
  2. Write transaction-like sequential client inserts:
     - Insert `education_records` ➜ get returning `educational_record_id`.
     - Insert `employment_records` (if applicable) ➜ get returning `employment_record_id`.
     - Insert `applicants` (with foreign keys).
     - Insert `applications` (link applicant_id).
     - Insert `disabilities` (if any).
     - Insert `eligibility_proofs` (if any).
  3. Display success layout showing the generated Unique Applicant ID and Application Number.
- **Verification:**
  - Submit a test form. Verify that records successfully populate all relevant tables in Supabase with correct foreign keys.
  - Attempt to submit a second application with the same email on the same date and verify that the app shows a validation error blocking it.

### Step 13: Application Status Tracking Pane (`src/app/track/page.tsx`)
- **Sub-steps:**
  1. Create search container with text input.
  2. Hook up search key (Email or Application Number).
  3. Query Supabase joining `applications` and `applicants` tables.
  4. Design a clean status layout showing applicant details and their application status ("Pending", "Approved", "Rejected") represented by amber, green, or red CSS pills.
- **Verification:**
  - Enter test application number. Confirm status details load in less than 2 seconds, displaying correct information from the database.

### Step 14: Admin Dashboard & CRUD Portal (`src/app/admin/page.tsx`)
- **Sub-steps:**
  1. Implement a basic admin authentication layout (password check using `ADMIN_PASSWORD` stored in environment variables, or a simple portal credential gate).
  2. Implement search and sorting for applicant table.
  3. Render data table featuring Columns: Application No, Applicant Name, Email, Exam Applied For, Exam Date, Status.
  4. Build action buttons:
     - **Edit (Update Status/Exam info):** Modals/drawers to change status to "Approved" or "Rejected" and modify exam date/place.
     - **Delete:** Drop applicant records from Supabase (with cascade deletes).
     - **Add:** Option to manually create applications directly in the system.
- **Verification:**
  - Log in as admin. Search for an applicant.
  - Edit status to "Approved". Check the applicant status tracking page to confirm the updated status is displayed immediately.
  - Delete an applicant. Verify that CASCADE constraints delete related applicant records in `applications`, `disabilities`, and `eligibility_proofs` in Supabase.

---

## Milestone 6: Deployment & Final QA

### Step 15: Run Compilation & Linting Check
- **Sub-steps:**
  1. Run `npm run lint` and resolve any compilation or typescript errors.
  2. Run `npm run build` to verify Next.js compiles to static and server pages.
- **Verification:**
  - Build completes with a clean output.

### Step 16: Vercel Setup & GitHub Integration
- **Sub-steps:**
  1. Initialize a Git repository locally, push to GitHub.
  2. Link repository to Vercel.
  3. Add Environment variables in the Vercel dashboard (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`).
- **Verification:**
  - Confirm production URL is live and functioning with database communication.

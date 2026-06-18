# Project Initiation Document (PID) - Civil Service Exam Portal

## 1. Project Scope
The project aims to build a modern, streamlined web application for civil service exam registration and tracking. It acts as a gateway serving three primary functions:
- A public-facing portal for applicants to apply for the Civil Service Professional Exam.
- An application tracking dashboard where applicants can view their application status.
- An admin/database manager portal providing full CRUD capabilities to view, search, and manage submitted applicant profiles and their application records.

The system will use **Next.js** or a similar React-based modern framework, styled with high-end premium custom CSS, and **Supabase (PostgreSQL)** as the backend database. It will be prepared for easy deployment on **Vercel**.

## 2. Core Business / Product Objectives
- **Modernize Application Workflows:** Replatform traditional paper-based or clunky legacy exam registration into a sleek, responsive digital format.
- **Provide Transparency:** Enable applicants to check the live status of their application, reducing friction and inquiries.
- **Admin Efficiency:** Enable Database Managers to easily inspect, edit, delete, and add applicant details in a secure database environment.
- **Database Alignment:** Perfectly mirror the data structures specified in `DATABASESCHEMA.sql` while translating them to Supabase (PostgreSQL).

## 3. Target Audience
- **General Public / Applicants:** Individuals seeking to apply for the Civil Service Professional Exam.
- **Admin / Database Managers:** University course evaluators and database managers monitoring the submissions.
*Note: This is a university project meant for course requirements, not for actual broad public deployment.*

## 4. MVP Feature List
- **Gateway Landing Page:** Highly styled entry portal directing users to the Application Form, the Status Tracking dashboard, or the Admin Portal.
- **Applicant Registration Form:** Multi-step or clean single-page form collecting applicant data matching the database schema (personal, educational, employment, disability, and eligibility details).
- **Application Tracking Pane:** Query dashboard where an applicant can enter their unique ID (e.g., `applicant_id` or `application_no` / email) to verify status (e.g., Pending, Approved, Rejected).
- **Admin Portal (CRUD):** 
  - Authenticated or secure access to the admin dashboard.
  - Data table viewing all applicants and applications.
  - CRUD operations: Edit applicant/application info, delete submissions, or manually add records.
- **Business Logic Enforcement:** Prevent an applicant from registering more than once on the same date and during an exam.

## 5. Success Metrics
- Fully functional deployment on Vercel connected to a live Supabase backend.
- Successful implementation of all tables and foreign keys mirroring `DATABASESCHEMA.sql` in PostgreSQL.
- Validation checks passing for duplicate submissions on the same date.
- Zero runtime compilation errors in local and production environments.

## 6. High-Level Constraints
- Must use Supabase as the backend database.
- Must run correctly on Vercel (Next.js/React framework is recommended).
- Must adhere to the exact relational schema defined in `DATABASESCHEMA.sql`, modified for PostgreSQL compatibility.
- An applicant may apply more than once so long as it is not on the same date and not during an active exam window.

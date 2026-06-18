# Architecture Blueprint - Civil Service Exam Portal

## 1. Core Tech Stack
- **Frontend Framework:** Next.js (App Router) with React 18+ and TypeScript.
- **Backend-as-a-Service:** Supabase (Database, Auth, Client library).
- **Hosting / CI-CD:** Vercel (connected to GitHub repository).
- **Styling:** Vanilla CSS (Global stylesheet & CSS Modules).

## 2. Target Database
- **Database Engine:** PostgreSQL (hosted on Supabase).
- **Schema Mapping:** Adaptive schema migration from MySQL (`DATABASESCHEMA.sql`) to PostgreSQL, mapping data types and key constraints correctly (e.g. converting `varchar` and `date` structures, configuring foreign key references, and setting up indexes).

## 3. Test Runners / Frameworks
- **Unit & Integration Testing:** Jest with React Testing Library for component testing.
- **E2E Testing:** Playwright (utilizing Playwright MCP server guidelines).

## 4. Code Formatting & Linting
- **Linting:** ESLint with standard Next.js and TypeScript configurations.
- **Formatting:** Prettier with:
  - 2-space indentation.
  - Semi-colons enabled.
  - Single quotes.
  - Trailing commas.
- **Strict Typing:** Strict TypeScript compilation rules (`noImplicitAny`, `strictNullChecks`, etc.).

## 5. System Architecture & Directory Structure
The application follows a conventional Next.js App Router structure:
```text
/
├── .agents/                    # Multi-agent specifications
├── app/                        # Next.js App Router directories
│   ├── layout.tsx              # Root HTML and metadata definition
│   ├── page.tsx                # Central Gateway Landing Page
│   ├── apply/                  # Applicant Registration Portal
│   │   └── page.tsx
│   ├── track/                  # Application Status Tracking Pane
│   │   └── page.tsx
│   ├── admin/                  # Admin Dashboard (CRUD Interface)
│   │   └── page.tsx
│   └── globals.css             # Core design system tokens and styles
├── components/                 # Reusable React components
│   ├── ui/                     # Basic UI blocks (buttons, inputs, tables)
│   └── shared/                 # Shared widgets (headers, layouts)
├── lib/                        # Utility functions and API clients
│   └── supabase.ts             # Supabase Client Initialization
├── types/                      # TypeScript definitions (mirroring database tables)
│   └── index.ts
├── public/                     # Static assets
├── DATABASESCHEMA.sql          # Original MySQL Schema reference
├── Schema.md                   # PostgreSQL adapted database schema
├── Architecture.md             # This blueprint document
├── Build.md                    # Master execution plan
├── Progress.md                 # Project execution tracker
└── package.json
```

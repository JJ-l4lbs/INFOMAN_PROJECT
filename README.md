# Civil Service Exam Portal (CSC-Portal)

A modern, highly responsive Next.js application built to streamline Civil Service Examination applications, status tracking, and database management. The application uses a secure architecture with **Supabase (PostgreSQL)** as the backend, styled using custom Vanilla CSS with modern typography, micro-animations, and responsive layouts.

---

## 🚀 Key Features

* **Gateway Landing Page (`/`):** Vibrant card-based dashboard with smooth CSS hover transformations, guiding users to applicant registration, application status tracking, or the administrative panel.
* **Applicant Registration Wizard (`/apply`):** A progressive 6-step wizard collecting detailed applicant profile metadata:
  1. Personal Information (including birthdate, birthplace, citizenship, mobile, etc.)
  2. Educational History (dynamically querying accredited schools from the database)
  3. Employment Record (optional, querying public service agencies)
  4. Disabilities & Eligibility proofs declarations
  5. Complete application review step prior to submission
  6. Final success page displaying the generated unique **Applicant ID** and **Application Number**
* **Application Status Tracking Pane (`/track`):** Allows applicants to search using their email address or unique Application Number. Displays a premium details layout with color-coded status badges (Pending, Approved, Rejected).
* **Admin Dashboard & CRUD Portal (`/admin`):** Authenticated database panel for evaluators and managers:
  * Full CRUD control (View, Edit, Delete, or manually Add applications directly).
  * Decoupled search, filtering, and pagination for large datasets.
  * Modular profile viewer featuring tabbed navigation (Personal, Academic, Career, etc.).
  * Cascade deletion rules configured in database and handled gracefully via clean Server Actions.
* **Modern Alert System:** Decoupled `<Toast />` notification utility replacing blocky native browser popups with sleek, floating, auto-dismissing feedback messages.

---

## 🔒 Security Architecture

To meet school project requirements without introducing complex user account registration:
1. **Row Level Security (RLS) Policies:** Enabled on all 8 backend tables. Public users are granted `SELECT` access on lookups and `INSERT` access to register profiles, but are strictly blocked from `UPDATE` or `DELETE` commands.
2. **Server Actions (`src/app/admin/actions.ts`):** Admin CRUD operations execute exclusively in server context using the privileged `SUPABASE_SERVICE_ROLE_KEY`. Passwords and requests are validated securely on the server side prior to query execution.
3. **Assertive Database Updates:** Server Actions check the result rows (via `.select()`) on every modification to guarantee failures in RLS or database authorization are captured instantly, rather than failing silently.

---

## 📁 Directory Structure

```text
/
├── app/                        # Next.js App Router directories
│   ├── page.tsx                # Central Gateway Landing Page
│   ├── apply/                  # Applicant Registration Portal
│   │   ├── page.tsx            # Step-manager presenter view
│   │   ├── hooks/
│   │   │   └── useApplyForm.ts # State, caching, and validation custom hook
│   │   └── components/         # Wizard step forms (PersonalInfo, Education, etc.)
│   ├── track/                  # Application Status Tracking
│   ├── admin/                  # Secure Admin CRUD Portal
│   │   ├── page.tsx            # Main dashboard presenter
│   │   ├── actions.ts          # Server-only CRUD database callbacks
│   │   ├── hooks/
│   │   │   └── useAdminDashboard.ts # Auth, pagination, and filter hook
│   │   └── components/         # Sub-components (LoginGate, CreateModal, EditModal, etc.)
│   └── globals.css             # Main styling, typography, and color variables
├── components/                 # Global shared components
│   └── Toast.tsx               # Auto-dismissing toast notification alert
├── lib/                        # Third-party instantiations
│   └── supabase.ts             # Supabase Client configuration
├── types/                      # TypeScript database interfaces
│   └── index.ts
├── Schema.md                   # PostgreSQL adapted database schema documentation
├── Architecture.md             # Systems architecture and file line counts tracker
├── Build.md                    # Detailed step-by-step master execution plan
└── Progress.md                 # Project progress ledger
```

---

## 🛠️ Installation & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/JJ-l4lbs/INFOMAN_PROJECT.git
cd "INFOMAN PROJECT"
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file at the root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-restricted-service-role-key
ADMIN_PASSWORD=your-secure-admin-password
```

### 3. Database Setup
1. Create a Supabase project.
2. In the Supabase **SQL Editor**, run the DDL schema script in Schema.md. This establishes the 8 tables and configures indexes, CASCADE deletes, and Row Level Security.
3. Seed the tables. Run the python seeder script locally to populate the static lookups and generate mock applicants:
   ```bash
   python populate_supabase.py
   ```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the application.

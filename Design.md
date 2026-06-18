# Design Specification Document - Civil Service Exam Portal

## 1. Targeted Design
This project utilizes a responsive, clean, grid-based layout that functions seamlessly on desktop, tablet, and mobile displays. The interface comprises four major views/pages:
- **Landing Gateway:** A centralized portal welcoming users with clean card-based links to the applicant portal, application tracking system, and admin/database manager login.
- **Application Portal (Form):** A modern multi-step or clean sectional form structured to prevent overwhelm. Form sections include:
  - Personal Information
  - Educational Background
  - Employment Record (if applicable)
  - Eligibility & Disabilities
- **Applicant Status Tracking Pane:** A simple, high-visibility dashboard where users input their identifier (e.g., email or applicant ID) to retrieve status logs containing progress indicators (e.g., Pending ➜ Under Review ➜ Approved/Rejected).
- **Admin Dashboard:** A robust tabular database view with clear pagination, search/filter bars, and edit/delete overlay forms for full CRUD control.

## 2. Design Philosophy
- **Modern Minimalist / Clean UI:** Prioritize absolute clarity, whitespace, and sharp layout hierarchies to make filling out complex forms easy.
- **Controlled Color Palette:** Use a highly curated, minimal, professional color palette. Avoid color clutter:
  - **Background:** Crisp white (`#ffffff`) and soft background gray (`#f8fafc`) for light mode; deep charcoal (`#0f172a`) and slate (`#1e293b`) for premium dark mode contrast.
  - **Primary Accents:** Deep Indigo (`#4f46e5`) and Royal Violet (`#6366f1`) for main call-to-actions, focus states, and headers.
  - **Status Indicators:** 
    - *Pending:* Amber (`#d97706`)
    - *Approved:* Emerald (`#059669`)
    - *Rejected:* Rose (`#e11d48`)
- **Micro-Animations:** Use subtle scale-ups (e.g., `scale(1.02)`) on cards and form fields during hover/focus, smooth fade-in transitions (`transition: all 0.2s ease-in-out`), and loading spinners for submission states.

## 3. Typography
- **Primary Font:** `Inter`, Sans-Serif (imported from Google Fonts).
- **Secondary Accent Font:** `Outfit`, Sans-Serif for prominent headings and landing page titles.
- **Font Scale Hierarchy:**
  - **H1 (Hero):** 2.25rem / 36px, Bold, tracking tight (Outfit)
  - **H2 (Section titles):** 1.5rem / 24px, Semi-Bold (Outfit)
  - **H3 (Card titles):** 1.25rem / 20px, Medium (Inter)
  - **Body Text:** 1rem / 16px, Regular (Inter)
  - **Labels / Captions:** 0.875rem / 14px, Medium/Regular (Inter)

## 4. Interface Interactions
- **Focus States:** Input borders transition from cool gray (`#cbd5e1`) to active Indigo (`#4f46e5`) with a subtle `0 0 0 3px rgba(79, 70, 229, 0.15)` outline ring.
- **Buttons:** Hover effects darken the primary color and trigger a smooth transition. Disabled buttons are greyed out and show a `not-allowed` cursor.
- **Tab/View Navigation:** Active states on navigation items feature an underline transition and bolding.
- **Modals / Drawers:** Form editing overlays in the Admin dashboard slide in from the right or fade in over a semi-transparent dark backdrop (`rgba(15, 23, 42, 0.6)`).

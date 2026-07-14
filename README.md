# PICA (Project Diagnostic & Compliance Assessment)

PICA is a full-stack, enterprise-grade business diagnostic, scoring, and compliance check platform. It drives a high-conversion, multi-phase funnel designed to audit business operations across 7 key pillars, calculate diagnostic scores, identify knockout risks, and generate detailed PDF reports, complete with actionable recommendations.

The project is structured as a monorepo consisting of a Next.js frontend app and an Express/Prisma/PostgreSQL backend API.

---

## 🚀 Key Features & Funnel Flow

PICA implements a structured two-phase diagnostic funnel:

### 1. Phase 1: Business Snapshot (Free Trial)
- **Guest Capture:** Anonymous users enter basic lead details (Company name, staff headcount, industry, annual revenue, location).
- **Core Diagnostic:** Serves a dynamic 14-question survey (7 pillars × 2 questions each) tailored specifically to the computed business size (`SMALL` or `MEDIUM`).
- **Scoring & PDF Delivery:** Upon submission, the engine calculates scores, triggers knockout gates (if applicable), generates a concise **one-page PDF snapshot** via a high-performance vector-based backend PDF generator, and sends it via email.
- **Paywall Redirect:** The user is redirected to a dashboard landing page with a blurred preview of the full results, prompting them to create an account and unlock the next phase.

### 2. User Authentication & Onboarding
- **Strict Verification:** Users can only register if their email matches a completed Phase 1 assessment. Lead data (business size, headcount, revenue) is automatically mapped to their account profile at registration.
- **Session Continuity:** Sessions are snapshotted in the database, allowing users to save and resume assessments across devices.

### 3. Phase 2A: Strategic Scan (Comprehensive Paid Diagnostic)
- **Deep Assessment:** An authenticated user answers a comprehensive 70-question survey (7 pillars × 10 questions).
- **Paystack Checkout:** The diagnostic results are gated behind a payment wall. The user pays via a integrated Paystack checkout flow.
- **Full Report Generation:** Once payment is settled, the application unlocks a multi-page comprehensive PDF report detailing scores per pillar, observations, and recommendations.

### 4. Phase 2B: Deep Dive Module (Granular Unlocks)
- **Pillar-Level Focus:** Users can purchase and unlock specific operational pillars for deep diagnostic checks.
- **Custom Checklist:** Generates granular, action-oriented checklists and personalized N-day roadmap plans (e.g., 30/60/90-day task tracking).

### 5. Admin Dashboard (CMS & Settings)
- **Question Bank CMS:** Admins can create and edit questions, configure option scoring, toggle knockout flags, and decide which questions appear in the Phase 1 subset.
- **Scoring & Weights CMS:** Manage individual weights for the 7 pillars and customize color band thresholds (Red/Amber/Green) for final score interpretations.
- **Consultation Scheduler:** A custom consultation booking engine mapping sessions directly in PostgreSQL, avoiding reliance on external widget APIs.
- **Funnel Analytics:** Tracks conversion statistics: `Free Snapshot` ➔ `Account Created` ➔ `Diagnostic Started` ➔ `Diagnostic Completed` ➔ `Paid User`.

---

## 🛠️ Technology Stack

### Backend Engine (`/backend`)
- **Runtime & Language:** Node.js, TypeScript
- **Framework:** Express.js with a modular domain-driven architecture
- **ORM:** Prisma Client (PostgreSQL)
- **PDF Generation:** PDFKit (vector layout rendering, significantly faster and less memory-intensive than headless Puppeteer)
- **Transactional Mailer:** Brevo API (formerly SendInBlue)
- **File Storage:** Cloudflare R2 / S3-compatible cloud storage
- **Security:** Helmet, Express Rate Limiter, CORS allowlist, and Zod schema validations

### Frontend Client (`/my-app`)
- **Framework:** Next.js (App Router, React 19)
- **Styling:** Tailwind CSS v4, Radix UI primitives, Lucide React
- **Animations:** Framer Motion, Tailwind Animate CSS
- **Authentication:** Better Auth (JWT session management)

---

## 📁 Repository Structure & Code Navigation

```
Pica-project1/
├── backend/                   # Backend Express Engine
│   ├── prisma/                # Database migrations & Prisma schema
│   └── src/
│       ├── Config/            # Env and DB singletons
│       ├── docs/              # Swagger OpenAPI documentation
│       ├── module/            # Domain modules (controllers, services, routes, types)
│       └── service/shared/    # Shared utilities (PDF, Paystack, Brevo, storage)
├── my-app/                    # Next.js App Router Client
│   ├── app/
│   │   ├── admin/             # Admin CMS and dashboards
│   │   ├── dashboard/         # Customer diagnostic dashboard
│   │   ├── Auth/              # Registration, Login, Reset routes
│   │   └── View/              # Shared client components and questionnaire views
│   └── components/            # UI components (Radix, Shadcn)
└── scripts/                   # Developer setup & maintenance scripts
```

### Key Modules & Files:
- 🗄️ **Database Schema:** [schema.prisma](file:///C:/Users/HP/Documents/Pica-project1/backend/prisma/schema.prisma)
- 📝 **PDF Generation Logic:** [pdf.service.ts](file:///C:/Users/HP/Documents/Pica-project1/backend/src/service/shared/pdf.service.ts)
- 💳 **Paystack Payment Logic:** [paystack.service.ts](file:///C:/Users/HP/Documents/Pica-project1/backend/src/service/shared/paystack.service.ts)
- 📨 **Brevo Email Dispatcher:** [email.service.ts](file:///C:/Users/HP/Documents/Pica-project1/backend/src/service/shared/email.service.ts)
- ⚖️ **Scoring Engine:** [scoring.service.ts](file:///C:/Users/HP/Documents/Pica-project1/backend/src/module/scoring/scoring.service.ts)
- 🌐 **Express Application:** [app.ts](file:///C:/Users/HP/Documents/Pica-project1/backend/src/app.ts)

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** instance running locally or hosted

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables. Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   *Required variables include database credentials (`DATABASE_URL`), Paystack keys, Brevo API key, JWT secrets, and S3 storage keys.*
4. Initialize the database (run migrations):
   ```bash
   npx prisma migrate dev
   ```
5. Seed the database with the initial diagnostic questionnaires, pillars, and settings:
   ```bash
   npm run seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../my-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000]/ to view the application.*

---

## 📄 Key Project Documentation

The repository includes several document reviews and active worksheets outlining compliance audits and future roadmap tasks:

- 📊 **Architecture Spec & API Guide:** Detailed overview of database fields, public APIs, auth endpoints, and assessment flow. See [backend/folder-structure.md](file:///C:/Users/HP/Documents/Pica-project1/backend/folder-structure.md).
- ✅ **v3.2 Solution Compliance Audit:** Detailed status of features cross-referenced against client specification documents. See [pica_compliance_check.md](file:///C:/Users/HP/Documents/Pica-project1/pica_compliance_check.md).
- 🛡️ **Security Audit Review:** Vulnerability findings report focusing on transactional payment concurrency fixes, token hardening, and endpoint rate-limiting. See [security_audit.md](file:///C:/Users/HP/Documents/Pica-project1/security_audit.md).
- 📝 **Change Request Implementation Tracker:** Active TODO checklist detailing ongoing backend/frontend tasks. See [todo.md](file:///C:/Users/HP/Documents/Pica-project1/todo.md).
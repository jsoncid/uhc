# 🏥 UHC Healthcare Application

A multi-module healthcare management system built with React, TypeScript, and Supabase. It features a comprehensive Role-Based Access Control (RBAC) system, a queue management system, patient repository, referral management, health card management, and live document collaboration.

## ✨ Features

### 🔢 Module 1 – Queue Management System

A priority-based patient queuing system for government health offices.

| Page                       | Function                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🛠️ **Admin**               | Manage offices/windows; assign staff users to offices; configure queue priority types (Regular, Senior, PWD, Priority, Urgent, VIP) and queue statuses                                            |
| 🎟️ **Queue Generator**     | Patients select a destination office and priority category to generate and print a queue ticket/code                                                                                              |
| 📺 **Queue Display**       | Public-facing real-time board that shows which queue numbers are currently being served; uses the Web Speech API to vocally announce calls (female English voice) via Supabase Realtime broadcast |
| 👩‍💼 **Staff Queue Manager** | Staff call the next number in queue, mark tickets as served/skipped, transfer a patient to another office or window, and ping individual patients via a real-time Supabase broadcast channel      |

---

### 🔄 Module 2 – Referral Management System

A two-way patient referral system between health facilities.

| Page                             | Function                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| 📋 **Referrals**                 | Tabbed dashboard showing **Sent Referrals** and **Received Referrals** with summary metric cards |
| ➕ **Create Referral**           | Form for creating a new standard patient referral to another facility                            |
| 🩺 **Create Ob-Gyne Referral**   | Specialized referral form with additional fields for Obstetrics & Gynecology cases               |
| 🔍 **Referral Details**          | Full detail view of a sent referral and its current status                                       |
| 📥 **Incoming Referral Details** | View and accept/process referrals received from other facilities                                 |
| 🕒 **Referral History**          | Chronological history of all referral transactions                                               |

---

### 🗂️ Module 3 – Patient Repository

Centralized patient record management linked to the hospital's primary database.

| Page                        | Function                                                                                                                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 👥 **Patient List**         | Paginated, searchable, filterable table of all patient profiles; clicking a record opens an inline panel showing full patient history in either timeline or table view                                            |
| 👤 **Patient Details**      | Full demographic and medical detail view for a selected patient                                                                                                                                                   |
| 📝 **Patient Profiling**    | Create or edit patient profiles with complete demographic data; address fields are resolved hierarchically via the PSGC API (Region → Province → City/Municipality → Barangay) and include facility assignment    |
| 🏷️ **Patient Tagging**      | Links patients from the hospital's external MySQL database to the UHC Supabase repository; allows staff to search the hospital HIS, find the matching Supabase record, and create a verified link between the two |
| 🗄️ **Database Management**  | Configure and manage dynamic connections to hospital database systems (iHOMIS, iClinic); supports MySQL, PostgreSQL, MariaDB, and MSSQL with credential management, connection testing, and status toggling       |

---

### 💳 Module 4 – Health Card Management

Digital UHC health card issuance and document management.

| Page            | Function                                                                                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🙋 **Member**   | Self-service portal for health card holders: search own profile, view health card details, generate a personal QR code, capture or upload profile photo, and download/print the health card as a PDF (animated WebGL card background via OGL)                                                                                     |
| 🖥️ **Operator** | Counter operator tool: scan a member's QR code via device camera (html5-qrcode) or search by name, view full patient profile, manage categorized document folders (Basic Identification, PhilHealth, Senior/PWD, Medical Documents, Admission Requirements, etc.), upload and save documents to Supabase Storage, and tag members |

---

### 📱 Module 5 – Live Documents (Mobile Notes Integration)

Bridges the web application with a companion Android mobile app for handwritten note-taking.

| Action       | Function                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✍️ **Write** | Refreshes the Supabase session, generates a unique note ID, inserts a stub record into the `scribble_text` table, then deep-links to the Android APK via the custom scheme `noteapp://canvas` with fresh auth tokens so the user can write/scribble notes on their mobile device |
| 🔁 **Sync**  | Notes written on the mobile app are stored back into Supabase and retrievable from the web interface                                                                                                                                                                             |

### 🌐 Platform Features

- 🔐 **Role-Based Access Control (RBAC)** – Fine-grained permission system with role management, module management, assignment management, and user acceptance workflow
- 📊 **Modern Dashboard** – Analytics and insights overview
- 👤 **User Profile** – Per-user profile management
- 📷 **QR Code Support** – QR generation and scanning via `html5-qrcode` and `qrcode`
- 📄 **PDF Export** – Document export via `jsPDF`

## 🛠️ Tech Stack

| Category                | Libraries                                                                   |
| ----------------------- | --------------------------------------------------------------------------- |
| ⚛️ **Frontend**         | React 19.2, TypeScript 5.5.4, Vite 5                                        |
| 🎨 **Styling**          | Tailwind CSS v4, Radix UI, Lucide React, Tabler Icons, React Icons, Iconify |
| 🗃️ **State Management** | Redux Toolkit, Zustand                                                      |
| 🔀 **Routing**          | React Router v7                                                             |
| 🗄️ **Backend**          | Supabase (PostgreSQL, Authentication, Row Level Security)                   |
| 📊 **Data & Tables**    | TanStack React Table v8                                                     |
| 📈 **Charts**           | ApexCharts, react-apexcharts                                                |
| 📅 **Date & Time**      | date-fns v4, Moment.js                                                      |
| 🧩 **UI Extras**        | Embla Carousel, SimplBar, Swiper, react-day-picker, cmdk                    |
| 📷 **QR & PDF**         | html5-qrcode, qrcode, jsPDF                                                 |
| 🧪 **Testing**          | Vitest, MSW v2                                                              |

## 📋 Prerequisites

- 🟢 Node.js v18 or higher
- 📦 npm or yarn
- ☁️ Supabase project

## 🚀 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd uhc
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
VITE_API_URL=your_backend_api_url

# Module Page UUIDs (from the modules table in Supabase)
VITE_module_1_QG_page=
VITE_module_1_SQM_page=
VITE_module_1_admin_page=
VITE_module_1_QD_page=
VITE_Module2-ReferralManagement=
VITE_Module2-IncomingRefferals=
VITE_Module2-RefferalHistory=
VITE_Module3-PatientProfiling=
VITE_Module3-PatientTagging=
VITE_Module4-HealthCardHolder=
VITE_Module4-HealthCardOperator=
VITE_MODULE_5_ID=
```

> ⚠️ **Important**: Never commit your `.env` file to version control. Keep your credentials secure.

4. 🗄️ Set up the database:

Run the SQL scripts in your Supabase SQL editor in the following order:

- `src/sql/rbac_schema.sql`
- `src/sql/rbac_rls_policies.sql`
- `src/sql/patient_profile_schema.sql`
- `src/sql/scribble_text_schema.sql`
- `src/sql/add_location_fields_to_patient_profile.sql`
- `src/sql/fix_module3_permissions.sql` (if needed)

## 📜 Available Scripts

```bash
npm run dev       # ▶️  Start development server
npm run build     # 🏗️  Type-check and build for production (outputs to dist/)
npm test          # 🧪  Run tests with Vitest
npm run lint      # 🔍  Lint with ESLint
npm run preview   # 👁️  Preview the production build locally
```

## 📁 Project Structure

```
src/
├── api/             # Static mock/seed data (blog, notes, tickets)
├── assets/          # Images and static files
├── components/      # Reusable React components
│   ├── rbac/        # RBAC management components
│   ├── apps/        # App-specific components (blog, notes, tickets)
│   ├── ui/          # Shared UI component library
│   └── shared/      # Shared layout components
├── constants/       # Module access constants and page UUIDs
├── context/         # React context providers (permissions, blog, notes, tickets)
├── hooks/           # Custom React hooks
├── layouts/         # Full and blank page layouts; module sidebar pages
├── lib/             # Supabase client, utility helpers
├── routes/          # Route definitions split per module (m1–m5) + Router
├── services/        # Supabase API service layer
├── sql/             # Database schemas and migrations
├── stores/          # Zustand and Redux stores
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (e.g., facility mapping)
└── views/           # Page-level view components
    ├── apps/        # Notes, tickets, blog, and module-3 patient views
    ├── authentication/
    ├── dashboards/
    ├── rbac/        # RBAC admin pages
    └── pages/       # User profile and general pages
```

## 🗺️ Module Routes

| Module      | Path prefix  | Key pages                                                                                       |
| ----------- | ------------ | ----------------------------------------------------------------------------------------------- |
| 🔢 Module 1 | `/module-1/` | `admin`, `queue-generator`, `queue-display`, `staff-queue-manager`                              |
| 🔄 Module 2 | `/module-2/` | `referrals`, `referrals/create`, `referrals/create-ob-gyne`, `referral-history`, `incoming/:id` |
| 🗂️ Module 3 | `/module-3/` | `patient-list`, `patient-details`, `patient-profiling`, `patient-tagging`, `database-management` |
| 💳 Module 4 | `/module-4/` | `member`, `operator`                                                                            |
| 📱 Module 5 | `/module-5/` | `mobile-notes-integration`, `live-documents`                                                    |

## 🔐 RBAC System

For detailed information about the Role-Based Access Control system, see [RBAC_README.md](RBAC_README.md).

Key RBAC pages:

- 🎭 `/rbac/roles` – Role management
- 🧩 `/rbac/modules` – Module management
- 📌 `/rbac/assignments` – Assignment management
- 👤 `/rbac/user-assignments` – User assignment management
- ✅ `/rbac/user-acceptance` – User acceptance workflow

## 🚢 Deployment

- 🌐 **Netlify**: Configuration is included in `netlify.toml`
- 🐳 **Docker**: Use the provided `dockerfile`
- ☁️ **Other platforms**: Build with `npm run build` and serve the `dist` folder

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

## 🔒 Security

- 🚫 Never commit sensitive credentials to the repository
- 🛡️ All database operations use Row Level Security (RLS)
- 🔑 Environment variables should be configured securely on your deployment platform
- 🚧 Module access is enforced via `ModuleRoute` guards backed by the RBAC permission system

## 📄 License

MIT License

Copyright (c) 2026 UHC Healthcare Application

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 💬 Support

For issues and questions, please open an issue in the repository or contact the development team.

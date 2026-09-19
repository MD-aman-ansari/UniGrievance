# 🎓 Student Complaint & Service Management System

[![Live Demo](https://img.shields.io/badge/Live_Demo-unigrievance.ai.studio-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://unigrievance.ai.studio)
[![React 19](https://img.shields.io/badge/Frontend-React_19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js & Express](https://img.shields.io/badge/Backend-Node.js_%26_Express-68A063?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_%2F_Supabase-336791?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![JWT Security](https://img.shields.io/badge/Security-JWT_%2B_bcrypt-orange?style=for-the-badge&logo=json-web-tokens)](https://jwt.io/)

> 🌐 **Live Website:** [https://unigrievance.ai.studio](https://unigrievance.ai.studio)

A modern, full-stack campus grievance redressal and service ticketing platform designed for universities and higher-education institutions. Enables students to submit, track, and resolve academic, hostel, infrastructural, and administrative complaints with end-to-end transparency, role-based authorization, and real-time status updates.

---

## 🚀 Key Features

### 👤 Role-Based Access Control (RBAC)
* **Student Portal:**
  * Self-service registration & authenticated login.
  * Interactive complaint lodging with category selection, priority tagging, location mapping, and proof attachments.
  * Personal dashboard with live resolution timeline, activity logs, and transparent status badges.
  * Direct communication thread on tickets with university administrators.
* **Administrative Command Center:**
  * Global triage board with multi-attribute filtering (category, priority, status, department).
  * One-click status transitions: `PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` / `ESCALATED`.
  * Department assignment (e.g., Civil & Hostel Maintenance, IT Services, Academic Affairs).
  * Real-time analytical KPI cards (Resolution Rate, Average Turnaround, Critical Issues).

### ⚡ Smart Persistence Architecture (Dual-Mode)
* **Supabase PostgreSQL:** Seamless integration using connection pooling (`pg.Pool`), parameterized queries, foreign key integrity, and SSL encryption.
* **Zero-Config In-Memory Fallback:** When no database connection string is provided, the platform automatically activates an in-memory state engine—allowing instant local exploration with zero setup hurdles.

### 🛡️ Enterprise Security & Hygiene
* **Password Encryption:** Salted password hashing with `bcryptjs` (10 salt rounds).
* **Cryptographic Sessions:** Stateless JSON Web Tokens (`jsonwebtoken`) with expiration controls.
* **SQL Injection Prevention:** 100% parameterized SQL statements across all query services.
* **File Upload Sanitization:** MIME-type validation and restricted upload directories using `multer`.
* **Credential Protection:** Comprehensive `.gitignore` configuration preventing accidental leakage of `.env` files, private keys, or student files.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8 | Ultra-fast single-page application with type safety |
| **Styling & UI** | Tailwind CSS v4, Lucide Icons, Motion | Clean responsive design with smooth animations |
| **Backend** | Node.js, Express 4, tsx | RESTful API server with unified dev and build pipelines |
| **Database** | PostgreSQL (Supabase) + In-Memory Fallback | Relational data model with connection pooling |
| **Auth & Security** | JWT (JSON Web Tokens), bcryptjs | Secure token-based authentication & encrypted passwords |
| **File Handling** | Multer | Multipart file uploads for complaint evidence |

---

## 📂 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # PostgreSQL pool & in-memory fallback manager
│   │   ├── controllers/
│   │   │   ├── authController.js      # Auth request handlers (login, register)
│   │   │   └── complaintsController.js# Ticket CRUD & status workflows
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verification & role guard middleware
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth routes
│   │   │   └── complaints.js      # /api/complaints routes
│   │   ├── services/
│   │   │   ├── authService.js         # Authentication logic & database queries
│   │   │   └── complaintsService.js   # Grievance processing & comment threads
│   │   ├── app.js                 # Express application & route mounts
│   │   └── server.js              # Standalone backend entry point
│   └── uploads/
│       └── attachments/           # Uploaded grievance files (git-ignored)
├── src/
│   ├── components/                # React UI components (Dashboards, Modals, Forms)
│   ├── App.tsx                    # Main client application & navigation
│   └── main.tsx                   # React DOM entry point
├── server.ts                      # Unified Express + Vite development & production server
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules for credentials and uploads
└── package.json                   # Project dependencies and scripts
```

---

## 🌐 Live Application

The project is deployed and accessible online:
👉 **[https://unigrievance.ai.studio](https://unigrievance.ai.studio)**

Experience the live instance directly to explore both the **Student Grievance Portal** and the **Administrative Command Center** using the pre-configured [Demo Credentials](#-default-demo-accounts).

---

## ⚡ Getting Started

### 1. Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **bun** / **yarn**

### 2. Clone the Repository
```bash
git clone https://github.com/<your-username>/student-complaint-system.git
cd student-complaint-system
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

Open `.env` and fill in your configuration:
```env
PORT=3000

# (Optional) Connect your PostgreSQL / Supabase Database
# If left blank, the app will automatically run in In-Memory Mode!
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require

# JWT Secret for authenticating sessions
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=7d
```

### 5. Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 🔑 Default Demo Accounts

For rapid evaluation, the following accounts are pre-configured:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `alex.rivera@campus.edu` | `student123` | Submit complaints, view personal tickets & timeline |
| **🛡️ Administrator** | `e.vance@campus.edu` | `admin123` | Full admin triage, change status, reassign department |

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

If you wish to host data in **Supabase PostgreSQL**:

1. Create a free project at [supabase.com](https://supabase.com/).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Run the schema creation script below:

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Comments / Timeline Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. Retrieve your **Connection URI** from **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection String (URI)** and paste it into your `.env` as `DATABASE_URL`.

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new student account.
* `POST /api/auth/login` — Authenticate and receive a signed JWT.
* `GET /api/auth/me` — Retrieve current authenticated profile.

### Complaints Management (`/api/complaints`)
* `GET /api/complaints` — Retrieve complaints (filtered by role).
* `POST /api/complaints` — Lodge a new complaint (supports file upload).
* `GET /api/complaints/:id` — Get detailed ticket timeline & discussion thread.
* `PATCH /api/complaints/:id/status` — *(Admin only)* Update complaint status.
* `POST /api/complaints/:id/comments` — Post a message or progress update to a ticket.

### System Health (`/api/health`)
* `GET /api/health` — Application liveness probe.
* `GET /api/health/db` — Live database connectivity status.

---

## 📦 Production Build

To compile the client frontend and bundle the backend for production deployment:

```bash
# Build Vite client assets and bundle server.ts with esbuild
npm run build

# Start the compiled production server
npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request:
1. Fork the Project (`gh repo fork`)
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

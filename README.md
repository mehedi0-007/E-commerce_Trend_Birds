# Trends Bird Limited - Backend & Dashboard Engineering Project

A production-ready, enterprise-grade E-Commerce Admin System and Permission-Aware Frontend Dashboard built for the **Trends Bird Limited Backend Intern Assignment**.

Featuring **Granular Action-Based RBAC**, **Single-In-Flight Token Refresh Interceptors**, **Visual Category Taxonomy**, **Media Upload Library**, and a **Tabbed Product & Variant Combination Engine**.

---

## 🚀 Quick Start with Docker (Recommended)

Run the entire stack (**PostgreSQL 16**, **NestJS Backend API**, and **React Nginx Dashboard**) with a single command:

```bash
docker compose up -d --build
```

### 🌐 Application Endpoints

* **Frontend Dashboard UI**: [http://localhost:5173](http://localhost:5173)
* **Interactive Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
* **Backend REST API**: [http://localhost:3000/api](http://localhost:3000/api)
* **PostgreSQL Database**: `localhost:5434`

---

## 🔑 Pre-Seeded Demo Credentials

The system seeds default roles, permissions, and test accounts on container boot. Use the convenient **One-Click Sign-In** buttons on the login screen or enter the credentials below:

| Role / Access Level | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@example.com` | `Admin123!` | Full unrestricted access to all 9 system modules & settings. |
| **Catalog Reviewer** | `catalog@example.com` | `Catalog123!` | Scoped access (`*:watch`, `*:read`). Admin modules (Users, Roles, Permissions) are hidden and protected via 403 route guards. |

---

## 🛠️ Technology Stack

* **Backend**: Node.js, NestJS (TypeScript), Prisma ORM, PostgreSQL, Passport JWT, BcryptJS, Sharp.
* **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Axios with Interceptors, Vanilla CSS Tokens (Dark Mode / Glassmorphism).
* **Containerization & Web Server**: Docker, Docker Compose, Nginx Reverse Proxy.
* **API Documentation**: Swagger / OpenAPI 3.0, OpenAPI JSON collection in `/docs/openapi_collection.json`.

---

## 🔒 Security & Authentication Architecture

1. **Dual-Token Strategy**:
   * **Access Token**: Short-lived (15 mins), held in client memory.
   * **Refresh Token**: Long-lived (7 days), stored in an `HttpOnly`, `SameSite=Lax` secure cookie.
2. **Single-In-Flight Token Refresh**:
   * The Axios client interceptor detects `401 Unauthorized` responses and queues concurrent requests while issuing a single `/auth/refresh` request.
3. **CSRF Protection**:
   * Double-submit cookie verification strategy via custom `x-csrf-token` header.
4. **Self-Escalation & Deactivation Protection**:
   * Users cannot deactivate or modify their own active account role or delete their own session.

---

## 📊 Module Compliance & Status Matrix

| Module | Feature Set | Status |
| :--- | :--- | :---: |
| **1. Auth & Session** | Login, Refresh Token Rotation, Cookie Revocation, `GET /auth/session` | ✅ 100% Complete |
| **2. Permissions** | Domain grouping, Action mapping (`watch`, `read`, `create`, `update`, `delete`) | ✅ 100% Complete |
| **3. Roles** | Role creation, **Module-by-Action Permission Matrix Grid**, Select-All per group | ✅ 100% Complete |
| **4. Users** | Account management, role assignment, active status toggle, self-deactivation protection | ✅ 100% Complete |
| **5. Media Library** | File upload, Sharp thumbnail generation, metadata editor (title, alt text) | ✅ 100% Complete |
| **6. Categories** | Visual hierarchy tree viewer, subcategory nesting, slug auto-generation, parent picker | ✅ 100% Complete |
| **7. Brands** | Brand directory, media logo selector, product reference deletion guard | ✅ 100% Complete |
| **8. Attributes** | Variant attribute types (dropdown, swatch), value tag manager with hex codes | ✅ 100% Complete |
| **9. Products Engine**| Paginated catalog, **Tabbed Product Form** (Details, Taxonomy, Media, Variant Combinations) | ✅ 100% Complete |

---

## 💻 Manual Local Development Setup

If you prefer to run the project without Docker:

### 1. Database & Environment Setup
```bash
cp .env.example .env
```
Ensure PostgreSQL is running locally on port 5434 or update `DATABASE_URL` in `.env`.

### 2. Install & Seed Backend
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### 3. Install & Start Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License & Attribution

Submitted for the **Trends Bird Limited Backend Intern Assignment**. Developed with software design best practices, clean code patterns, and complete git commit history.

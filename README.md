# 🏆 Trends Bird Limited — E-Commerce Admin & Backend API System

A production-ready, enterprise-grade E-Commerce Admin System and Permission-Aware Frontend Dashboard built for the **Trends Bird Limited Backend Intern Assignment**.

This application strictly implements all 9 system modules, granular action-based access control (RBAC), atomic database transactions, complex variant combination matrix generation, nested category taxonomy with cycle prevention, media asset management with Sharp thumbnail processing, and real-time JWT token rotation with CSRF protection.

---

## 📋 Table of Contents

1. [📌 Project Overview](#1-project-overview)
2. [🚀 MAIN STARTUP GUIDE: Docker Compose (Primary & Recommended)](#2-main-startup-guide-docker-compose-primary--recommended)
3. [💻 SECONDARY STARTUP GUIDES (Manual Local & Cloud Database)](#3-secondary-startup-guides-manual-local--cloud-database)
   - [Option A: Manual Local Development (Without Docker)](#option-a-manual-local-development-without-docker)
   - [Option B: Remote PostgreSQL (e.g. Neon Serverless)](#option-b-remote-postgresql-eg-neon-serverless)
4. [⚡ Technology Stack & System Requirements](#4-technology-stack--system-requirements)
5. [⚙️ Environment Variables (.env) Configuration Guide](#5-environment-variables-env-configuration-guide)
6. [🔑 Pre-Seeded Accounts & Demo Credentials](#6-pre-seeded-accounts--demo-credentials)
7. [🔒 Security & Access Control Architecture](#7-security--access-control-architecture)
   - [Global Guards & Permission Structure](#global-guards--permission-structure)
   - [Dual-Token Strategy & Refresh Token Rotation](#dual-token-strategy--refresh-token-rotation)
   - [CSRF Double-Submit Cookie Verification](#csrf-double-submit-cookie-verification)
   - [Self-Escalation & Account Deactivation Guards](#self-escalation--account-deactivation-guards)
8. [📊 Module-by-Module Compliance & Feature Breakdown](#8-module-by-module-compliance--feature-breakdown)
9. [🛡️ Data Integrity & Deletion Cascading Rules](#9-data-integrity--deletion-cascading-rules)
10. [📖 API Collections & Interactive Swagger UI](#10-api-collections--interactive-swagger-ui)

---

## 1. 📌 Project Overview

The system provides a unified administrative dashboard for e-commerce management. There is no customer storefront or cart processing; the entire application is focused on multi-role administration, security, catalog domain modeling, file asset management, and complex variable product inventory logic.

---
#### 🌐 Active Service Endpoints:
* **Frontend Admin Dashboard**: https://e-commerce-trend-birds.vercel.app
* **Interactive Swagger UI**: https://trend-birds-api.onrender.com/api/docs
* **Backend REST API Base**: https://trend-birds-api.onrender.com/api
---

## 2. 🚀 MAIN STARTUP GUIDE: Docker Compose (Primary & Recommended)

Docker Compose is the **primary, official, and recommended** method to run the entire application stack (**PostgreSQL 16**, **NestJS Backend API**, and **React Nginx Dashboard**) in isolated production-like containers with zero host configuration required.

### 🛠️ Step 1: Clone Repository & Create `.env`

```bash
# Clone the repository and navigate into the root project directory
cd project_TB

# Copy the sample environment file
cp .env.example .env
```

---

### 🛠️ Step 2: Launch Complete Stack via Docker Compose

Run a single command to build and launch all 3 containerized services (`trends-bird-db`, `trends-bird-api`, `trends-bird-frontend`):

```bash
docker compose up -d && docker compose logs -f
```
---
Run a single command to stop all 3 containerized services 
```bash
docker compose down
```
---

### 🛠️ Docker Container Management Commands

| Action | Command Line | Description |
| :--- | :--- | :--- |
| **Start Containers** | `docker compose up -d` | Starts all services in detached background mode. |
| **Rebuild Containers** | `docker compose up -d --build` | Forces a rebuild of Docker images after code changes. |
| **View Live Logs** | `docker compose logs -f api` | Follows realtime logs of the NestJS API container. |
| **View All Logs** | `docker compose logs -f` | Follows realtime logs of database, API, and frontend. |
| **Stop Containers** | `docker compose down` | Stops and removes all running containers and networks. |
| **Clean Reset (Wipe DB)** | `docker compose down -v` | Stops containers and deletes database volume data for a clean seed test. |
| **Check Container Status** | `docker ps` | Displays container IDs, status, ports, and health checks. |

---

## 3. 💻 SECONDARY STARTUP GUIDES (Manual Local & Cloud Database)

Use these secondary methods only if you prefer running development servers directly on your local host machine without full containerization.

### Option A: Manual Local Development (Without Docker)

#### Prerequisites
- **Node.js v20+ LTS** and npm installed on host machine.
- PostgreSQL database running (either local PostgreSQL server or containerized `docker compose up -d postgres`).

#### 1. Setup Backend & Connect Database
```bash
# In the root project directory:
cp .env.example .env

# Verify database port in .env (default local docker postgres runs on 5434):
# DATABASE_URL="postgresql://postgres:password@localhost:5434/mydb?schema=public"
```

#### 2. Install Dependencies, Apply Migrations & Seed Database
```bash
# Install backend dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push database schema tables to PostgreSQL
npx prisma db push

# Seed system permissions, default roles, and demo users
npx prisma db seed

# Launch NestJS in development watch mode
npm run start:dev
```
*Backend API will run on `http://localhost:3000/api` with Swagger UI at `http://localhost:3000/api/docs`.*

#### 3. Install & Start Frontend Dashboard
Open a new terminal window:
```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend UI will run on `http://localhost:5173`.*

---

### Option B: Cloud Deployment (Neon + Render + Vercel)

The application is completely decoupled and ready for cloud-native PaaS deployment.

#### 1. Database (Neon Serverless Postgres)
1. Provision a PostgreSQL database on Neon.
2. Copy the connection string (e.g., `postgresql://...`).

#### 2. Backend API (Render)
1. Create a **Web Service** on Render connected to your GitHub repository.
2. **Build Command:** `npm install && npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts && npm run build`
   *(This ensures tables are created and the admin user is seeded automatically on deployment).*
3. **Start Command:** `npm run start:prod`
4. **Environment Variables:**
   - `DATABASE_URL`: Your Neon connection string.
   - `JWT_SECRET` & `JWT_REFRESH_SECRET`: Secure random strings.
   - `CORS_ORIGIN`: Your exact Vercel frontend URL (e.g., `https://trends-bird-frontend.vercel.app`).

#### 3. Frontend Dashboard (Vercel)
1. Open `frontend/vercel.json` locally and update the `destination` URLs to match your live Render backend URL.
2. Create a new **Vite** project on Vercel pointed to the `frontend` root directory.
3. **Environment Variables:** Add `VITE_API_URL=/api` (The `vercel.json` rewrite will transparently proxy this to the backend).

---

## 4. ⚡ Technology Stack & System Requirements

| Domain | Technology / Spec | Description & Implementation Details |
| :--- | :--- | :--- |
| **Runtime** | **Node.js LTS (v20.x)** | Mandatory runtime environment. |
| **Database** | **PostgreSQL 16** | Mandatory database engine. Containerized via Docker or cloud-hosted. |
| **Backend Framework** | **NestJS 10.x** | Enterprise NestJS framework (TypeScript) using Express adapter. |
| **ORM & Migrations** | **Prisma ORM 5.x** | Type-safe schema definition, migrations, seeding, and transactions. |
| **Authentication** | **Passport JWT & BcryptJS** | Password hashing (rounds=10), JWT access token & HttpOnly refresh token. |
| **Validation & DTOs** | **Class-Validator & Transformer** | Global `ValidationPipe` with `whitelist: true` and `transform: true`. |
| **Media Engine** | **Sharp & Multer** | Image dimension parsing, format validation, and thumbnail generation. |
| **Frontend UI** | **React 18 & Vite** | TypeScript, Lucide Icons, Vanilla CSS design tokens (Dark mode/Glassmorphism). |
| **HTTP Interceptor** | **Axios Single-In-Flight** | Automatic `401` interceptor with single in-flight token refresh promise queue. |
| **Containers & Proxy** | **Docker & Nginx** | Multi-stage Docker builds orchestrating database, API, and static Nginx frontend. |

---

## 5. ⚙️ Environment Variables (.env) Configuration Guide

The root `.env` file controls backend configuration, security secrets, database connections, and CORS settings. A complete sample is provided in `.env.example`.

| Variable Name | Required | Default / Sample Value |
| :--- | :---: | :--- |
| `PORT` | Yes | `3000` |
| `DATABASE_URL` | Yes | `postgresql://postgres:password@localhost:5434/mydb?schema=public` |
| `JWT_SECRET` | Yes | `super-secret-jwt-key-...` |
| `JWT_REFRESH_SECRET` | Yes | `super-secret-jwt-refresh-key-...` |
| `JWT_ACCESS_EXPIRATION` | Yes | `15m` |
| `JWT_REFRESH_EXPIRATION` | Yes | `7d` |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` |
| `COOKIE_SECURE` | Optional | `false` |

---

## 6. 🔑 Pre-Seeded Accounts & Demo Credentials

The database seed script (`prisma/seed.ts`) populates all 46 system permissions, creates standard roles, and seeds two test accounts specifically designed for evaluation.

| Account Type | Email | Password | Assigned Role | Granted Access & Testing Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@example.com` | `Admin123!` | Super Administrator | Full unrestricted access to all 9 system modules, system settings, user management, and security settings. (`grantAll: true`). |
| **Catalog Reviewer** | `catalog@example.com` | `Catalog123!` | Catalog Manager | **Limited Access Test Account**. Possesses catalog read (`*:watch`, `*:read`) permissions only. Cannot access Users, Roles, or Permissions. **Use this account to verify 403 Forbidden enforcement on backend routes**. |

---

## 7. 🔒 Security & Access Control Architecture

### Global Guards & Permission Structure
Access control is enforced strictly on the backend API layer:
* **`JwtAuthGuard`**: Registered globally in `AppModule`. Every API request must carry a valid Bearer access token unless explicitly decorated with `@Public()`.
* **`PermissionsGuard`**: Evaluates declared permissions against the user's role.
* **Permission Format**: Standardized as `module:action` in lowercase (e.g., `product:create`, `category:update`, `media:upload`, `user:delete`).
* **`watch` Action**: Controls sidebar menu visibility and screen access.

### Dual-Token Strategy & Refresh Token Rotation
1. **Access Token**: Short-lived (15 minutes), delivered in JSON response body, held strictly in client memory.
2. **Refresh Token**: Long-lived (7 days), set as an `HttpOnly`, `SameSite=Lax` cookie (`refresh_token`) under path `/api/auth`.
3. **Server-Side Token Rotation**: Calling `POST /api/auth/refresh` revokes the old refresh token in PostgreSQL, generates a new refresh token, and issues a fresh access token.
4. **Server-Side Revocation (Real Logout)**: Calling `POST /api/auth/logout` invalidates the active session in PostgreSQL and clears response cookies.
5. **Inactive User Defense**: Accounts marked `active: false` are denied authentication and refresh attempts immediately.

### CSRF Double-Submit Cookie Verification
* Login and refresh endpoints set a readable `csrf_token` cookie alongside the `refresh_token` cookie.
* State-changing endpoints verifying session state (`refresh`, `logout`) enforce matching `x-csrf-token` headers against the CSRF cookie payload.

### Self-Escalation & Account Deactivation Guards
* **Self-Role Protection**: Users are barred from modifying their own role or revoking their own administrative permissions.
* **Self-Deactivation Protection**: Users cannot deactivate their own active account.
* **Last-Admin Guard**: System prevents deleting or stripping permissions from the sole administrative role.

---

## 8. 📊 Module-by-Module Compliance & Feature Breakdown

All 9 required modules are **100% Complete** and fully implemented in both the NestJS API and React Frontend:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPLIANCE STATUS: 100%                         │
├────┬───────────────┬──────────────────────────────────────────┬────────┤
│ #  │ Module        │ Functional Capabilities                  │ Status │
├────┼───────────────┼──────────────────────────────────────────┼────────┤
│ 1  │ Auth          │ Login, Refresh Token Rotation, Logout,   │   ✅   │
│    │               │ Session, CSRF, Password Hashing          │        │
│ 2  │ Permission    │ Action-based Grouping, Custom Actions,   │   ✅   │
│    │               │ Normalized Names, Search & Pagination    │        │
│ 3  │ Role          │ Permission Matrix Grid, Grant-All Opt,   │   ✅   │
│    │               │ User Count Tracking, Deletion Guards     │        │
│ 4  │ User          │ Role Assignment, Active Toggle, Self-     │   ✅   │
│    │               │ Escalation Guard, Search & Filters       │        │
│ 5  │ Media         │ Multi-file Upload, Sharp Thumbnail Gen,  │   ✅   │
│    │               │ MIME Validation, Shared Attachments      │        │
│ 6  │ Category      │ Unlimited Tree Nesting, Slug Uniqueness, │   ✅   │
│    │               │ Cycle Prevention, Parent Picker          │        │
│ 7  │ Brand         │ Directory List, Media Logo Selector,     │   ✅   │
│    │               │ Refused Delete when Products Attached    │        │
│ 8  │ Attribute     │ Display Types (Dropdown, Color Swatch),  │   ✅   │
│    │               │ Unique Values, Variant Reference Guards  │        │
│ 9  │ Product       │ Simple & Variable Products, Variant      │   ✅   │
│    │               │ Matrix Engine, SKU Uniqueness, Atomic    │        │
│    │               │ Transactions, Multi-category & Media     │        │
└────┴───────────────┴──────────────────────────────────────────┴────────┘
```

---

## 9. 🛡️ Data Integrity & Deletion Cascading Rules

| Entity / Target | Deletion & Cascade Policy | Technical Rationale & Behavior |
| :--- | :--- | :--- |
| **Brand** | **Refuse (409 Conflict)** | Deletion is rejected if products reference the brand. Products must be reassigned first. |
| **Attribute / Value** | **Refuse (409 Conflict)** | Rejects deletion if any existing product variant relies on the attribute or value to prevent variant corruption. |
| **Category** | **Refuse if Children / Products Exist** | Rejects deletion if subcategories or products reference the category. Prevents orphaned nodes. |
| **Role** | **Refuse if Users Assigned** | Rejects deletion if active users hold the role. |
| **Permission** | **Cascade Role Links** | Removing a permission safely removes its association from assigned roles. |
| **Media Asset** | **Detach Attachments & Delete File** | Unlinks product/variant media attachments, deletes file from disk storage, and removes database record. |
| **Product** | **Atomic Transaction Cascade** | Deleting a product removes its variants and media attachments within a single database transaction, but **preserves media assets in the media library** for use by other products. |

---

## 10. 📖 API Collections & Interactive Swagger UI

### 1. Interactive Swagger Explorer
Launch the backend server and open:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

* Includes `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, and `@ApiSecurity("x-csrf-token")`.
* **Pre-Populated Example Inputs**: All POST/PUT DTO request bodies feature realistic, executable JSON payload examples for one-click testing.

### 2. Exported OpenAPI JSON
The repository includes an OpenAPI 3.0 specification file ready for import into Postman, Insomnia, or Thunder Client:
📁 `docs/openapi_collection.json`

---

## 📄 License & Evaluation Notes

This project is submitted for the **Trends Bird Limited Backend Intern Assignment**. Built adhering to clean architecture, full input validation, predictable exception handling, atomic data operations, and git version control best practices.

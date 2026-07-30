# 🛒 Trends Bird Limited — E-Commerce Admin Backend

> A high-performance, enterprise-grade NestJS administration backend for an e-commerce platform. Features dynamic Role-Based Access Control (RBAC), multi-stage Docker containerization, Prisma 7 PostgreSQL ORM with driver-adapter pooling, shared media asset processing with Sharp thumbnailing, recursive category trees, dynamic product attributes (swatches), SKUs, variant pricing engines, and atomic database transactions.

---

## 📋 Table of Contents
1. [Implementation Matrix & Phase Status](#-implementation-matrix--phase-status)
2. [Detailed Features Implemented](#-detailed-features-implemented)
   - [Phase 1: Authentication & Session Strategy](#1-phase-1-authentication--session-strategy)
   - [Phase 2: Access Control Engine (RBAC)](#2-phase-2-access-control-engine-rbac)
   - [Phase 3: Shared Catalog Primitives](#3-phase-3-shared-catalog-primitives)
   - [Phase 4: Products & Dynamic Attributes](#4-phase-4-products--dynamic-attributes)
3. [Tech Stack](#%EF%B8%8F-tech-stack)
4. [Database & Connection Setup Guide](#-database--connection-setup-guide)
   - [Scenario A: Local Docker PostgreSQL](#scenario-a-using-local-docker-postgresql-default)
   - [Scenario B: Cloud PostgreSQL (NeonDB / Supabase)](#scenario-b-using-cloud-postgresql-neondb--supabase)
5. [Project Starting & Execution Guide](#-project-starting--execution-guide)
   - [Running with Docker Compose](#method-1-running-with-docker-compose-recommended)
   - [Running Locally on Host Machine](#method-2-running-locally-on-host-machine-npm-run-dev)
6. [Seeded Default Accounts & Credentials](#-seeded-default-accounts--credentials)
7. [Comprehensive API Route Reference](#-comprehensive-api-route-reference)

---

## 📊 Implementation Matrix & Phase Status

| Phase | Description | Status | Highlights |
| :--- | :--- | :---: | :--- |
| **Phase 1: Foundation & Auth** | Dual-Token JWT, Refresh Rotation, HttpOnly Cookies | ✅ **Complete** | Access (15m), Refresh (7d) rotation, Inactive account block, CSRF support |
| **Phase 2: Access Control Engine** | Role-Based Access Control (RBAC) & Protections | ✅ **Complete** | Declarative `@Permissions()` guards, Self-Lockout & Self-Escalation guards |
| **Phase 3: Catalog Primitives** | Media Assets, Sharp Thumbnailer, Category Hierarchy | ✅ **Complete** | Sharp 300x300 WebP thumbnailer, $O(N)$ Category tree, cycle rejection, Brands |
| **Phase 4: Products & Attributes** | Dynamic Swatches, SKUs, Variants & Pricing Rules | ✅ **Complete** | Simple vs. Variable rules, SKU uniqueness, thumbnail limits, `prisma.$transaction` |

---

## 🚀 Detailed Features Implemented

### 1. Phase 1: Authentication & Session Strategy
* **Dual-Token Security Architecture**:
  * **Access Token**: Short-lived JWT (15 mins) passed in the `Authorization: Bearer <token>` header.
  * **Refresh Token**: Long-lived JWT (7 days), cryptographically hashed in DB (`User.refreshTokenHash`), rotated on every refresh, delivered in `HttpOnly` secure cookies.
  * **CSRF Protection**: Issued alongside cookies and validated via `x-csrf-token` header.
* **Server-Side Revocation**: Logout clears `refreshTokenHash` from database.
* **Session Verification**: `GET /api/auth/session` returns user identity, assigned role, and a flat array of granted permission strings.
* **Generic Error Masking**: Login failures return `401 Unauthorized` ("Invalid email or password") without exposing credential existence.

### 2. Phase 2: Access Control Engine (RBAC)
* **Fine-Grained Permissions**: 41+ granular permissions mapped to module action pairs (e.g. `user:read`, `product:create`, `role:update`).
* **Declarative Guards**: Global `PermissionsGuard` and `JwtAuthGuard` enforcing RBAC on endpoints decorated with `@Permissions('module:action')`.
* **Self-Lockout Protection**: Prevents revoking `role:update` or `role:delete` from the final active administrative role.
* **Self-Escalation Protection**: Prevents users from modifying their own `roleId` or `active` status.

### 3. Phase 3: Shared Catalog Primitives
* **Shared Media Library (`/api/media`)**:
  * Single and multi-file batch upload (`POST /api/media/upload`, `POST /api/media/upload-multiple`).
  * Automated 300x300 `.webp` thumbnail generation via `sharp`.
  * Safe disk + database cleanup on deletion.
* **Category Tree & Cycle Prevention (`/api/categories`)**:
  * Hierarchical tree builder (`GET /api/categories/tree`).
  * Ancestor traversal algorithm rejecting cyclic category loops with `400 Bad Request`.
  * Deletion guard rejecting category removal if subcategories or products exist (`409 Conflict`).
* **Brand Management (`/api/brands`)**:
  * Full CRUD, slug auto-generation, media logo association, and product deletion guards.

### 4. Phase 4: Products & Dynamic Attributes
* **Dynamic Attributes & Swatches (`/api/attributes`)**:
  * Attributes: `dropdown`, `radio`, `checkbox`, `colour_swatch` (Hex codes), `image_swatch` (Media refs).
  * Usage guard: Refuses deletion of attribute/value if used in product variants (`409 Conflict`).
* **Product Engine (`/api/products`)**:
  * **Simple Products** (`hasVariants = false`): Pricing/stock at product root level; variants array must be empty.
  * **Variable Products** (`hasVariants = true`): Pricing/stock set per variant; root price/stock set to `null`.
  * **SKU & Slug Uniqueness**: Global uniqueness enforced across all products and variants (`409 Conflict`).
  * **Pricing Constraints**: Validates `salePrice <= price`, positive prices, and non-negative stock.
  * **Variant Collision Protection**: Rejects duplicate variant attribute combinations on the same product.
  * **Thumbnail Rule**: Enforces at most 1 thumbnail per product/variant.
  * **Atomic Database Transactions**: All multi-table updates wrapped inside `prisma.$transaction`.

---

## 🛠️ Tech Stack

* **Framework**: NestJS 10 (Node.js 20 Alpine)
* **Language**: TypeScript (Strict Mode)
* **Database**: PostgreSQL 16
* **ORM**: Prisma 7 (`@prisma/client` & `@prisma/adapter-pg`)
* **Image Processing**: `sharp`
* **File Uploads**: Multer (`@nestjs/platform-express`)
* **Security**: `passport-jwt`, `bcryptjs`, `cookie-parser`, `class-validator`
* **Containerization**: Docker & Docker Compose

---

## 🗄 Database & Connection Setup Guide

The application supports both **Local Docker PostgreSQL** and **Cloud PostgreSQL (NeonDB / Supabase)**.

### Scenario A: Using Local Docker PostgreSQL (Default)
In `docker-compose.yaml`, the `postgres` container service runs PostgreSQL 16 on port `5434` (host) / `5432` (internal container).

* **In `.env` (for Docker environment)**:
  ```env
  DATABASE_URL="postgresql://postgres:password@postgres:5432/mydb?schema=public"
  ```
* **In `.env` (for Host machine `npm run dev`)**:
  ```env
  DATABASE_URL="postgresql://postgres:password@localhost:5434/mydb?schema=public"
  ```

---

### Scenario B: Using Cloud PostgreSQL (NeonDB / Supabase)
If you want to connect to a cloud database:

1. Update `.env` with your cloud database string:
   ```env
   DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
   ```
2. Open `docker-compose.yaml` and comment out the `postgres` service block and `depends_on` section.
3. Run `docker compose up --build`. The container will connect directly to your cloud database!

---

## 🚀 Project Starting & Execution Guide

### Method 1: Running with Docker Compose (Recommended)

Start the application, database, run migrations, and seed default accounts in one command:

```bash
npm run docker_up
```

To view backend container logs:
```bash
docker compose logs -f api
```

To stop containers and clean up volumes:
```bash
docker compose down -v
```

---

### Method 2: Running Locally on Host Machine (`npm run dev`)

1. **Copy Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Local PostgreSQL Container** (or set up local Postgres):
   ```bash
   docker compose up -d postgres
   ```

4. **Run Prisma Migrations & Seed Script**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npx tsx prisma/seed.ts
   ```

5. **Start NestJS Server in Development Mode**:
   ```bash
   npm run start:dev
   ```
   The backend server will run at `http://localhost:3000/api`.

---

## 🔑 Seeded Default Accounts & Credentials

Running database seeding generates all system permissions, roles, and two default testing accounts:

| Role | Email | Password | Granted Permissions |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@example.com` | `Admin123!` | Unrestricted System Access (`*`) |
| **Catalog Reviewer** | `catalog@example.com` | `Catalog123!` | Read-only access to Catalog (`category:read`, `product:read`) |

---

## 🗺️ Comprehensive API Route Reference

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/login` — Log in with email/password (returns JWT access token & sets refresh cookie)
* `GET  /api/auth/session` — Retrieve active session, role, and permission array
* `POST /api/auth/refresh` — Rotate access and refresh tokens
* `POST /api/auth/logout` — Revoke refresh token and clear cookies

### 🛡 Access Control (`/api/permissions`, `/api/roles`, `/api/users`)
* `GET /api/permissions` — List all permission groups and permission items
* `POST /api/permissions` — Create a custom permission group & action
* `GET /api/roles` — List roles with search, pagination, and assigned user counts
* `POST /api/roles` — Create role with permission bindings
* `PUT /api/roles/:id` — Update role details and permission bindings
* `DELETE /api/roles/:id` — Delete role (protected against active user assignment)
* `GET /api/users` — Paginated user search with role and status filtering
* `POST /api/users` — Create user account
* `PUT /api/users/:id` — Update user details and role
* `PATCH /api/users/:id/status` — Toggle user active status

### 📦 Catalog Primitives (`/api/media`, `/api/categories`, `/api/brands`)
* `POST /api/media/upload` — Upload single file (generates Sharp 300x300 `.webp` thumbnail)
* `POST /api/media/upload-multiple` — Batch upload up to 10 files
* `GET  /api/media` — Paginated media library list with search and type filters
* `PUT  /api/media/:id` — Edit media metadata (alt text, title)
* `DELETE /api/media/:id` — Delete media file and database record
* `GET  /api/categories/tree` — Fetch complete nested JSON category tree
* `GET  /api/categories` — Flat paginated category listing
* `POST /api/categories` — Create category (with optional parentId and imageId)
* `PUT  /api/categories/:id` — Update category (with cycle rejection algorithm)
* `DELETE /api/categories/:id` — Delete category (protected against child items)
* `GET  /api/brands` — Paginated brand list with search
* `POST /api/brands` — Create brand (with logo media attachment)
* `PUT  /api/brands/:id` — Update brand
* `DELETE /api/brands/:id` — Delete brand

### 🛍 Products & Dynamic Attributes (`/api/attributes`, `/api/products`)
* `GET  /api/attributes` — List all product attributes and swatch values
* `POST /api/attributes` — Create attribute (with swatch values: `colour_swatch`, `image_swatch`, etc.)
* `POST /api/attributes/:id/values` — Add swatch value to existing attribute
* `PUT  /api/attributes/:id` — Update attribute and values
* `DELETE /api/attributes/values/:valueId` — Delete attribute value (usage-protected)
* `DELETE /api/attributes/:id` — Delete attribute (usage-protected)
* `GET  /api/products` — Paginated product search with filters (brand, category, status, price range)
* `GET  /api/products/:id` — Read full product tree (brand, categories, media, variants, variant attributes)
* `POST /api/products` — Create simple or variable product with SKUs, variants, and media attachments
* `PUT  /api/products/:id` — Update product details, variants, and attachments
* `DELETE /api/products/:id` — Delete product and associated variants/attachments

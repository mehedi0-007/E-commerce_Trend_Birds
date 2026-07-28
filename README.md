# Trends Bird Limited - E-Commerce Admin Backend

A robust, enterprise-grade NestJS e-commerce administration backend featuring granular Role-Based Access Control (RBAC), multi-stage Docker containerization, Prisma 7 PostgreSQL ORM with driver-adapter connection pooling, media asset management with thumbnail generation, and nested category hierarchies.

---

## 🚀 Key Features Implemented

### 1. Authentication & Security (Phase 1)
* **Dual-Token Architecture**:
  * **Access Tokens**: Short-lived JWTs passed via `Authorization: Bearer <token>` header.
  * **Refresh Tokens**: Cryptographically hashed and stored in database, rotated on every refresh, passed via secure `HttpOnly` cookies.
  * **CSRF Protection**: Issued alongside refresh cookies and validated via `x-csrf-token` header.
* **Password Hashing**: Secure salted hashes powered by `bcryptjs`.
* **Session Verification**: `/api/auth/session` endpoint returning user identity and granted permissions.

### 2. Fine-Grained Access Control (RBAC) (Phase 2)
* **Dynamic Permission Engine**: Granular permissions (e.g., `user:read`, `product:create`, `role:update`) categorized into Permission Groups.
* **Declarative Route Guards**: Global `PermissionsGuard` activated via `@Permissions(...)` decorators.
* **Admin Lockout Protection**: Smart safety mechanism in `RolesService` preventing accidental revocation of administrative permissions (`role:update`) if no other active role retains access.

### 3. Shared Catalog Primitives (Phase 3)
* **Media Asset Management (`/api/media`)**:
  * **File Uploads**: Single (`POST /api/media/upload`) and batch (`POST /api/media/upload-multiple`) file uploads via Multer.
  * **Strict Validation**: MIME type whitelist (JPEG, PNG, WebP, GIF, SVG, PDF, DOCX) and 10MB size limit enforcement.
  * **Thumbnail Generation**: Automated 300x300 thumbnail creation for uploaded images using `sharp`.
  * **Asset Serving**: Local file storage under `/uploads` served statically over HTTP.
  * **Metadata Editing**: Updating alt text and title attributes, paginated listing, and safe disk/DB cleanup.
* **Category Hierarchy (`/api/categories`)**:
  * **Unlimited Nesting**: Recursive category relationships with parent-child associations.
  * **Tree Endpoint**: `GET /api/categories/tree` returning nested hierarchical JSON trees for frontend navigation.
  * **Cycle Prevention**: Algorithm detecting and blocking circular parent-child dependency loops.
  * **Slug Engine**: Automated URL-safe slug generation and collision prevention.
* **Brand Management (`/api/brands`)**:
  * Brand CRUD operations with search, pagination, status filtering (`active`), and media logo association.

### 4. Production-Ready Containerization
* **Multi-Stage Dockerfile**: Built on lightweight `node:20-alpine` separating build dependencies from the production runtime.
* **Database Health Checks**: `docker-compose.yaml` configured with `pg_isready` checks to ensure PostgreSQL database readiness before container boot.
* **Automated Startup Pipeline**: Container entrypoint runs `prisma migrate deploy` followed by `prisma db seed` prior to launching the NestJS application.

---

## 📊 Phase Execution Matrix

| Module / Phase | Status | Key Highlights |
| :--- | :---: | :--- |
| **Phase 1: Foundation & Auth** | ✅ Complete | JWT login, session, token rotation, global exception filter & logger |
| **Phase 2: Access Control** | ✅ Complete | Users, Roles, Permissions, RBAC Guards, Lockout protection |
| **Phase 3: Catalog Primitives** | ✅ Complete | Media asset library, Thumbnailer, Category Tree, Brands |
| **Phase 4: Products & Attributes** | ⏳ Planned | Core product variants, SKU management, Attributes |
| **Phase 5: Frontend Dashboard** | ⏳ Planned | Permission-aware UI dashboard |
| **Phase 6: Hardening & Testing** | ⏳ Planned | End-to-end integration tests & CI/CD pipeline |

---

## 🛠️ Tech Stack

* **Framework**: NestJS 10 (Node.js 20+)
* **Language**: TypeScript (Strict Mode)
* **Database**: PostgreSQL 16
* **ORM**: Prisma 7 (`@prisma/client` & `@prisma/adapter-pg`)
* **Image Processing**: `sharp`
* **File Uploads**: Multer (`@nestjs/platform-express`)
* **Security & Auth**: `passport-jwt`, `bcryptjs`, `cookie-parser`, `class-validator`
* **Containerization**: Docker & Docker Compose

---

## 📦 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+)
* [Docker Desktop](https://www.docker.com/) / Docker Engine

---

### Option A: Running with Docker (Recommended)

One single command builds the multi-stage image, launches PostgreSQL, applies migrations, seeds default data, and streams API logs:

```bash
npm run docker
```

To stop containers:
```bash
docker compose down
```

---

### Option B: Local Development Setup

1. **Environment Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Migration & Seeding**:
   Ensure PostgreSQL is running locally on port `5434` (or update `DATABASE_URL` in `.env`), then execute:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Launch NestJS Server**:
   ```bash
   npm run start:dev
   ```
   The API server will run at `http://localhost:3000/api`.

---

## 🔑 Seeded Accounts & Credentials

Upon database seeding, the system creates standard roles, full permissions, and default accounts:

| Role | Email | Password | Granted Permissions |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@example.com` | `Admin123!` | All permissions (`*`) |
| **Catalog Administrator** | `catalog@example.com` | `Catalog123!` | `media:*`, `category:*`, `brand:*` |

---

## 🗺️ API Route Reference

### Authentication (`/api/auth`)
* `POST /api/auth/login` - User login (returns access token & sets refresh cookie)
* `GET  /api/auth/session` - Get authenticated user profile & permissions
* `POST /api/auth/refresh` - Rotate access & refresh tokens
* `POST /api/auth/logout` - Revoke session & clear cookies

### Access Control (`/api/permissions`, `/api/roles`, `/api/users`)
* `GET /api/permissions` - List all permission groups & permissions
* `GET /api/roles` - Paginated list of system roles
* `POST /api/roles` - Create new role with assigned permissions
* `PUT /api/roles/:id` - Update role details & permission bindings
* `DELETE /api/roles/:id` - Delete role (with active user check)
* `GET /api/users` - Paginated user list with role filtering
* `POST /api/users` - Create user account and assign role
* `PUT /api/users/:id` - Update user account
* `PATCH /api/users/:id/status` - Activate / deactivate user account

### Catalog Support (`/api/media`, `/api/categories`, `/api/brands`)
* `POST /api/media/upload` - Upload single file (generates thumbnail for images)
* `POST /api/media/upload-multiple` - Upload up to 10 files in batch
* `GET  /api/media` - List media assets (with search, pagination & mimeType filter)
* `PUT  /api/media/:id` - Update media alt text and title
* `DELETE /api/media/:id` - Delete media file from disk and database
* `GET  /api/categories/tree` - Retrieve full category tree structure
* `GET  /api/categories` - Paginated list of categories
* `POST /api/categories` - Create category (with parentId & imageId)
* `PUT  /api/categories/:id` - Update category (includes cycle check)
* `DELETE /api/categories/:id` - Delete category (child subcategory check)
* `GET  /api/brands` - List brands with search and pagination
* `POST /api/brands` - Create brand (with logo media attachment)
* `PUT  /api/brands/:id` - Update brand
* `DELETE /api/brands/:id` - Delete brand

---

## 🧪 Testing & Verification

Run TypeScript compilation check:
```bash
npm run lint
```

Run production build validation:
```bash
npm run build
```

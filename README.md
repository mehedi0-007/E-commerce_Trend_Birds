# Trends Bird Limited Backend

Phase one implements the NestJS foundation, auth flow, and global access-control pipeline.

## Setup

1. Copy `.env.example` to `.env` and update the values for your PostgreSQL database and JWT secrets.
2. Install dependencies with `npm install`.
3. Generate the Prisma client with `npm run prisma:generate`.
4. Run migrations with `npm run prisma:migrate`.
5. Seed the local database with `npm run prisma:seed`.
6. Start the API with `npm run start:dev`.

## Token Strategy

- Access tokens are returned in the login and refresh responses and are sent by the client in the `Authorization: Bearer` header.
- Refresh tokens are stored in an `HttpOnly` cookie and are rotated on refresh.
- A CSRF token is issued alongside the refresh cookie and must be echoed back in the `x-csrf-token` header for refresh and logout.

## Seeded Accounts

- Admin: `admin@example.com` / `Admin123!`
- Catalog access only: `catalog@example.com` / `Catalog123!`

## Current Status

- Phase 1: complete
- Phase 2: complete
- Permission: complete
- Role: complete
- User: complete
- Media: not attempted
- Category: not attempted
- Brand: not attempted
- Attribute: not attempted
- Product: not attempted

# Step 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies required for Prisma native binary on Alpine
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client and build NestJS app
RUN npm run prisma:generate
RUN npm run build

# Step 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./

# Copy built artifacts and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

ENV NODE_ENV=production

# Entry command: Run migrations, seed DB, and start production server
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/main.js"]

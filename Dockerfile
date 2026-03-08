# Multi-stage build for Todo App

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package.json files
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies
RUN npm ci

# Stage 2: Build shared package
FROM node:22-alpine AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY packages ./packages
RUN cd packages/shared && npm run build

# Stage 3: Build API
FROM node:22-alpine AS api-builder
WORKDIR /app
COPY --from=shared-builder /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages ./packages
COPY apps/api ./apps/api
RUN cd apps/api && npx prisma generate && npm run build

# Stage 4: Build Web
FROM node:22-alpine AS web-builder
WORKDIR /app
COPY --from=shared-builder /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages ./packages
COPY apps/web ./apps/web
RUN cd apps/web && npm run build

# Stage 5: Production API
FROM node:22-alpine AS api
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/todos.db

# Создаём папку для БД
RUN mkdir -p /app/data

COPY --from=api-builder /app/apps/api/dist ./dist
COPY --from=api-builder /app/apps/api/prisma ./prisma
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=api-builder /app/packages/shared/package.json ./packages/shared/
COPY --from=api-builder /app/package*.json ./

# Копируем entrypoint отдельно (не из builder)
COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3001
CMD ["./entrypoint.sh"]

# Stage 6: Production Web — статика без nginx
FROM node:22-alpine AS web
WORKDIR /app
RUN npm install -g serve
COPY --from=web-builder /app/apps/web/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

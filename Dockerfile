# Multi-stage build for Todo App

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/*/package*.json ./apps/*/
COPY packages/*/package*.json ./packages/*/
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
COPY packages/shared/package.json ./packages/shared/
RUN cd apps/api && npx prisma generate && npm run build

# Stage 4: Build Web
FROM node:22-alpine AS web-builder
WORKDIR /app
COPY --from=shared-builder /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages ./packages
COPY apps/web ./apps/web
COPY packages/shared/package.json ./packages/shared/
RUN cd apps/web && npm run build

# Stage 5: Production API
FROM node:22-alpine AS api
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/todos.db
COPY --from=api-builder /app/apps/api/dist ./dist
COPY --from=api-builder /app/apps/api/prisma ./prisma
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/package*.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]

# Stage 6: Production Web
FROM nginx:alpine AS web
COPY --from=web-builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

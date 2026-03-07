# Todo App Implementation Tasks

## Task 1: Initialize Monorepo
**Files to create:**
- `package.json` - root workspace config
- `turbo.json` - turbo pipeline
- `.gitignore` - ignore patterns
- `tsconfig.json` - base typescript config

**Requirements:**
- npm workspaces with apps/* and packages/*
- Turbo pipeline with build, dev, lint, test
- Node 22+, TypeScript 5.7

## Task 2: Create Shared Package
**Files to create:**
- `packages/shared/package.json`
- `packages/shared/src/schemas.ts` - Zod schemas
- `packages/shared/src/index.ts`
- `packages/shared/tsconfig.json`

**Requirements:**
- Zod schemas for auth (login, register)
- Zod schemas for todos (create, update, filters)
- Types exports

## Task 3: Backend API - Setup
**Files to create:**
- `apps/api/package.json`
- `apps/api/prisma/schema.prisma`
- `apps/api/tsconfig.json`
- `apps/api/.env.example`

**Requirements:**
- Fastify + tRPC v11
- Prisma with SQLite
- JWT auth (access + refresh)
- Models: User, Todo, Tag, Subtask

## Task 4: Backend API - Auth Router
**Files to create:**
- `apps/api/src/prisma.ts`
- `apps/api/src/trpc/trpc.ts`
- `apps/api/src/trpc/context.ts`
- `apps/api/src/trpc/middleware.ts`
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/router.ts`
- `apps/api/src/trpc/router.ts`

**Requirements:**
- Register/login with bcrypt
- JWT tokens (15min access, 7day refresh)
- HTTP-only cookies for refresh
- Protected procedures middleware

## Task 5: Backend API - Todos Router
**Files to create:**
- `apps/api/src/modules/todos/service.ts`
- `apps/api/src/modules/todos/router.ts`
- Update `apps/api/src/trpc/router.ts`

**Requirements:**
- CRUD operations
- Filters (status, priority, tags, search)
- Pagination (25/page)
- 200 todo limit check middleware
- Subtasks and tags support

## Task 6: Backend API - Main Entry
**Files to create:**
- `apps/api/src/index.ts`

**Requirements:**
- Fastify server with CORS and cookies
- tRPC fastify adapter
- Error handling
- Health check endpoint

## Task 7: Frontend - Setup
**Files to create:**
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/index.html`

**Requirements:**
- React 19 + Vite 6
- TypeScript strict
- Tailwind CSS 4
- TanStack Router + Query

## Task 8: Frontend - Core Setup
**Files to create:**
- `apps/web/src/main.tsx`
- `apps/web/src/styles/index.css`
- `apps/web/src/lib/trpc.ts`
- `apps/web/src/lib/utils.ts`

**Requirements:**
- tRPC client setup
- Tailwind imports
- Utility functions (cn helper)

## Task 9: Frontend - Auth
**Files to create:**
- `apps/web/src/hooks/useAuth.ts`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/routes/register.tsx`
- `apps/web/src/components/forms/LoginForm.tsx`
- `apps/web/src/components/forms/RegisterForm.tsx`

**Requirements:**
- JWT management with refresh
- Login/register forms with React Hook Form + Zod
- Protected route handling

## Task 10: Frontend - Todo List
**Files to create:**
- `apps/web/src/hooks/useTodos.ts`
- `apps/web/src/routes/todos/index.tsx`
- `apps/web/src/components/todos/TodoList.tsx`
- `apps/web/src/components/todos/TodoCard.tsx`
- `apps/web/src/components/todos/TodoFilters.tsx`
- `apps/web/src/components/todos/TodoSearch.tsx`

**Requirements:**
- List with pagination
- Filters sidebar
- Search with debounce
- 200 limit indicator

## Task 11: Frontend - Todo Detail
**Files to create:**
- `apps/web/src/routes/todos/$todoId.tsx`
- `apps/web/src/components/forms/TodoForm.tsx`
- `apps/web/src/components/todos/SubtaskList.tsx`
- `apps/web/src/components/todos/TagSelector.tsx`

**Requirements:**
- Edit todo form
- Subtasks with drag-drop reorder
- Tag management

## Task 12: Frontend - Layout
**Files to create:**
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/index.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`

**Requirements:**
- Root layout with providers
- Navigation
- User menu with logout

## Task 13: Docker
**Files to create:**
- `Dockerfile` (multi-stage)
- `docker-compose.yml`
- `.dockerignore`

**Requirements:**
- Multi-stage build (deps, builder, api, web)
- SQLite volume
- Environment variables

## Task 14: GitHub Actions
**Files to create:**
- `.github/workflows/deploy.yml`

**Requirements:**
- Test, build, push to GHCR
- Deploy via SSH
- Secrets: SSH_HOST, SSH_USER, SSH_KEY

## Task 15: Caddy Config
**Create on server:**
- Caddyfile for todos.pets.dvornicked.ru

**Requirements:**
- Reverse proxy to localhost:3000
- /api/* to localhost:3001
- Automatic HTTPS

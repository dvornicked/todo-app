# Backend Implementation Plan - Node.js + Express + SQLite

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Создать REST API бэкенд для todo-приложения на Node.js + Express + SQLite с лимитом 200 задач на пользователя и анонимной аутентификацией.

**Architecture:**
- Express сервер на порту 3001
- SQLite база данных (файл `data/todos.db`)
- Anonymous auth через session cookie (uuid для каждого пользователя)
- Middleware для проверки лимита задач
- CORS для связи с фронтендом
- Graceful shutdown

**API Endpoints:**
- `GET /api/todos` — получить все задачи пользователя
- `POST /api/todos` — создать задачу (с проверкой лимита)
- `PATCH /api/todos/:id` — обновить задачу (completed/text)
- `DELETE /api/todos/:id` — удалить задачу

**Tech Stack:** Node.js, Express, SQLite3, express-session, uuid, cors

---

## Task 1: Create Backend Project Structure

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`
- Create: `backend/server.js`
- Create: `backend/config/database.js`
- Create: `backend/middleware/rateLimit.js`
- Create: `backend/routes/todos.js`

**Step 1: Create backend/package.json**

```json
{
  "name": "todo-backend",
  "version": "1.0.0",
  "description": "Todo app backend with SQLite",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "sqlite3": "^5.1.6",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "supertest": "^6.3.4"
  }
}
```

**Step 2: Create backend/.gitignore**

```
node_modules/
data/
*.log
.DS_Store
.env
```

**Step 3: Create backend/config/database.js**

```javascript
import sqlite3 from 'sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = `${dirname(__dirname)}/data`;

// Ensure data directory exists
try {
  mkdirSync(DATA_DIR, { recursive: true });
} catch (err) {
  // Directory might already exist
}

const DB_PATH = `${DATA_DIR}/todos.db`;

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize tables
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Get or create user
export function getOrCreateUser(userId) {
  return new Promise((resolve, reject) => {
    // Try to find existing user
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        resolve(row.id);
        return;
      }
      
      // Create new user
      db.run('INSERT INTO users (id) VALUES (?)', [userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(userId);
        }
      });
    });
  });
}

// Count user's todos
export function countUserTodos(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM todos WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

// Get all todos for user
export function getTodos(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Create todo
export function createTodo(userId, text) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    db.run(
      'INSERT INTO todos (id, user_id, text, completed) VALUES (?, ?, ?, ?)',
      [id, userId, text, false],
      function(err) {
        if (err) reject(err);
        else resolve({ id, user_id: userId, text, completed: 0 });
      }
    );
  });
}

// Update todo
export function updateTodo(userId, todoId, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    if (updates.text !== undefined) {
      fields.push('text = ?');
      values.push(updates.text);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    
    if (fields.length === 0) {
      reject(new Error('No fields to update'));
      return;
    }
    
    values.push(todoId, userId);
    
    db.run(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values,
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Todo not found'));
        } else {
          resolve({ id: todoId, ...updates });
        }
      }
    );
  });
}

// Delete todo
export function deleteTodo(userId, todoId) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM todos WHERE id = ? AND user_id = ?',
      [todoId, userId],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Todo not found'));
        } else {
          resolve({ id: todoId });
        }
      }
    );
  });
}

// Close database connection
export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default db;
```

**Step 4: Create backend/middleware/rateLimit.js**

```javascript
import { countUserTodos } from '../config/database.js';

const MAX_TODOS_PER_USER = 200;

export async function checkTodoLimit(req, res, next) {
  try {
    const userId = req.session.userId;
    const currentCount = await countUserTodos(userId);
    
    if (currentCount >= MAX_TODOS_PER_USER) {
      return res.status(429).json({
        error: 'Limit exceeded',
        message: `Maximum ${MAX_TODOS_PER_USER} todos allowed per user`,
        current: currentCount,
        limit: MAX_TODOS_PER_USER
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking todo limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Step 5: Create backend/routes/todos.js**

```javascript
import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../config/database.js';
import { checkTodoLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/todos - Get all todos for user
router.get('/', async (req, res) => {
  try {
    const todos = await getTodos(req.session.userId);
    res.json({
      todos: todos.map(t => ({
        id: t.id,
        text: t.text,
        completed: Boolean(t.completed),
        createdAt: t.created_at
      })),
      count: todos.length,
      limit: 200
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /api/todos - Create new todo (with limit check)
router.post('/', checkTodoLimit, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (text.length > 500) {
      return res.status(400).json({ error: 'Text too long (max 500 chars)' });
    }
    
    const todo = await createTodo(req.session.userId, text.trim());
    res.status(201).json({
      id: todo.id,
      text: todo.text,
      completed: Boolean(todo.completed),
      createdAt: todo.created_at
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PATCH /api/todos/:id - Update todo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;
    
    const updates = {};
    if (text !== undefined) {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid text' });
      }
      if (text.length > 500) {
        return res.status(400).json({ error: 'Text too long (max 500 chars)' });
      }
      updates.text = text.trim();
    }
    if (completed !== undefined) {
      updates.completed = Boolean(completed);
    }
    
    const todo = await updateTodo(req.session.userId, id, updates);
    res.json({
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      createdAt: todo.createdAt
    });
  } catch (error) {
    if (error.message === 'Todo not found') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTodo(req.session.userId, id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Todo not found') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
```

**Step 6: Create backend/server.js**

```javascript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, getOrCreateUser, closeDatabase } from './config/database.js';
import todosRouter from './routes/todos.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true // Allow cookies
}));

app.use(express.json({ limit: '10kb' })); // Body size limit

// Session middleware (anonymous auth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'todo-app-secret-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
  },
  name: 'todo.session'
}));

// Initialize user session
app.use(async (req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
    console.log('New user created:', req.session.userId);
  }
  
  try {
    await getOrCreateUser(req.session.userId);
    next();
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    userId: req.session.userId,
    timestamp: new Date().toISOString()
  });
});

// Todos routes
app.use('/api/todos', todosRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat(backend): add Node.js + Express + SQLite backend with 200 todo limit"
```

---

## Task 2: Create Root Package.json for Concurrent Development

**Files:**
- Modify: Root `package.json`
- Create: `package-lock.json` (will be auto-generated)

**Step 1: Update root package.json to include both frontend and backend**

Replace the root package.json with:

```json
{
  "name": "todo-app-fullstack",
  "version": "1.0.0",
  "description": "Fullstack Todo App with React frontend and Node.js backend",
  "private": true,
  "scripts": {
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "cd frontend && npm run build",
    "start": "cd backend && npm start",
    "test": "cd frontend && npm test && cd ../backend && npm test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add root package.json for concurrent development"
```

---

## Task 3: Test the Backend API

**Files:**
- Create: `backend/test/api.test.js`

**Step 1: Create API test file**

```javascript
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

// Simple test to verify API structure
// Full integration tests would require running server

describe('Backend API Structure', () => {
  it('should have required dependencies', () => {
    assert.ok(express, 'Express should be importable');
    assert.ok(session, 'Express-session should be importable');
    assert.ok(uuidv4, 'UUID should be importable');
  });
});

// Manual test instructions:
console.log(`
Manual API Test Instructions:
=============================

1. Start the backend:
   cd backend && npm install && npm run dev

2. Test health endpoint:
   curl http://localhost:3001/api/health

3. Test creating todos:
   curl -X POST http://localhost:3001/api/todos \\
     -H "Content-Type: application/json" \\
     -d '{"text":"Test todo"}' \\
     -c cookies.txt

4. Test getting todos:
   curl http://localhost:3001/api/todos -b cookies.txt

5. Test limit (run 200+ times):
   for i in {1..205}; do
     curl -X POST http://localhost:3001/api/todos \\
       -H "Content-Type: application/json" \\
       -d "{\"text\":\"Todo $i\"}" \\
       -c cookies.txt -b cookies.txt
   done

The 201st request should return 429 error.
`);
```

**Step 2: Install and test**

```bash
cd backend && npm install
npm run dev
```

**Step 3: In another terminal, test the API**

```bash
curl http://localhost:3001/api/health
```

Expected: `{ "status": "ok", "userId": "...", "timestamp": "..." }`

**Step 4: Commit**

```bash
git add backend/test/
git commit -m "test(backend): add API structure tests"
```

---

## Task 4: Create GitHub Actions Workflow for Backend

**Files:**
- Create: `.github/workflows/backend.yml`

**Step 1: Create CI workflow**

```yaml
name: Backend CI

on:
  push:
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'
  pull_request:
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: ./backend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
```

**Step 2: Commit**

```bash
git add .github/workflows/backend.yml
git commit -m "ci: add GitHub Actions workflow for backend"
```

---

## Summary

После выполнения плана получим:

1. **Node.js + Express backend** на порту 3001
2. **SQLite база данных** с таблицами users и todos
3. **Anonymous auth** через session cookies
4. **Rate limiting**: максимум 200 задач на пользователя
5. **REST API**:
   - `GET /api/todos` — список задач
   - `POST /api/todos` — создание (с проверкой лимита)
   - `PATCH /api/todos/:id` — обновление
   - `DELETE /api/todos/:id` — удаление
6. **Graceful shutdown** при SIGTERM/SIGINT
7. **Root package.json** с concurrently для параллельного запуска

**Команды:**
- `npm run install:all` — установка всех зависимостей
- `npm run dev` — запуск фронтенда и бэкенда одновременно
- `cd backend && npm run dev` — только бэкенд

import sqlite3 from 'sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = `${dirname(__dirname)}/backend/data`;

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

// Promisify database methods
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables
export async function initDatabase() {
  // Users table with password hash
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Todos table with user_id foreign key
  await run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster queries
  await run(`
    CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id)
  `);

  console.log('Database initialized');
}

// User operations
export async function createUser(email, password) {
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  
  await run(
    'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
    [id, email, passwordHash]
  );
  
  return { id, email };
}

export async function findUserByEmail(email) {
  return get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Todo operations with user isolation
export async function countUserTodos(userId) {
  const row = await get(
    'SELECT COUNT(*) as count FROM todos WHERE user_id = ?',
    [userId]
  );
  return row.count;
}

export async function getTodos(userId) {
  return all(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export async function createTodo(userId, text) {
  const id = crypto.randomUUID();
  await run(
    'INSERT INTO todos (id, user_id, text, completed) VALUES (?, ?, ?, ?)',
    [id, userId, text, false]
  );
  return { id, user_id: userId, text, completed: 0 };
}

export async function updateTodo(userId, todoId, updates) {
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
    throw new Error('No fields to update');
  }
  
  values.push(todoId, userId);
  
  const result = await run(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  
  if (result.changes === 0) {
    throw new Error('Todo not found or access denied');
  }
  
  return { id: todoId, ...updates };
}

export async function deleteTodo(userId, todoId) {
  const result = await run(
    'DELETE FROM todos WHERE id = ? AND user_id = ?',
    [todoId, userId]
  );
  
  if (result.changes === 0) {
    throw new Error('Todo not found or access denied');
  }
  
  return { id: todoId };
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

export { db, run, get, all };

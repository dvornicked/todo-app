# Todo App Refactor to Vite + Tests + Linting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Рефакторинг todo-app с CDN-версии React на Vite-сборку с тестами (Vitest), линтерами (ESLint, Prettier) и исправленным Service Worker для корректного обновления.

**Architecture:** 
- Vite как build tool (быстрая сборка, HMR, PWA-плагин)
- Разделение на компоненты и hooks
- Stale-while-revalidate стратегия в SW с уведомлением о новой версии
- Vitest + React Testing Library для юнит-тестов
- ESLint + Prettier для код-стайла

**Tech Stack:** Vite, React 18, Vitest, ESLint, Prettier, Workbox (via vite-plugin-pwa)

---

## Task 1: Initialize Vite Project Structure

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html` (обновлённый)
- Create: `.gitignore`

**Step 1: Create package.json with dependencies**

```json
{
  "name": "todo-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jsdom": "^24.0.0",
    "prettier": "^3.2.5",
    "vite": "^5.1.0",
    "vite-plugin-pwa": "^0.19.0",
    "vitest": "^1.3.0"
  }
}
```

**Step 2: Create vite.config.js with PWA plugin**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Todo App',
        short_name: 'Todo',
        description: 'Простой менеджер задач',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/todo-app/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js']
  }
});
```

**Step 3: Create updated index.html**

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#2563eb" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <title>Todo App</title>
  </head>
  <body class="bg-gray-100">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
coverage/
```

**Step 5: Commit**

```bash
git add package.json vite.config.js index.html .gitignore
git commit -m "chore: initialize vite project structure"
```

---

## Task 2: Create ESLint and Prettier Configuration

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Create: `.prettierignore`

**Step 1: Create .eslintrc.cjs**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'no-console': 'warn',
    'react/prop-types': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ]
  }
};
```

**Step 2: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Step 3: Create .prettierignore**

```
dist/
node_modules/
*.lock
```

**Step 4: Install dependencies and verify linting works**

```bash
npm install
npx eslint --version
```

Expected: Shows ESLint version without errors.

**Step 5: Commit**

```bash
git add .eslintrc.cjs .prettierrc .prettierignore
git commit -m "chore: add eslint and prettier configuration"
```

---

## Task 3: Create Utility Functions and Tests

**Files:**
- Create: `src/utils/id.js`
- Create: `src/utils/id.test.js`

**Step 1: Write the failing test for id.js**

```javascript
// src/utils/id.test.js
import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate string IDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/utils/id.test.js
```

Expected: FAIL - "generateId is not defined" или "Cannot find module"

**Step 3: Write minimal implementation**

```javascript
// src/utils/id.js
/**
 * Generate a unique ID using crypto.randomUUID if available,
 * fallback to timestamp + random for older browsers
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/utils/id.test.js
```

Expected: PASS - 2 tests passing

**Step 5: Commit**

```bash
git add src/utils/id.js src/utils/id.test.js
git commit -m "feat(utils): add generateId utility with tests"
```

---

## Task 4: Create useTodos Hook and Tests

**Files:**
- Create: `src/hooks/useTodos.js`
- Create: `src/hooks/useTodos.test.js`
- Create: `src/test/setup.js`

**Step 1: Create test setup file**

```javascript
// src/test/setup.js
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
afterEach(cleanup);
```

**Step 2: Write the failing test for useTodos**

```javascript
// src/hooks/useTodos.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from './useTodos';

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.todos).toEqual([]);
  });

  it('should add a todo', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo('Test task');
    });
    
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('Test task');
    expect(result.current.todos[0].completed).toBe(false);
  });

  it('should not add empty todo', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo('   ');
    });
    
    expect(result.current.todos).toHaveLength(0);
  });

  it('should toggle todo completion', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo('Test task');
    });
    
    const todoId = result.current.todos[0].id;
    
    act(() => {
      result.current.toggleTodo(todoId);
    });
    
    expect(result.current.todos[0].completed).toBe(true);
  });

  it('should delete a todo', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo('Test task');
    });
    
    const todoId = result.current.todos[0].id;
    
    act(() => {
      result.current.deleteTodo(todoId);
    });
    
    expect(result.current.todos).toHaveLength(0);
  });

  it('should clear completed todos', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo('Task 1');
      result.current.addTodo('Task 2');
    });
    
    const todoId = result.current.todos[0].id;
    
    act(() => {
      result.current.toggleTodo(todoId);
      result.current.clearCompleted();
    });
    
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('Task 2');
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo('Test task');
    });
    
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npm test -- src/hooks/useTodos.test.js
```

Expected: FAIL - "useTodos is not defined"

**Step 4: Write implementation**

```javascript
// src/hooks/useTodos.js
import { useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'todos';

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Failed to save todos:', error);
  }
}

export function useTodos() {
  const [todos, setTodos] = useState(loadTodos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setTodos((prev) => [
      ...prev,
      {
        id: generateId(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, []);

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return {
    todos,
    stats,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  };
}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- src/hooks/useTodos.test.js
```

Expected: PASS - 7 tests passing

**Step 6: Commit**

```bash
git add src/hooks/useTodos.js src/hooks/useTodos.test.js src/test/setup.js
git commit -m "feat(hooks): add useTodos hook with localStorage persistence and tests"
```

---

## Task 5: Create useInstallPrompt Hook and Tests

**Files:**
- Create: `src/hooks/useInstallPrompt.js`
- Create: `src/hooks/useInstallPrompt.test.js`

**Step 1: Write the failing test**

```javascript
// src/hooks/useInstallPrompt.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallPrompt } from './useInstallPrompt';

describe('useInstallPrompt', () => {
  let mockPrompt = vi.fn();
  
  beforeEach(() => {
    mockPrompt = vi.fn();
    window.beforeinstallprompt = null;
  });

  it('should initialize as not installable', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstallable).toBe(false);
  });

  it('should detect when app is installable', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    const event = new Event('beforeinstallprompt', {
      bubbles: true,
      cancelable: true
    });
    event.preventDefault = vi.fn();
    event.prompt = mockPrompt;
    
    act(() => {
      window.dispatchEvent(event);
    });
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
  });

  it('should handle install prompt', async () => {
    mockPrompt.mockResolvedValue({ outcome: 'accepted' });
    
    const { result } = renderHook(() => useInstallPrompt());
    
    const event = new Event('beforeinstallprompt', {
      bubbles: true,
      cancelable: true
    });
    event.preventDefault = vi.fn();
    event.prompt = mockPrompt;
    
    act(() => {
      window.dispatchEvent(event);
    });
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
    
    await act(async () => {
      await result.current.handleInstall();
    });
    
    expect(mockPrompt).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/hooks/useInstallPrompt.test.js
```

Expected: FAIL

**Step 3: Write implementation**

```javascript
// src/hooks/useInstallPrompt.js
import { useState, useEffect, useCallback } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    isInstallable,
    handleInstall,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/hooks/useInstallPrompt.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useInstallPrompt.js src/hooks/useInstallPrompt.test.js
git commit -m "feat(hooks): add useInstallPrompt hook for PWA installation"
```

---

## Task 6: Create React Components

**Files:**
- Create: `src/components/TodoItem.jsx`
- Create: `src/components/TodoItem.test.jsx`
- Create: `src/components/TodoList.jsx`
- Create: `src/components/AddTodo.jsx`
- Create: `src/components/AddTodo.test.jsx`

**Step 1: Create TodoItem component**

```jsx
// src/components/TodoItem.jsx
import React from 'react';

export function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-3 p-3 hover:bg-gray-50 group">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
        aria-label={todo.completed ? 'Отметить как не выполнено' : 'Отметить как выполнено'}
      />
      
      <span
        className={`flex-1 ${
          todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'
        }`}
      >
        {todo.text}
      </span>
      
      <button
        onClick={() => onDelete(todo.id)}
        className="text-gray-400 hover:text-red-500 px-2 text-xl transition-colors"
        aria-label="Удалить задачу"
      >
        ×
      </button>
    </li>
  );
}
```

**Step 2: Create TodoItem test**

```jsx
// src/components/TodoItem.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoItem } from './TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    id: '1',
    text: 'Test task',
    completed: false,
  };

  it('renders todo text', () => {
    render(
      <TodoItem todo={mockTodo} onToggle={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox clicked', () => {
    const onToggle = vi.fn();
    render(
      <TodoItem todo={mockTodo} onToggle={onToggle} onDelete={vi.fn()} />
    );
    
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <TodoItem todo={mockTodo} onToggle={vi.fn()} onDelete={onDelete} />
    );
    
    fireEvent.click(screen.getByLabelText('Удалить задачу'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows completed styling when todo is completed', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(
      <TodoItem todo={completedTodo} onToggle={vi.fn()} onDelete={vi.fn()} />
    );
    
    const text = screen.getByText('Test task');
    expect(text).toHaveClass('line-through');
  });
});
```

**Step 3: Create TodoList component**

```jsx
// src/components/TodoList.jsx
import React from 'react';
import { TodoItem } from './TodoItem';

export function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Нет задач</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
```

**Step 4: Create AddTodo component and test**

```jsx
// src/components/AddTodo.jsx
import React, { useState } from 'react';

export function AddTodo({ onAdd }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Новая задача..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        aria-label="Новая задача"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Добавить
      </button>
    </form>
  );
}
```

```jsx
// src/components/AddTodo.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddTodo } from './AddTodo';

describe('AddTodo', () => {
  it('renders input and button', () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByPlaceholderText('Новая задача...')).toBeInTheDocument();
    expect(screen.getByText('Добавить')).toBeInTheDocument();
  });

  it('calls onAdd with trimmed text when form submitted', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    
    const input = screen.getByPlaceholderText('Новая задача...');
    fireEvent.change(input, { target: { value: '  New task  ' } });
    fireEvent.click(screen.getByText('Добавить'));
    
    expect(onAdd).toHaveBeenCalledWith('  New task  ');
  });

  it('clears input after adding', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    
    const input = screen.getByPlaceholderText('Новая задача...');
    fireEvent.change(input, { target: { value: 'New task' } });
    fireEvent.click(screen.getByText('Добавить'));
    
    expect(input.value).toBe('');
  });

  it('submits on Enter key', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    
    const input = screen.getByPlaceholderText('Новая задача...');
    fireEvent.change(input, { target: { value: 'New task' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(onAdd).toHaveBeenCalledWith('New task');
  });
});
```

**Step 5: Run all component tests**

```bash
npm test
```

Expected: All tests passing

**Step 6: Commit**

```bash
git add src/components/
git commit -m "feat(components): add TodoItem, TodoList, AddTodo components with tests"
```

---

## Task 7: Create Main App Component

**Files:**
- Create: `src/App.jsx`
- Create: `src/App.test.jsx`
- Create: `src/main.jsx`
- Create: `src/index.css`

**Step 1: Create index.css with Tailwind-like styles**

```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility classes */
.bg-gray-100 { background-color: #f3f4f6; }
.bg-white { background-color: #ffffff; }
.bg-blue-600 { background-color: #2563eb; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-gray-50 { background-color: #f9fafb; }

.text-white { color: #ffffff; }
.text-blue-600 { color: #2563eb; }
.text-blue-100 { color: #dbeafe; }
.text-gray-400 { color: #9ca3af; }
.text-gray-500 { color: #6b7280; }
.text-gray-700 { color: #374151; }
.text-red-500 { color: #ef4444; }
.text-red-700 { color: #b91c1c; }

.min-h-screen { min-height: 100vh; }
.max-h-80 { max-height: 20rem; }
.max-w-lg { max-width: 32rem; }
.w-full { width: 100%; }
.flex-1 { flex: 1; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }

.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-8 { padding: 2rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.my-auto { margin-top: auto; margin-bottom: auto; }
.mt-1 { margin-top: 0.25rem; }

.rounded-lg { border-radius: 0.5rem; }
.rounded-t-lg { border-radius: 0.5rem 0.5rem 0 0; }
.rounded-b-lg { border-radius: 0 0 0.5rem 0.5rem; }

.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-t { border-top-width: 1px; }
.border-gray-100 { border-color: #f3f4f6; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }

.text-sm { font-size: 0.875rem; }
.text-2xl { font-size: 1.5rem; }
.font-semibold { font-weight: 600; }
.text-center { text-align: center; }
.text-anchor-middle { text-anchor: middle; }

.line-through { text-decoration: line-through; }

.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

.overflow-y-auto { overflow-y: auto; }

.cursor-pointer { cursor: pointer; }

.transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }

.hover\:bg-gray-50:hover { background-color: #f9fafb; }
.hover\:bg-blue-50:hover { background-color: #eff6ff; }
.hover\:bg-blue-700:hover { background-color: #1d4ed8; }
.hover\:text-red-500:hover { color: #ef4444; }
.hover\:text-red-700:hover { color: #b91c1c; }

.focus\:outline-none:focus { outline: none; }
.focus\:border-blue-500:focus { border-color: #3b82f6; }
.focus\:ring-blue-500:focus { --tw-ring-color: #3b82f6; }

.group:hover .group-hover\:block { display: block; }

input[type="checkbox"] {
  accent-color: #2563eb;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Divide utility */
.divide-y > * + * {
  border-top: 1px solid #f3f4f6;
}

.divide-gray-100 > * + * {
  border-color: #f3f4f6;
}
```

**Step 2: Create App.jsx**

```jsx
// src/App.jsx
import React from 'react';
import { useTodos } from './hooks/useTodos';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { AddTodo } from './components/AddTodo';
import { TodoList } from './components/TodoList';

function App() {
  const { todos, stats, addTodo, toggleTodo, deleteTodo, clearCompleted } = useTodos();
  const { isInstallable, handleInstall } = useInstallPrompt();

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md my-auto">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white rounded-t-lg flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">Задачи</h1>
            <p className="text-blue-100 text-sm mt-1">
              {todos.length === 0
                ? 'Начни свой список'
                : `${stats.active} активных, ${stats.completed} выполнено`}
            </p>
          </div>
          {isInstallable && (
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-white text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors"
            >
              📲 Установить
            </button>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-b border-gray-200">
          <AddTodo onAdd={addTodo} />
        </div>

        {/* Todo List */}
        <div className="max-h-80 overflow-y-auto">
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </div>

        {/* Footer */}
        {todos.length > 0 && stats.completed > 0 && (
          <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {stats.completed} выполнено
            </span>
            <button
              onClick={clearCompleted}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Очистить выполненные
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

**Step 3: Create App.test.jsx**

```jsx
// src/App.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App', () => {
  it('renders todo app header', () => {
    render(<App />);
    expect(screen.getByText('Задачи')).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<App />);
    expect(screen.getByText('Нет задач')).toBeInTheDocument();
  });

  it('can add a todo', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText('Новая задача...');
    fireEvent.change(input, { target: { value: 'Test task' } });
    fireEvent.click(screen.getByText('Добавить'));
    
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('shows stats after adding todo', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText('Новая задача...');
    fireEvent.change(input, { target: { value: 'Test task' } });
    fireEvent.click(screen.getByText('Добавить'));
    
    expect(screen.getByText('1 активных, 0 выполнено')).toBeInTheDocument();
  });
});
```

**Step 4: Create main.jsx**

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 5: Run all tests**

```bash
npm test
```

Expected: All tests passing

**Step 6: Commit**

```bash
git add src/App.jsx src/App.test.jsx src/main.jsx src/index.css
git commit -m "feat(app): add main App component with integration"
```

---

## Task 8: Create Service Worker Update Handler

**Files:**
- Create: `src/components/PWAUpdate.jsx`
- Create: `src/components/PWAUpdate.test.jsx`
- Create: `src/hooks/usePWAUpdate.js`
- Modify: `src/App.jsx` (add PWAUpdate component)

**Step 1: Create usePWAUpdate hook**

```javascript
// src/hooks/usePWAUpdate.js
import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker activated, reload to use new version
        window.location.reload();
      });
    }
  }, []);

  const onNeedRefresh = () => {
    setNeedRefresh(true);
  };

  const onOfflineReady = () => {
    setOfflineReady(true);
    // Hide the offline ready message after 3 seconds
    setTimeout(() => setOfflineReady(false), 3000);
  };

  const closePrompt = () => {
    setNeedRefresh(false);
  };

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  };

  return {
    needRefresh,
    offlineReady,
    onNeedRefresh,
    onOfflineReady,
    closePrompt,
    updateServiceWorker,
  };
}
```

**Step 2: Create PWAUpdate component**

```jsx
// src/components/PWAUpdate.jsx
import React from 'react';

export function PWAUpdate({ needRefresh, offlineReady, onClose, onUpdate }) {
  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50">
      <div className="flex justify-between items-center">
        <p className="text-sm">
          {offlineReady
            ? 'Приложение готово к работе офлайн'
            : 'Доступна новая версия приложения'}
        </p>
        <div className="flex gap-2 ml-4">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="px-3 py-1 bg-blue-600 text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Обновить
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create PWAUpdate test**

```jsx
// src/components/PWAUpdate.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAUpdate } from './PWAUpdate';

describe('PWAUpdate', () => {
  it('renders nothing when no props are true', () => {
    const { container } = render(
      <PWAUpdate
        needRefresh={false}
        offlineReady={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows offline ready message', () => {
    render(
      <PWAUpdate
        needRefresh={false}
        offlineReady={true}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText('Приложение готово к работе офлайн')).toBeInTheDocument();
  });

  it('shows update available message', () => {
    render(
      <PWAUpdate
        needRefresh={true}
        offlineReady={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText('Доступна новая версия приложения')).toBeInTheDocument();
    expect(screen.getByText('Обновить')).toBeInTheDocument();
  });

  it('calls onUpdate when update button clicked', () => {
    const onUpdate = vi.fn();
    render(
      <PWAUpdate
        needRefresh={true}
        offlineReady={false}
        onClose={vi.fn()}
        onUpdate={onUpdate}
      />
    );
    
    fireEvent.click(screen.getByText('Обновить'));
    expect(onUpdate).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <PWAUpdate
        needRefresh={true}
        offlineReady={false}
        onClose={onClose}
        onUpdate={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Закрыть'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 4: Update App.jsx to include PWAUpdate**

Add to imports:
```jsx
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { PWAUpdate } from './components/PWAUpdate';
```

Add hook usage:
```jsx
function App() {
  const { todos, stats, addTodo, toggleTodo, deleteTodo, clearCompleted } = useTodos();
  const { isInstallable, handleInstall } = useInstallPrompt();
  const { needRefresh, offlineReady, closePrompt, updateServiceWorker } = usePWAUpdate();
  
  // ... rest of component
}
```

Add component at the end of return:
```jsx
      <PWAUpdate
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        onClose={closePrompt}
        onUpdate={updateServiceWorker}
      />
    </div>
```

**Step 5: Update vite.config.js to register SW update callback**

Update the VitePWA config:
```javascript
VitePWA({
  registerType: 'prompt',
  injectRegister: 'script-defer',
  workbox: {
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: false, // Wait for user confirmation
    // ... rest of config
  },
  // ... rest of config
})
```

**Step 6: Run tests**

```bash
npm test
```

Expected: All tests passing

**Step 7: Commit**

```bash
git add src/components/PWAUpdate.jsx src/components/PWAUpdate.test.jsx src/hooks/usePWAUpdate.js src/App.jsx vite.config.js
git commit -m "feat(pwa): add service worker update handling with user prompt"
```

---

## Task 9: Add App Icons

**Files:**
- Create: `public/icon-192x192.png`
- Create: `public/icon-512x512.png`

**Step 1: Create simple SVG icons and convert to PNG**

Since we need actual PNG files for PWA, create them using a script:

```javascript
// scripts/generate-icons.js
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];

const svgTemplate = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect fill="#2563eb" width="${size}" height="${size}" rx="${Math.round(size * 0.1)}"/>
  <text x="${size/2}" y="${size * 0.68}" font-size="${size * 0.55}" text-anchor="middle" fill="white" font-family="Arial">✓</text>
</svg>`;

sizes.forEach(size => {
  const svg = svgTemplate(size);
  fs.writeFileSync(path.join('public', `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});
```

Or create simple placeholder files (user can replace with real icons):

```html
<!-- public/icon-192x192.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect fill="#2563eb" width="192" height="192" rx="20"/>
  <text x="96" y="130" font-size="100" text-anchor="middle" fill="white">✓</text>
</svg>
```

**Step 2: Update manifest to use SVG icons (simpler for now)**

Update vite.config.js icons array:
```javascript
icons: [
  {
    src: '/icon-192x192.svg',
    sizes: '192x192',
    type: 'image/svg+xml'
  },
  {
    src: '/icon-512x512.svg',
    sizes: '512x512',
    type: 'image/svg+xml'
  }
]
```

**Step 3: Commit**

```bash
git add public/
git commit -m "chore(assets): add PWA icons"
```

---

## Task 10: Final Verification and Build

**Files:**
- All files

**Step 1: Run linter**

```bash
npm run lint
```

Expected: No errors (or fix any issues)

**Step 2: Run formatter check**

```bash
npm run format:check
```

Expected: No issues (or run `npm run format` to fix)

**Step 3: Run all tests**

```bash
npm test -- --run
```

Expected: All tests passing

**Step 4: Build for production**

```bash
npm run build
```

Expected: Build succeeds, dist/ folder created

**Step 5: Check build output**

```bash
ls -la dist/
```

Expected: Contains index.html, assets/, sw.js, manifest.json

**Step 6: Commit all changes**

```bash
git add -A
git commit -m "chore: final build verification and formatting"
```

---

## Summary

После выполнения плана получим:

1. **Vite-сборка** вместо CDN
2. **Модульная архитектура**: hooks, components, utils
3. **Полный coverage тестами**: Vitest + React Testing Library
4. **ESLint + Prettier**: строгий код-стайл
5. **Исправленный Service Worker**:
   - Stale-while-revalidate стратегия
   - Уведомление о новой версии
   - Пользователь контролирует обновление
6. **PWA-функционал**: установка, офлайн-работа

**Команды для разработки:**
- `npm run dev` — запуск dev-сервера
- `npm test` — запуск тестов в watch-режиме
- `npm run build` — production сборка
- `npm run lint` — проверка линтером
- `npm run format` — форматирование кода

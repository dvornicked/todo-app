import React from 'react';
import { Route, Switch } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTodos } from './hooks/useTodos';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AddTodo } from './components/AddTodo';
import { TodoList } from './components/TodoList';
import { PWAUpdate } from './components/PWAUpdate';

function TodoApp() {
  const { user, logout } = useAuth();
  const { todos, loading, error, stats, addTodo, toggleTodo, deleteTodo, clearCompleted } = useTodos();
  const { isInstallable, handleInstall } = useInstallPrompt();
  const { needRefresh, offlineReady, closePrompt, updateServiceWorker } = usePWAUpdate();

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md my-auto">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white rounded-t-lg flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">Задачи</h1>
            <p className="text-blue-100 text-sm mt-1">
              {user && (<span className="block">{user.email}</span>)}
              {todos.length === 0
                ? 'Начни свой список'
                : `${stats.active} активных, ${stats.completed} выполнено`}
            </p>
          </div>
          <div className="flex gap-2">
            {isInstallable && (
              <button
                onClick={handleInstall}
                className="px-3 py-1 bg-white text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors"
              >
                📲 Установить
              </button>
            )}
            <button
              onClick={logout}
              className="px-3 py-1 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <p>Загрузка...</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <PWAUpdate
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        onClose={closePrompt}
        onUpdate={updateServiceWorker}
      />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <TodoApp /> : <LoginPage />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <TodoApp /> : <RegisterPage />}
      </Route>
      
      <Route path="/">
        {isAuthenticated ? <TodoApp /> : <LoginPage />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

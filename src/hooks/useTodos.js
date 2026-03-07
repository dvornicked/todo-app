import { useState, useEffect, useCallback } from 'react';
import { todosAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useTodos() {
  const { isAuthenticated } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load todos from API
  useEffect(() => {
    if (!isAuthenticated) {
      setTodos([]);
      setLoading(false);
      return;
    }

    async function loadTodos() {
      try {
        setLoading(true);
        setError(null);
        const data = await todosAPI.getAll();
        setTodos(data.todos || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, [isAuthenticated]);

  const addTodo = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setError(null);
      const todo = await todosAPI.create(trimmed);
      setTodos((prev) => [todo, ...prev]);
      return todo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const toggleTodo = useCallback(async (id) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const updated = await todosAPI.update(id, { completed: !todo.completed });
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: updated.completed } : t))
      );
    } catch (err) {
      setError(err.message);
    }
  }, [todos]);

  const deleteTodo = useCallback(async (id) => {
    try {
      await todosAPI.delete(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const clearCompleted = useCallback(async () => {
    try {
      const completedTodos = todos.filter((t) => t.completed);
      await Promise.all(completedTodos.map((t) => todosAPI.delete(t.id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      setError(err.message);
    }
  }, [todos]);

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return {
    todos,
    loading,
    error,
    stats,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  };
}

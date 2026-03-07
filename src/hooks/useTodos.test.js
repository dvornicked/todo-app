import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from './useTodos';

describe('useTodos', () => {
  let storage = {};
  let setItemSpy;
  
  beforeEach(() => {
    storage = {};
    setItemSpy = vi.fn((key, value) => { storage[key] = value; });
    global.localStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: setItemSpy,
      removeItem: vi.fn((key) => { delete storage[key]; }),
      clear: vi.fn(() => { storage = {}; })
    };
  });

  afterEach(() => {
    storage = {};
    vi.restoreAllMocks();
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
    
    expect(setItemSpy).toHaveBeenCalled();
  });
});

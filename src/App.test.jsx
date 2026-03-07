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

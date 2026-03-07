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

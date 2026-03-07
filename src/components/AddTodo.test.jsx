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

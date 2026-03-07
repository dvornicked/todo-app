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

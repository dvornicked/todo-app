import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { useRequireAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import type { TodoStatus, Priority } from '@todo/shared';

export const Route = createFileRoute('/todos/')({
  component: TodosPage,
});

function TodosPage() {
  const isAuth = useRequireAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TodoStatus | undefined>(undefined);
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: todosData, isLoading } = trpc.todos.list.useQuery({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status,
    priority,
  });

  const { data: todoCount } = trpc.todos.count.useQuery();

  if (!isAuth) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Todos</h1>
          {todoCount !== undefined && (
            <p className="text-sm text-gray-600">
              {todoCount}/200 todos
              {todoCount >= 180 && (
                <span className={`ml-2 ${todoCount >= 190 ? 'text-red-600 font-bold' : 'text-yellow-600'}`}>
                  {todoCount >= 190 ? '⚠️ Almost at limit!' : '⚡ Approaching limit'}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate({ to: '/todos/new' })}
          disabled={todoCount >= 200}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + New Todo
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search todos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-md flex-1"
        />
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TodoStatus || undefined)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority || undefined)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="space-y-4">
            {todosData?.todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => navigate({ to: '/todos/$todoId', params: { todoId: todo.id } })}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{todo.title}</h3>
                    {todo.description && (
                      <p className="text-gray-600 mt-1 line-clamp-2">{todo.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        todo.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        todo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        todo.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {todo.status.replace('_', ' ')}
                      </span>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        todo.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        todo.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        todo.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {todo.priority}
                      </span>
                      
                      {todo.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {todo.subtasks.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length} subtasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {todosData?.pagination && todosData.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {todosData.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(todosData.pagination.totalPages, p + 1))}
                disabled={page === todosData.pagination.totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

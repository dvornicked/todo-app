import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../hooks/useAuth';

export function TodosPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
    }
  }, [accessToken, navigate]);

  const { data: todosData, isLoading } = trpc.todos.list.useQuery({
    page: 1,
    limit: 25,
    search: search || undefined,
  });

  const { data: todoCount } = trpc.todos.count.useQuery();

  if (!accessToken) return null;

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
        <a
          href="/todos/new"
          className={`px-4 py-2 rounded-md ${
            todoCount && todoCount >= 200
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={(e) => {
            if (todoCount && todoCount >= 200) {
              e.preventDefault();
            } else {
              navigate('/todos/new');
            }
          }}
        >
          + New Todo
        </a>
      </div>

      <input
        type="text"
        placeholder="Search todos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 border rounded-md w-full"
      />

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {todosData?.todos.map((todo: any) => (
            <div
              key={todo.id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <h3 className="font-semibold text-lg">{todo.title}</h3>
              {todo.description && (
                <p className="text-gray-600 mt-1">{todo.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  todo.status === 'DONE' ? 'bg-green-100 text-green-800' :
                  todo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {todo.status}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  todo.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                  todo.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {todo.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

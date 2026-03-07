import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTodoSchema, type CreateTodoInput } from '@todo/shared';
import { trpc } from '../../lib/trpc';
import { useRequireAuth } from '../../hooks/useAuth';

export const Route = createFileRoute('/todos/new')({
  component: NewTodoPage,
});

function NewTodoPage() {
  const isAuth = useRequireAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: tags } = trpc.tags.list.useQuery();
  
  const createTodo = trpc.todos.create.useMutation({
    onSuccess: () => {
      utils.todos.list.invalidate();
      navigate({ to: '/todos' });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      status: 'TODO',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = (data: CreateTodoInput) => {
    createTodo.mutate(data);
  };

  if (!isAuth) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Todo</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            {...register('title')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter todo title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter description (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select {...register('status')} className="w-full px-3 py-2 border rounded-md">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select {...register('priority')} className="w-full px-3 py-2 border rounded-md">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            {...register('dueDate', { valueAsDate: true })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {createTodo.error && (
          <p className="text-red-500 text-sm">{createTodo.error.message}</p>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createTodo.isPending}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createTodo.isPending ? 'Creating...' : 'Create Todo'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate({ to: '/todos' })}
            className="py-2 px-4 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

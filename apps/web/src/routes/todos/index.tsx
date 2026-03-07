import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/todos')({
  component: TodosPage,
});

function TodosPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Todos</h1>
      <p>Todo list will be implemented here.</p>
    </div>
  );
}

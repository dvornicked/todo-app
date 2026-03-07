import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Welcome to Todo App</h1>
      <p className="mt-4">Manage your tasks efficiently.</p>
    </div>
  );
}

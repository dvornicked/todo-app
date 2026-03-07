import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { createRootRoute } from '@tanstack/react-router';
import { useAuthStore } from '../hooks/useAuth';
import { trpc } from '../lib/trpc';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const trpcUtils = trpc.useUtils();

  const handleLogout = () => {
    logout();
    trpcUtils.invalidate();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Todo App
              </Link>
              
              {isAuthenticated() && (
                <>
                  <Link
                    to="/todos"
                    className="text-gray-600 hover:text-gray-900"
                    activeProps={{ className: 'text-blue-600 font-medium' }}
                  >
                    My Todos
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated() ? (
                <>
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900"
                    activeProps={{ className: 'text-blue-600 font-medium' }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

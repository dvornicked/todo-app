import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../shared';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate('/todos');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit((data) => {
    login.mutate(data);
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign in</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          {login.error && <p className="text-red-500 text-sm">{login.error.message}</p>}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:underline">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../lib/trpc';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      navigate('/login');
    },
  });

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit((data) => {
    register.mutate(data);
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Create account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...registerField('email')}
              type="email"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              {...registerField('password')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input
              {...registerField('confirmPassword')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
          </div>

          {register.error && <p className="text-red-500 text-sm">{register.error.message}</p>}

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {register.isPending ? 'Creating...' : 'Create account'}
          </button>

          <p className="text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}

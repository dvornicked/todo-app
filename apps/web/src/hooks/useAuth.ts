import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, token) => set({ user, accessToken: token }),
      logout: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Hook for protected routes
export function useRequireAuth() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
}

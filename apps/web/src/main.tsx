import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { trpc } from './lib/trpc';
import { useAuthStore } from './hooks/useAuth';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      headers() {
        const token = useAuthStore.getState().accessToken;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
);

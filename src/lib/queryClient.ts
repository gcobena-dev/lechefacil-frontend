import { QueryClient } from '@tanstack/react-query';

// Centralized QueryClient so we can invalidate from anywhere (e.g., Capacitor resume)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
    },
  },
});


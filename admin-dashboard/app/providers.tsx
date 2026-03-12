'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            onError: (error) => {
              console.error('React Query Mutation Error:', error);
            },
          },
        },
      })
  );

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress errors from browser extensions and known safe errors
      const reason = event.reason;
      
      // Suppress browser extension errors
      if (reason?.code === 403 || reason?.httpStatus === 200) {
        event.preventDefault();
        return;
      }
      
      // Suppress generic object errors without useful information
      if (typeof reason === 'object' && reason !== null && Object.keys(reason).length === 0) {
        event.preventDefault();
        return;
      }
      
      // Log other errors for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unhandled promise rejection (suppressed in production):', reason);
      }
      
      // Prevent default to avoid console errors in production
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

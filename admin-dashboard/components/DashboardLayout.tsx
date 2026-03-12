'use client';

import { Sidebar } from './Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/mockData';
import { AdminGuard } from './AdminGuard';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const admin = getCurrentAdmin();
        
        if (!admin) {
          router.push('/login');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    // Small delay to ensure localStorage is ready
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto p-6 pb-12">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}

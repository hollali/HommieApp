'use client';

import { Sidebar } from './Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AdminGuard } from './AdminGuard';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
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

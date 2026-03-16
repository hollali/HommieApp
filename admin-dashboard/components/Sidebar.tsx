'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Building2, Flag, BarChart3, Settings, LogOut, Menu, X, DollarSign, CreditCard, Star, Clock, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { Logo } from './Logo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/verification', label: 'Verification', icon: UserCheck },
  { href: '/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/featured-listings', label: 'Featured Listings', icon: Star },
  { href: '/reports', label: 'Reports', icon: Flag },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/activity-logs', label: 'Activity Logs', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return <ClerkSidebar />;
}

function ClerkSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      window.location.href = '/login';
    }
  };


  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-surface rounded-2xl shadow-lg"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-surface border-r border-border z-40 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border flex-shrink-0">
            <Logo size="medium" className="justify-start" />
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              // For properties, match /properties and /properties/[id]
              // For other routes, exact match
              const isActive = 
                item.href === '/properties' 
                  ? pathname?.startsWith('/properties')
                  : item.href === '/payments' || item.href === '/subscriptions' || item.href === '/featured-listings' || item.href === '/activity-logs'
                  ? pathname?.startsWith(item.href)
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-text-secondary hover:bg-background'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
            {user && (
              <div className="px-4 py-3 flex items-center gap-3 bg-background rounded-2xl mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt={user.fullName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={20} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {user.fullName || 'Admin User'}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}


'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useClerk } from '@clerk/nextjs';
import { Settings, User, Shield, Bell, Database, LogOut, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('hommie_admin_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEmailNotifications(parsed.emailNotifications ?? true);
        setReportAlerts(parsed.reportAlerts ?? true);
        setApprovalAlerts(parsed.approvalAlerts ?? true);
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  const handleSavePreferences = () => {
    setSaving(true);
    const payload = {
      emailNotifications,
      reportAlerts,
      approvalAlerts,
    };
    localStorage.setItem('hommie_admin_settings', JSON.stringify(payload));
    setTimeout(() => {
      setSaving(false);
      alert('Preferences saved locally');
    }, 300);
  };

  if (!isLoaded) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
            <p className="text-text-secondary">Manage your admin profile and dashboard preferences</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-semibold"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-light rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Profile Settings</h2>
                  <p className="text-sm text-text-secondary">Your identity on Hommie Admin</p>
                </div>
              </div>
              <button 
                onClick={() => openUserProfile()}
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Edit in Clerk <ExternalLink size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-6 mb-8 p-4 bg-background rounded-2xl border border-border">
               <img 
                src={user?.imageUrl} 
                className="w-20 h-20 rounded-full border-4 border-white shadow-sm"
                alt="Profile"
               />
               <div>
                  <h3 className="text-xl font-bold text-text-primary">{user?.fullName || 'Admin User'}</h3>
                  <p className="text-text-secondary">{user?.primaryEmailAddress?.emailAddress}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                    {user?.publicMetadata?.role as string || 'Administrator'}
                  </span>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-text-muted cursor-not-allowed"
                  value={user?.fullName || ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-text-muted cursor-not-allowed"
                  value={user?.primaryEmailAddress?.emailAddress || ''}
                  disabled
                />
              </div>
              <p className="text-xs text-text-secondary italic">
                Note: Profile details are managed via Clerk. Use the "Edit in Clerk" link to update your info.
              </p>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Security & Access</h2>
                <p className="text-sm text-text-secondary">Password and account security</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="p-4 border border-border rounded-xl text-left hover:bg-background transition-colors group"
                onClick={() => openUserProfile()}
              >
                <div className="font-semibold text-text-primary group-hover:text-primary transition-colors">Change Password</div>
                <div className="text-sm text-text-secondary">Secure your account with a new password</div>
              </button>
              <button
                className="p-4 border border-border rounded-xl text-left hover:bg-background transition-colors group"
                onClick={() => openUserProfile()}
              >
                <div className="font-semibold text-text-primary group-hover:text-primary transition-colors">Two-Factor Authentication</div>
                <div className="text-sm text-text-secondary">Add an extra layer of security</div>
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Dashboard Preferences</h2>
                <p className="text-sm text-text-secondary">Configure your local dashboard alerts</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <label className="flex items-center justify-between p-4 bg-background rounded-xl border border-transparent hover:border-border transition-all cursor-pointer">
                <div>
                  <div className="font-semibold text-text-primary">Email Notifications</div>
                  <div className="text-sm text-text-secondary">Receive platform digests via email</div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-background rounded-xl border border-transparent hover:border-border transition-all cursor-pointer">
                <div>
                  <div className="font-semibold text-text-primary">New Report Alerts</div>
                  <div className="text-sm text-text-secondary">Notify me when listings are reported</div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                  checked={reportAlerts}
                  onChange={(e) => setReportAlerts(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-background rounded-xl border border-transparent hover:border-border transition-all cursor-pointer">
                <div>
                  <div className="font-semibold text-text-primary">Pending Approvals</div>
                  <div className="text-sm text-text-secondary">Remind me of properties awaiting review</div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                  checked={approvalAlerts}
                  onChange={(e) => setApprovalAlerts(e.target.checked)}
                />
              </label>
            </div>
            <button
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-md active:scale-95 disabled:opacity-60"
                onClick={handleSavePreferences}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
          </div>

          {/* System Information */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">System Information</h2>
                <p className="text-sm text-text-secondary">Hommie Professional v1.0.0</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 bg-background rounded-2xl border border-border text-center">
                <p className="text-text-secondary mb-1 uppercase text-[10px] font-bold tracking-wider">Status</p>
                <p className="font-bold text-green-600 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live & Connected
                </p>
              </div>
              <div className="p-4 bg-background rounded-2xl border border-border text-center">
                <p className="text-text-secondary mb-1 uppercase text-[10px] font-bold tracking-wider">Region</p>
                <p className="font-bold text-text-primary">West Africa (Ghana)</p>
              </div>
              <div className="p-4 bg-background rounded-2xl border border-border text-center">
                <p className="text-text-secondary mb-1 uppercase text-[10px] font-bold tracking-wider">Identity</p>
                <p className="font-bold text-text-primary">Clerk Managed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

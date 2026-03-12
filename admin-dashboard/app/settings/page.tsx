'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Settings, User, Shield, Bell, Database } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('hommie_admin_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFullName(parsed.fullName || '');
        setEmailNotifications(parsed.emailNotifications ?? true);
        setReportAlerts(parsed.reportAlerts ?? true);
        setApprovalAlerts(parsed.approvalAlerts ?? true);
        setTwoFactorEnabled(parsed.twoFactorEnabled ?? false);
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      alert('Full name is required');
      return;
    }
    setSaving(true);
    const payload = {
      fullName: fullName.trim(),
      emailNotifications,
      reportAlerts,
      approvalAlerts,
      twoFactorEnabled,
    };
    localStorage.setItem('hommie_admin_settings', JSON.stringify(payload));
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved');
    }, 300);
  };

  const handleChangePassword = () => {
    const next = prompt('Enter a new password');
    if (!next?.trim()) return;
    alert('Password updated (mock)');
  };

  const handleEnable2FA = () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    const stored = localStorage.getItem('hommie_admin_settings');
    const parsed = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      'hommie_admin_settings',
      JSON.stringify({ ...parsed, twoFactorEnabled: next })
    );
    alert(next ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage admin dashboard settings</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Profile Settings</h2>
                <p className="text-sm text-text-secondary">Manage your admin profile</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin@hommie.com"
                  disabled
                />
                <p className="text-xs text-text-secondary mt-1">Email cannot be changed</p>
              </div>
              <button
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Security</h2>
                <p className="text-sm text-text-secondary">Manage security settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <button
                className="w-full px-4 py-3 border border-border rounded-xl text-left hover:bg-background transition-colors"
                onClick={handleChangePassword}
              >
                <div className="font-semibold text-text-primary">Change Password</div>
                <div className="text-sm text-text-secondary">Update your login password</div>
              </button>
              <button
                className="w-full px-4 py-3 border border-border rounded-xl text-left hover:bg-background transition-colors"
                onClick={handleEnable2FA}
              >
                <div className="font-semibold text-text-primary">Two-Factor Authentication</div>
                <div className="text-sm text-text-secondary">
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
                <p className="text-sm text-text-secondary">Configure notification preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div>
                  <div className="font-semibold text-text-primary">Email Notifications</div>
                  <div className="text-sm text-text-secondary">Receive email alerts for important events</div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div>
                  <div className="font-semibold text-text-primary">New Report Alerts</div>
                  <div className="text-sm text-text-secondary">Get notified when new reports are submitted</div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={reportAlerts}
                  onChange={(e) => setReportAlerts(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div>
                  <div className="font-semibold text-text-primary">Pending Approvals</div>
                  <div className="text-sm text-text-secondary">Alert for properties awaiting approval</div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={approvalAlerts}
                  onChange={(e) => setApprovalAlerts(e.target.checked)}
                />
              </label>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">System Information</h2>
                <p className="text-sm text-text-secondary">Platform details</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Dashboard Version</span>
                <span className="font-medium text-text-primary">v1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary">API Status</span>
                <span className="font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary">Database</span>
                <span className="font-medium text-text-primary">Supabase PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

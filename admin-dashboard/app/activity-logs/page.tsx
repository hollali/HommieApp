'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery } from '@tanstack/react-query';
import { getAdminLogs, getAdmins } from '@/lib/data';
import { AdminLog } from '@/lib/types';
import { Search, Filter, Calendar, User, Clock } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

async function fetchActivityLogs(action?: string, adminId?: string): Promise<AdminLog[]> {
  const logs = await getAdminLogs();
  const admins = await getAdmins();

  // Enrich logs with admin info
  const enrichedLogs = logs.map((log) => ({
    ...log,
    admin: admins.find((a) => a.id === log.admin_id),
  }));

  let filtered = enrichedLogs;

  // Filter by action
  if (action && action !== 'all') {
    filtered = filtered.filter((log) => log.action === action);
  }

  // Filter by admin
  if (adminId && adminId !== 'all') {
    filtered = filtered.filter((log) => log.admin_id === adminId);
  }

  // Sort by timestamp descending
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'approved_property', label: 'Approved Property' },
  { value: 'rejected_property', label: 'Rejected Property' },
  { value: 'suspended_property', label: 'Suspended Property' },
  { value: 'verified_property', label: 'Verified Property' },
  { value: 'suspended_user', label: 'Suspended User' },
  { value: 'activated_user', label: 'Activated User' },
  { value: 'resolved_report', label: 'Resolved Report' },
  { value: 'dismissed_report', label: 'Dismissed Report' },
];

function getActionIcon(action: string) {
  if (action.includes('approved') || action.includes('verified') || action.includes('activated')) {
    return '✓';
  }
  if (action.includes('rejected') || action.includes('suspended') || action.includes('dismissed')) {
    return '✗';
  }
  return '•';
}

function getActionColor(action: string) {
  if (action.includes('approved') || action.includes('verified') || action.includes('activated') || action.includes('resolved')) {
    return 'bg-green-100 text-green-700';
  }
  if (action.includes('rejected') || action.includes('suspended') || action.includes('dismissed')) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-blue-100 text-blue-700';
}

export default function ActivityLogsPage() {
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs, isLoading } = useQuery<AdminLog[]>({
    queryKey: ['activity-logs', selectedAction, selectedAdmin],
    queryFn: () => fetchActivityLogs(selectedAction, selectedAdmin),
  });

  const { data: admins } = useQuery({
    queryKey: ['admins'],
    queryFn: () => getAdmins(),
  });

  // Filter by search query
  const filteredLogs = logs?.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const actionLabel = ACTION_TYPES.find((a) => a.value === log.action)?.label || log.action;
    const adminName = log.admin?.full_name || log.admin?.email || 'Unknown';
    return (
      actionLabel.toLowerCase().includes(query) ||
      adminName.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.entity_id.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Activity Logs</h1>
          <p className="text-text-secondary">View all admin actions and system events</p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-muted" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="flex-1 px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                {ACTION_TYPES.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Filter */}
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              <option value="all">All Admins</option>
              {admins?.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name || admin.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Logs List */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingLogo label="Loading activity logs..." />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const actionLabel = ACTION_TYPES.find((a) => a.value === log.action)?.label || log.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                const timeAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60));
                const timeText = timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : format(new Date(log.timestamp), 'MMM dd, yyyy');

                return (
                  <div key={log.id} className="p-6 hover:bg-background transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-text-primary mb-1">{actionLabel}</h3>
                            <p className="text-sm text-text-secondary">
                              {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)} • ID: {log.entity_id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                              <Clock size={14} />
                              {timeText}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>{log.admin?.full_name || log.admin?.email || 'Unknown Admin'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{format(new Date(log.timestamp), 'MMM dd, yyyy • HH:mm')}</span>
                          </div>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-3 p-3 bg-background rounded-xl border border-border">
                            <p className="text-xs font-semibold text-text-secondary mb-1">Details:</p>
                            <pre className="text-xs text-text-secondary whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary">No activity logs found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

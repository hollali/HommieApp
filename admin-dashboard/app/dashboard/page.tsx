'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getAdminLogs } from '@/lib/data';
import { Users, Building2, CheckCircle, Clock, Flag, TrendingUp, DollarSign, MessageSquare } from 'lucide-react';
import { DashboardStats, AdminLog } from '@/lib/types';

async function fetchDashboardStats(): Promise<DashboardStats> {
  return getDashboardStats();
}

async function fetchRecentActivity(): Promise<AdminLog[]> {
  const logs = await getAdminLogs();
  return logs.slice(0, 5); // Get 5 most recent
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const colorClasses = {
    primary: 'bg-primary-light text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-sm text-success font-semibold flex items-center gap-1">
            <TrendingUp size={16} />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-text-primary mb-1">{value}</h3>
      <p className="text-sm text-text-secondary">{title}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: recentActivity, isLoading: loadingActivity } = useQuery<AdminLog[]>({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 30000,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Overview of your platform</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="bg-surface rounded-3xl p-12 text-center shadow-sm border border-border">
            <LoadingLogo label="Loading dashboard..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              trend="+12%"
              color="primary"
            />
            <StatCard
              title="Total Listings"
              value={stats?.totalListings || 0}
              icon={Building2}
              trend="+8%"
              color="primary"
            />
            <StatCard
              title="Active Listings"
              value={stats?.activeListings || 0}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="Pending Approvals"
              value={stats?.pendingApprovals || 0}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="Pending Reports"
              value={stats?.pendingReports || 0}
              icon={Flag}
              color="error"
            />
            <StatCard
              title="Open Tickets"
              value={stats?.openTickets || 0}
              icon={MessageSquare}
              color="primary"
            />
            <StatCard
              title="Verified Listings"
              value={stats?.verifiedListings || 0}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="Pending Verifications"
              value={stats?.pendingVerifications || 0}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="Verified Users"
              value={stats?.verifiedUsers || 0}
              icon={Users}
              color="success"
            />
            <StatCard
              title="New Users Today"
              value={stats?.newUsersToday || 0}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="New Listings Today"
              value={stats?.newListingsToday || 0}
              icon={Building2}
              color="primary"
            />
            <StatCard
              title="Pending Payouts"
              value={stats?.pendingPayouts || 0}
              icon={DollarSign}
              color="warning"
            />
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-xl font-bold text-text-primary mb-4">Recent Activity</h2>
          {loadingActivity ? (
            <LoadingLogo label="Loading activity..." />
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((log) => {
                const timeAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60));
                const timeText = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;
                const iconMap: Record<string, { icon: any; bg: string; color: string }> = {
                  approved_property: { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
                  rejected_property: { icon: Clock, bg: 'bg-red-100', color: 'text-red-600' },
                  approved_verification: { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
                  rejected_verification: { icon: Clock, bg: 'bg-red-100', color: 'text-red-600' },
                  pending_verification: { icon: Clock, bg: 'bg-yellow-100', color: 'text-yellow-600' },
                  suspended_user: { icon: Users, bg: 'bg-yellow-100', color: 'text-yellow-600' },
                  verified_property: { icon: CheckCircle, bg: 'bg-blue-100', color: 'text-blue-600' },
                  resolved_report: { icon: Flag, bg: 'bg-green-100', color: 'text-green-600' },
                };
                const iconConfig = iconMap[log.action] || { icon: Clock, bg: 'bg-gray-100', color: 'text-gray-600' };
                const Icon = iconConfig.icon;

                return (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-background rounded-xl">
                    <div className={`w-10 h-10 ${iconConfig.bg} rounded-full flex items-center justify-center`}>
                      <Icon size={20} className={iconConfig.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - {log.entity_type}
                      </p>
                      <p className="text-xs text-text-secondary">{timeText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

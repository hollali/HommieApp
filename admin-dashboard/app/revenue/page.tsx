'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { getRevenueStats, getTransactions } from '@/lib/data';
import { TrendingUp, DollarSign, CreditCard, Users, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

async function fetchRevenueStats() {
  return getRevenueStats();
}

async function fetchRecentTransactions() {
  const transactions = await getTransactions();
  return transactions.slice(0, 10).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

export default function RevenuePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['revenue-stats'],
    queryFn: fetchRevenueStats,
    refetchInterval: 30000,
  });

  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: fetchRecentTransactions,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Revenue Overview</h1>
          <p className="text-text-secondary">Track platform revenue and transactions</p>
        </div>

        {/* Revenue Stats Grid */}
        {isLoading ? (
          <div className="bg-surface rounded-3xl p-12 text-center shadow-sm border border-border">
            <LoadingLogo label="Loading revenue..." />
          </div>
        ) : (
          stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Revenue"
                value={`₵${stats.total_revenue.toLocaleString()}`}
                icon={DollarSign}
                color="primary"
                trend="+12%"
              />
              <StatCard
                title="Monthly Revenue"
                value={`₵${stats.monthly_revenue.toLocaleString()}`}
                icon={Calendar}
                color="success"
                trend="+8%"
              />
              <StatCard
                title="Today's Revenue"
                value={`₵${stats.today_revenue.toLocaleString()}`}
                icon={DollarSign}
                color="success"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.active_subscriptions}
                icon={Users}
                color="primary"
              />
              <StatCard
                title="Subscription Revenue"
                value={`₵${stats.subscriptions_revenue.toLocaleString()}`}
                icon={CreditCard}
                color="primary"
              />
              <StatCard
                title="Featured Revenue"
                value={`₵${stats.featured_revenue.toLocaleString()}`}
                icon={Building2}
                color="success"
              />
              <StatCard
                title="Verification Revenue"
                value={`₵${stats.verification_revenue.toLocaleString()}`}
                icon={DollarSign}
                color="warning"
              />
              <StatCard
                title="Total Transactions"
                value={stats.transaction_count}
                icon={CreditCard}
                color="primary"
              />
              <StatCard
                title="Total Paid to Hosts"
                value={`₵${stats.payouts_total.toLocaleString()}`}
                icon={DollarSign}
                color="error"
              />
            </div>
          )
        )}

        {/* Recent Transactions */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-xl font-bold text-text-primary mb-4">Recent Transactions</h2>
          {loadingTransactions ? (
            <LoadingLogo label="Loading transactions..." />
          ) : recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-background rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{transaction.description || transaction.type}</h3>
                      <p className="text-sm text-text-secondary">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy • HH:mm')} • {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-text-primary">₵{transaction.amount.toLocaleString()}</p>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-8">No transactions found</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

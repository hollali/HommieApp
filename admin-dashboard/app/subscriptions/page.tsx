'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { createSubscriptionRecord, getSubscriptions, getUsers, updateSubscriptionStatus, updateUser } from '@/lib/data';
import { CreditCard, Users, Calendar, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { SubscriptionPlan, SubscriptionStatus } from '@/lib/types';
import { createTransactionRecord, generatePaymentReference, processPaystackPaymentFlow } from '@/lib/payments';

async function fetchSubscriptions() {
  return getSubscriptions();
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  const styles = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[plan]}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus | 'all'>('all');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  // Filter subscriptions
  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const user = users?.find((u) => u.id === sub.user_id);
    const matchesSearch =
      !searchQuery ||
      user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    const matchesPlan = selectedPlan === 'all' || sub.plan === selectedPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleCancelSubscription = async (subscriptionId: string, userId: string) => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      await updateUser(userId, {
        subscription_status: 'cancelled',
      });
      await updateSubscriptionStatus(subscriptionId, 'cancelled');
      // Refresh subscriptions
      window.location.reload();
    }
  };

  const handleCollectPayment = async (subscriptionId: string, userId: string, amount: number, plan: SubscriptionPlan) => {
    setProcessingId(subscriptionId);
    try {
      const response = await processPaystackPaymentFlow({
        amount,
        currency: 'GHS',
        email: 'admin@hommie.com',
        type: 'subscription',
        reference: generatePaymentReference('PAYSTACK'),
        metadata: { subscription_id: subscriptionId, plan },
      });

      if (response.status !== 'success') {
        alert(response.message || 'Payment initialization failed');
        return;
      }

      if (response.data?.authorization_url) {
        window.open(response.data.authorization_url, '_blank');
      }

      await createTransactionRecord(
        userId,
        'subscription',
        amount,
        response.data?.reference || generatePaymentReference('PAYSTACK'),
        'paystack',
        undefined,
        subscriptionId,
        { plan }
      );

      await updateUser(userId, {
        subscription_status: 'active',
        subscription_plan: plan,
      });
      await createSubscriptionRecord({
        user_id: userId,
        plan,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount,
      });
      window.location.reload();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Subscription Management</h1>
          <p className="text-text-secondary">Manage user subscriptions and plans</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-primary-light text-primary">
                <CreditCard size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {subscriptions?.filter((s) => s.status === 'active').length || 0}
            </h3>
            <p className="text-sm text-text-secondary">Active Subscriptions</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <CheckCircle size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {subscriptions?.length || 0}
            </h3>
            <p className="text-sm text-text-secondary">Total Subscriptions</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <XCircle size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {subscriptions?.filter((s) => s.status === 'expired').length || 0}
            </h3>
            <p className="text-sm text-text-secondary">Expired</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Users size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              ₵{subscriptions?.reduce((sum, s) => sum + (s.status === 'active' ? s.amount : 0), 0) || 0}
            </h3>
            <p className="text-sm text-text-secondary">Monthly Revenue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-muted" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus | 'all')}
                className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Plan Filter */}
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as SubscriptionPlan | 'all')}
              className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingLogo label="Loading subscriptions..." />
            </div>
          ) : filteredSubscriptions && filteredSubscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Plan</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Start Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">End Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubscriptions.map((subscription) => {
                    const user = users?.find((u) => u.id === subscription.user_id);
                    return (
                      <tr key={subscription.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-text-primary">{user?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-text-secondary">{user?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <PlanBadge plan={subscription.plan} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={subscription.status} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text-primary">₵{subscription.amount}/mo</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary">
                            {format(new Date(subscription.start_date), 'MMM dd, yyyy')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary">
                            {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {subscription.status === 'active' && (
                            <button
                              onClick={() => handleCancelSubscription(subscription.id, subscription.user_id)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-2xl text-sm font-semibold hover:bg-red-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleCollectPayment(
                                subscription.id,
                                subscription.user_id,
                                subscription.amount,
                                subscription.plan
                              )
                            }
                            disabled={processingId === subscription.id}
                            className="ml-2 px-4 py-2 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                          >
                            {processingId === subscription.id ? 'Processing...' : 'Collect via Paystack'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary">No subscriptions found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

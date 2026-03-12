'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { getTransactions, getUsers, getProperties } from '@/lib/data';
import { CreditCard, DollarSign, Search, Filter, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { TransactionStatus, TransactionType, PaymentMethod } from '@/lib/types';

async function fetchTransactions() {
  const transactions = await getTransactions();
  return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TypeBadge({ type }: { type: TransactionType }) {
  const styles = {
    subscription: 'bg-blue-100 text-blue-700',
    featured_listing: 'bg-purple-100 text-purple-700',
    boost: 'bg-yellow-100 text-yellow-700',
    verification: 'bg-green-100 text-green-700',
    commission: 'bg-orange-100 text-orange-700',
  };

  const labels = {
    subscription: 'Subscription',
    featured_listing: 'Featured',
    boost: 'Boost',
    verification: 'Verification',
    commission: 'Commission',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(),
  });

  // Filter transactions
  const filteredTransactions = transactions?.filter((tx) => {
    const user = users?.find((u) => u.id === tx.user_id);
    const property = tx.property_id ? properties?.find((p) => p.id === tx.property_id) : null;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        user?.full_name?.toLowerCase().includes(query) ||
        user?.email?.toLowerCase().includes(query) ||
        tx.reference.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query) ||
        property?.title.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && tx.status !== selectedStatus) return false;

    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) return false;

    // Payment method filter
    if (selectedMethod !== 'all' && tx.payment_method !== selectedMethod) return false;

    // Date range filter
    if (dateRange !== 'all') {
      const txDate = new Date(tx.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      if (dateRange === 'today' && txDate < today) return false;
      if (dateRange === 'week' && txDate < weekAgo) return false;
      if (dateRange === 'month' && txDate < monthAgo) return false;
    }

    return true;
  });

  // Calculate totals
  const completedTransactions = filteredTransactions?.filter((t) => t.status === 'completed') || [];
  const totalAmount = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = filteredTransactions
    ?.filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const handleExportCsv = () => {
    const rows = (filteredTransactions || []).map((tx) => {
      const user = users?.find((u) => u.id === tx.user_id);
      const property = tx.property_id ? properties?.find((p) => p.id === tx.property_id) : null;
      return [
        format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm'),
        user?.full_name || 'Unknown',
        user?.email || 'N/A',
        tx.type,
        tx.description || '',
        tx.amount,
        tx.currency,
        tx.payment_method,
        tx.status,
        tx.reference,
        property?.title || '',
      ];
    });

    const header = [
      'Date',
      'User Name',
      'User Email',
      'Type',
      'Description',
      'Amount',
      'Currency',
      'Method',
      'Status',
      'Reference',
      'Property',
    ];

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hommie-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Payment History</h1>
            <p className="text-text-secondary">View and manage all payment transactions</p>
          </div>
          <button
            onClick={handleExportCsv}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-primary-light text-primary">
                <DollarSign size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">₵{totalAmount.toLocaleString()}</h3>
            <p className="text-sm text-text-secondary">Total Amount</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <CreditCard size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {completedTransactions.length}
            </h3>
            <p className="text-sm text-text-secondary">Completed</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <CreditCard size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {filteredTransactions?.filter((t) => t.status === 'pending').length || 0}
            </h3>
            <p className="text-sm text-text-secondary">Pending</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <DollarSign size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">₵{pendingAmount.toLocaleString()}</h3>
            <p className="text-sm text-text-secondary">Pending Amount</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by user, reference, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TransactionStatus | 'all')}
              className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
              className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="featured_listing">Featured</option>
              <option value="boost">Boost</option>
              <option value="verification">Verification</option>
              <option value="commission">Commission</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
              className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingLogo label="Loading transactions..." />
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Method</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => {
                    const user = users?.find((u) => u.id === transaction.user_id);
                    const property = transaction.property_id
                      ? properties?.find((p) => p.id === transaction.property_id)
                      : null;

                    return (
                      <tr key={transaction.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-primary">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {format(new Date(transaction.created_at), 'HH:mm')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-text-primary">{user?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-text-secondary">{user?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <TypeBadge type={transaction.type} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-primary">{transaction.description || 'N/A'}</p>
                          {property && (
                            <p className="text-xs text-text-secondary">{property.title}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-text-primary">₵{transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-text-secondary">{transaction.currency}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary capitalize">
                            {transaction.payment_method.replace('_', ' ')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={transaction.status} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-text-secondary font-mono">{transaction.reference}</p>
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
              <p className="text-text-secondary">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

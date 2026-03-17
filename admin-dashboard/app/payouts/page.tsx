'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { getPayouts, getUsers, updatePayout, addAdminLog } from '@/lib/data';
import { DollarSign, Search, Filter, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Payout } from '@/lib/types';

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Payout['status'] | 'all'>('all');

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: getPayouts,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const updatePayoutMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: Payout['status']; notes?: string }) =>
      updatePayout(id, { 
        status, 
        admin_notes: notes, 
        paid_at: status === 'paid' ? new Date().toISOString() : null 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });

  const handleStatusChange = async (payout: Payout, status: Payout['status']) => {
    const notes = prompt(`Enter notes for this ${status} payout (optional):`) || '';
    
    updatePayoutMutation.mutate({ id: payout.id, status, notes });

    await addAdminLog({
      action: `payout_${status}`,
      entity_type: 'payout',
      entity_id: payout.id,
      details: { amount: payout.amount, user_id: payout.user_id, notes },
    });
  };

  const filteredPayouts = payouts?.filter((payout) => {
    const user = users?.find((u) => u.id === payout.user_id);
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = 
      user?.full_name?.toLowerCase().includes(query) ||
      user?.email?.toLowerCase().includes(query) ||
      payout.account_details.account_number.includes(query) ||
      payout.account_details.provider.toLowerCase().includes(query);

    const matchesStatus = selectedStatus === 'all' || payout.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Payout Requests</h1>
            <p className="text-text-secondary">Manage and process host withdrawal requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pending Requests</p>
                <h3 className="text-2xl font-bold text-text-primary">
                  {payouts?.filter(p => p.status === 'pending').length || 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Paid This Month</p>
                <h3 className="text-2xl font-bold text-text-primary">
                  ₵{payouts?.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0).toLocaleString() || 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-primary-light text-primary">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Payouts</p>
                <h3 className="text-2xl font-bold text-text-primary">
                  ₵{payouts?.reduce((acc, p) => acc + (p.status === 'paid' ? p.amount : 0), 0).toLocaleString() || 0}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-6 py-3 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12">
              <LoadingLogo label="Loading payouts..." />
            </div>
          ) : filteredPayouts && filteredPayouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-text-primary">Host / User</th>
                    <th className="px-6 py-4 font-semibold text-text-primary">Amount</th>
                    <th className="px-6 py-4 font-semibold text-text-primary">Method & Details</th>
                    <th className="px-6 py-4 font-semibold text-text-primary">Date</th>
                    <th className="px-6 py-4 font-semibold text-text-primary">Status</th>
                    <th className="px-6 py-4 font-semibold text-text-primary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPayouts.map((payout) => {
                    const user = users?.find((u) => u.id === payout.user_id);
                    return (
                      <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                              {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary">{user?.full_name || 'Unknown User'}</p>
                              <p className="text-sm text-text-secondary">{user?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-text-primary">₵{payout.amount.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold text-text-primary capitalize">{payout.method.replace('_', ' ')}</p>
                            <p className="text-text-secondary">{payout.account_details.provider}</p>
                            <p className="text-text-secondary font-mono">{payout.account_details.account_number}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {format(new Date(payout.requested_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                            payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {payout.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {payout.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleStatusChange(payout, 'paid')}
                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                title="Mark as Paid"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(payout, 'rejected')}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          )}
                          {payout.paid_at && (
                            <p className="text-xs text-text-secondary">
                              Paid: {format(new Date(payout.paid_at), 'MMM dd')}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center">
              <DollarSign className="mx-auto text-text-muted mb-4" size={48} />
              <p className="text-text-secondary">No payout requests found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

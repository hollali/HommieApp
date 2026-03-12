'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, addAdminLog } from '@/lib/data';
import { User, VerificationStatus } from '@/lib/types';
import { Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle, UserCheck, FileText, Eye, MoreVertical, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

async function fetchUsers(
  status?: VerificationStatus | 'all', 
  search?: string,
  role?: string | 'all'
): Promise<User[]> {
  let users = await getUsers();

  // Filter by verification status
  if (status && status !== 'all') {
    users = users.filter((u) => u.verification_status === status);
  }

  // Filter by role
  if (role && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.toLowerCase().includes(searchLower)
    );
  }

  // Sort by verification_requested_at or created_at
  return users.sort((a, b) => {
    const timeA = new Date(a.verification_requested_at || a.created_at).getTime();
    const timeB = new Date(b.verification_requested_at || b.created_at).getTime();
    return timeB - timeA;
  });
}

export default function VerificationPage() {
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users', selectedStatus, searchQuery, selectedRole],
    queryFn: () => fetchUsers(selectedStatus, searchQuery, selectedRole),
  });

  const approveVerification = useMutation({
    mutationFn: async (userId: string) => {
      await updateUser(userId, { verification_status: 'verified' });
      addAdminLog({
        action: 'approved_verification',
        entity_type: 'user',
        entity_id: userId,
        details: { message: 'User verification approved by admin' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const rejectVerification = useMutation({
    mutationFn: async (userId: string) => {
      await updateUser(userId, { verification_status: 'rejected' });
      addAdminLog({
        action: 'rejected_verification',
        entity_type: 'user',
        entity_id: userId,
        details: { message: 'User verification rejected by admin' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const pendingVerification = useMutation({
    mutationFn: async (userId: string) => {
      await updateUser(userId, { verification_status: 'pending' });
      addAdminLog({
        action: 'pending_verification',
        entity_type: 'user',
        entity_id: userId,
        details: { message: 'User verification set to pending' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const stats = useMemo(() => {
    if (!users) return { total: 0, verified: 0, pending: 0, rejected: 0, unverified: 0 };
    
    return {
      total: users.length,
      verified: users.filter(u => u.verification_status === 'verified').length,
      pending: users.filter(u => u.verification_status === 'pending').length,
      rejected: users.filter(u => u.verification_status === 'rejected').length,
      unverified: users.filter(u => !u.verification_status || u.verification_status === 'unverified').length,
    };
  }, [users]);

  const getVerificationBadge = (status?: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unverified
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingLogo />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Verification</h1>
          <p className="text-gray-600">Manage user verification status and identity verification requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-2xl font-bold text-gray-600">{stats.unverified}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VerificationStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="unverified">Unverified</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="airbnb_host">Airbnb Hosts</option>
                <option value="landlord">Landlords</option>
                <option value="agent">Agents</option>
                <option value="tenant">Tenants</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getVerificationBadge(user.verification_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {user.verification_status !== 'verified' && (
                          <button
                            onClick={() => approveVerification.mutate(user.id)}
                            disabled={approveVerification.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {user.verification_status !== 'rejected' && user.verification_status !== 'unverified' && (
                          <button
                            onClick={() => rejectVerification.mutate(user.id)}
                            disabled={rejectVerification.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {user.verification_status === 'unverified' && (
                          <button
                            onClick={() => pendingVerification.mutate(user.id)}
                            disabled={pendingVerification.isPending}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => setViewingUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verification Review: {viewingUser.full_name}</h2>
                <p className="text-sm text-gray-500">
                  Role: <span className="font-semibold uppercase">{viewingUser.role}</span> | 
                  Requested: {viewingUser.verification_requested_at ? new Date(viewingUser.verification_requested_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Registration Data</p>
                  <p className="text-sm">Email: {viewingUser.email || 'N/A'}</p>
                  <p className="text-sm">Phone: {viewingUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Current Status</p>
                  {getVerificationBadge(viewingUser.verification_status)}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900">
                  <FileText className="w-4 h-4 text-blue-600" /> Submitted Documents
                </h3>
                {viewingUser.verification_documents && viewingUser.verification_documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {viewingUser.verification_documents.map((doc, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden bg-gray-50">
                        <div className="p-2 border-b bg-white flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Document #{idx + 1}</span>
                          <a href={doc} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
                            Open full size
                          </a>
                        </div>
                        <img 
                          src={doc} 
                          alt={`Document ${idx + 1}`} 
                          className="w-full h-auto max-h-[400px] object-contain"
                          onError={(e) => {
                             (e.target as any).src = 'https://placehold.co/400x200?text=Document+Preview+Unavailable';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-lg text-center bg-gray-50">
                    <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">No documents submitted yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  rejectVerification.mutate(viewingUser.id);
                  setViewingUser(null);
                }}
                className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                Reject Request
              </button>
              <button
                onClick={() => {
                  approveVerification.mutate(viewingUser.id);
                  setViewingUser(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md transition-colors"
              >
                Approve Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

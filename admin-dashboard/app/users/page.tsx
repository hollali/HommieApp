'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, addAdminLog } from '@/lib/data';
import { User } from '@/lib/types';
import { Search, Filter, MoreVertical, Ban, UserCheck, Mail, Phone, Users } from 'lucide-react';
import { useState, useMemo } from 'react';

async function fetchUsers(role?: string, search?: string): Promise<User[]> {
  let users = await getUsers();

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

  // Sort by created_at descending
  return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function UsersPage() {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users', selectedRole, searchQuery],
    queryFn: () => fetchUsers(selectedRole, searchQuery),
  });

  const suspendUser = useMutation({
    mutationFn: async (userId: string) => {
      await updateUser(userId, { is_suspended: true });
      addAdminLog({
        action: 'suspended_user',
        entity_type: 'user',
        entity_id: userId,
        details: { action: 'suspend' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const activateUser = useMutation({
    mutationFn: async (userId: string) => {
      await updateUser(userId, { is_suspended: false });
      addAdminLog({
        action: 'activated_user',
        entity_type: 'user',
        entity_id: userId,
        details: { action: 'activate' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">User Management</h1>
            <p className="text-text-secondary">Manage platform users</p>
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
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-muted" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="all">All Roles</option>
                <option value="tenant">Tenants</option>
                <option value="airbnb_host">Airbnb Hosts</option>
                <option value="landlord">Landlords</option>
                <option value="agent">Agents</option>
                <option value="admin">Admins</option>
                <option value="super_admin">Super Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingLogo label="Loading users..." />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {user.full_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-text-secondary">{user.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'landlord' ? 'bg-green-100 text-green-700' :
                          user.role === 'airbnb_host' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'airbnb_host'
                            ? 'Airbnb Host'
                            : user.role === 'super_admin'
                              ? 'Super Admin'
                              : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Mail size={14} />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Phone size={14} />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_suspended
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {user.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.is_suspended ? (
                            <button
                              onClick={() => activateUser.mutate(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Activate user"
                            >
                              <UserCheck size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => suspendUser.mutate(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Suspend user"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary">No users found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

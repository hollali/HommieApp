'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addAdminLog, getProperties, updateProperty } from '@/lib/data';
import { Property, ListingStatus } from '@/lib/types';
import { Search, Filter, CheckCircle, XCircle, Ban, Eye, Building2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

async function fetchProperties(status?: ListingStatus | 'all', search?: string): Promise<Property[]> {
  let properties = await getProperties();

  // Filter by status
  if (status && status !== 'all') {
    properties = properties.filter((p) => p.status === status);
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    properties = properties.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.area?.toLowerCase().includes(searchLower) ||
        p.city?.toLowerCase().includes(searchLower)
    );
  }

  // Sort by created_at descending
  return properties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function PropertiesPage() {
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties', 'admin', selectedStatus, searchQuery],
    queryFn: () => fetchProperties(selectedStatus, searchQuery),
  });

  const updatePropertyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ListingStatus }) => {
      await updateProperty(id, { status, is_available: status === 'approved' });
      await addAdminLog({
        action:
          status === 'approved'
            ? 'approved_property'
            : status === 'rejected'
              ? 'rejected_property'
              : status === 'suspended'
                ? 'suspended_property'
                : 'updated_property',
        entity_type: 'property',
        entity_id: id,
        details: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const toggleVerification = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      await updateProperty(id, { is_verified: isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const getStatusBadge = (status: ListingStatus, isVerified: boolean) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-gray-100 text-gray-700',
    };

    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {isVerified && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            ✓ Verified
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Property Management</h1>
          <p className="text-text-secondary">Review and manage property listings</p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-muted" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ListingStatus | 'all')}
                className="px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingLogo label="Loading properties..." />
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="divide-y divide-border">
              {properties.map((property) => (
                <div key={property.id} className="p-6 hover:bg-background transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Building2 size={32} className="text-text-muted" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary mb-1">
                                {property.title}
                              </h3>
                              <p className="text-sm text-text-secondary mb-2">
                                {property.area}, {property.city}, {property.region}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary mb-1">
                                ₵{property.price.toLocaleString()}/{property.payment_type}
                              </p>
                              {getStatusBadge(property.status, property.is_verified)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                            <span>{property.type.charAt(0).toUpperCase() + property.type.slice(1)}</span>
                            {property.bedrooms && <span>{property.bedrooms} beds</span>}
                            {property.bathrooms && <span>{property.bathrooms} baths</span>}
                            {property.parking && <span>Parking</span>}
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            Owner: {property.owner?.full_name || 'Unknown'} ({property.owner?.email || 'No email'})
                          </p>
                          <p className="text-xs text-text-muted">
                            Created: {new Date(property.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updatePropertyStatus.mutate({ id: property.id, status: 'approved' })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() => updatePropertyStatus.mutate({ id: property.id, status: 'rejected' })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                      {property.status === 'approved' && (
                        <button
                          onClick={() => updatePropertyStatus.mutate({ id: property.id, status: 'suspended' })}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <Ban size={20} />
                        </button>
                      )}
                      {property.status === 'suspended' && (
                        <button
                          onClick={() => updatePropertyStatus.mutate({ id: property.id, status: 'approved' })}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleVerification.mutate({ id: property.id, isVerified: !property.is_verified })}
                        className={`p-2 rounded-lg transition-colors ${
                          property.is_verified
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={property.is_verified ? 'Remove verification' : 'Verify listing'}
                      >
                        <CheckCircle size={20} className={property.is_verified ? 'fill-current' : ''} />
                      </button>
                      <Link
                        href={`/properties/${property.id}`}
                        className="p-2 text-primary hover:bg-primary-light rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Building2 size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary">No properties found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

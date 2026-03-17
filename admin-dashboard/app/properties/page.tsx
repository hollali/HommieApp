'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addAdminLog, getProperties, updateProperty } from '@/lib/data';
import { Property, ListingStatus } from '@/lib/types';
import { Search, Filter, CheckCircle, XCircle, Ban, Eye, Building2, Trash2, CheckSquare, Square, MoreHorizontal } from 'lucide-react';
import { useState, useMemo } from 'react';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties', 'admin', selectedStatus, searchQuery],
    queryFn: () => fetchProperties(selectedStatus, searchQuery),
  });

  const updatePropertyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ListingStatus }) => {
      await updateProperty(id, { status, is_available: status === 'approved' });
      await addAdminLog({
        action: status + '_property',
        entity_type: 'property',
        entity_id: id,
        details: { status },
        severity: status === 'approved' ? 'low' : 'medium',
        category: 'moderation'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ListingStatus }) => {
      await Promise.all(ids.map(id => updateProperty(id, { status, is_available: status === 'approved' })));
      await addAdminLog({
        action: 'bulk_' + status + '_property',
        entity_type: 'property',
        entity_id: 'multiple',
        details: { count: ids.length, ids, status },
        severity: 'high',
        category: 'moderation'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedIds([]);
      alert('Bulk action completed successfully');
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (!properties) return;
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map(p => p.id));
    }
  };

  const getStatusBadge = (status: ListingStatus, isVerified: boolean) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-gray-100 text-gray-700',
    };
    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badges[status]}`}>
          {status}
        </span>
        {isVerified && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Verified
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 relative pb-24">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">Property Control</h1>
            <p className="text-text-secondary">Verify and manage the platform's inventory.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={toggleSelectAll}
               className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl font-semibold hover:bg-background transition-colors"
             >
                {selectedIds.length === properties?.length ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                {selectedIds.length === properties?.length ? 'Deselect All' : 'Select All'}
             </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by title, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-text-primary"
            >
              <option value="all">All Listings</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="p-20 flex justify-center"><LoadingLogo label="Scanning database..." /></div>
          ) : properties?.length ? (
            properties.map(property => (
              <div 
                key={property.id} 
                className={`p-4 bg-surface border rounded-[1.5rem] transition-all hover:shadow-md cursor-pointer ${selectedIds.includes(property.id) ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                onClick={() => toggleSelect(property.id)}
              >
                <div className="flex items-start gap-4">
                   <div className="relative">
                      <div className="w-24 h-24 bg-background rounded-2xl flex items-center justify-center border border-border overflow-hidden">
                        <Building2 className="text-text-muted w-10 h-10" />
                      </div>
                      <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center ${selectedIds.includes(property.id) ? 'bg-primary' : 'bg-background'}`}>
                         {selectedIds.includes(property.id) && <CheckSquare size={14} className="text-white" />}
                      </div>
                   </div>

                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-text-primary leading-tight">{property.title}</h3>
                          <p className="text-sm text-text-secondary">{property.area}, {property.city}</p>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-black text-primary mb-1">₵{property.price.toLocaleString()}</div>
                           {getStatusBadge(property.status, property.is_verified)}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                         <span className="flex items-center gap-1"><Building2 size={12} /> {property.type}</span>
                         <span>{property.bedrooms} Beds</span>
                         <span>{property.bathrooms} Baths</span>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                               {property.owner?.full_name?.[0]}
                            </div>
                            <span className="text-xs text-text-secondary font-semibold">{property.owner?.full_name}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <Link 
                                href={`/properties/${property.id}`}
                                className="p-2 hover:bg-background rounded-xl text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                               <Eye size={18} />
                            </Link>
                            <button 
                               className="p-2 hover:bg-background rounded-xl text-text-secondary"
                               onClick={(e) => { e.stopPropagation(); /* Mini menu */ }}
                            >
                               <MoreHorizontal size={18} />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center bg-surface border border-dashed border-border rounded-3xl">
               <Building2 className="mx-auto w-12 h-12 text-text-muted mb-4" />
               <p className="text-text-secondary font-bold">No properties matched your criteria.</p>
            </div>
          )}
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-text-primary text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 z-50 border border-white/10 backdrop-blur-md">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Actions for</span>
                <span className="text-lg font-bold">{selectedIds.length} Properties</span>
             </div>
             
             <div className="h-8 w-px bg-white/20 mx-2" />

             <div className="flex items-center gap-2">
                <button 
                   onClick={() => bulkUpdateStatus.mutate({ ids: selectedIds, status: 'approved' })}
                   className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white px-5 py-2.5 rounded-2xl transition-all font-bold group"
                >
                   <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                   Approve All
                </button>
                <button 
                   onClick={() => bulkUpdateStatus.mutate({ ids: selectedIds, status: 'rejected' })}
                   className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500 text-red-100 hover:text-white px-5 py-2.5 rounded-2xl transition-all font-bold group"
                >
                   <XCircle size={18} className="group-hover:scale-110 transition-transform" />
                   Reject
                </button>
                <button 
                   onClick={() => bulkUpdateStatus.mutate({ ids: selectedIds, status: 'suspended' })}
                   className="flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500 text-gray-100 hover:text-white px-5 py-2.5 rounded-2xl transition-all font-bold group"
                >
                   <Ban size={18} className="group-hover:scale-110 transition-transform" />
                   Suspend
                </button>
                <div className="h-8 w-px bg-white/20 mx-2" />
                <button 
                   onClick={() => { if(confirm('Delete these listings forever?')) { /* Bulk delete */ } }}
                   className="p-2.5 bg-white/10 hover:bg-red-600 text-white rounded-2xl transition-all"
                >
                   <Trash2 size={20} />
                </button>
             </div>
             <button 
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-white/70 hover:text-white underline underline-offset-4"
             >
                Cancel
             </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

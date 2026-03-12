'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { cleanupExpiredFeaturedListings, getProperties, getFeaturedBoosts, updateProperty } from '@/lib/data';
import { Building2, Star, TrendingUp, Search, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { createTransactionRecord, generatePaymentReference, processPaystackPaymentFlow } from '@/lib/payments';

async function fetchFeaturedListings() {
  const properties = await getProperties();
  const now = Date.now();
  return properties.filter((p) => {
    if (p.is_featured && p.featured_until) {
      return new Date(p.featured_until).getTime() > now;
    }
    return false;
  });
}

async function fetchFeaturedBoosts() {
  return getFeaturedBoosts();
}

function BoostCard({
  boost,
  property,
  onCharge,
  processing,
}: {
  boost: any;
  property: any;
  onCharge: (boost: any) => void;
  processing: boolean;
}) {
  const now = Date.now();
  const endDate = new Date(boost.end_date);
  const isActive = endDate.getTime() > now;
  const daysRemaining = Math.ceil((endDate.getTime() - now) / (24 * 60 * 60 * 1000));

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-text-primary mb-2">{property.title}</h3>
          <p className="text-sm text-text-secondary mb-4">{property.area}, {property.city}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-primary-light text-primary rounded-full font-semibold">
              {boost.type === 'featured' ? 'Featured' : 'Boosted'}
            </span>
            <span className={`px-3 py-1 rounded-full font-semibold ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {isActive ? `Active • ${daysRemaining} days left` : 'Expired'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-text-primary">₵{boost.amount}</p>
          <p className="text-sm text-text-secondary">{boost.duration_days} days</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-text-secondary pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>Started: {format(new Date(boost.start_date), 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>Ends: {format(new Date(boost.end_date), 'MMM dd, yyyy')}</span>
        </div>
      </div>
      <div className="pt-4 border-t border-border flex justify-end">
        <button
          onClick={() => onCharge(boost)}
          disabled={processing}
          className="px-4 py-2 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {processing ? 'Processing...' : 'Charge via Paystack'}
        </button>
      </div>
    </div>
  );
}

export default function FeaturedListingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'boost'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      const expiredCount = await cleanupExpiredFeaturedListings();
      if (expiredCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['featured-listings'] });
        queryClient.invalidateQueries({ queryKey: ['properties'] });
      }
    })();
  }, [queryClient]);

  const { data: featuredProperties, isLoading } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: fetchFeaturedListings,
  });

  const { data: boosts } = useQuery({
    queryKey: ['featured-boosts'],
    queryFn: fetchFeaturedBoosts,
  });

  const { data: allProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(),
  });

  // Filter boosts
  const filteredBoosts = boosts?.filter((boost) => {
    if (filterType !== 'all' && boost.type !== filterType) return false;
    const property = allProperties?.find((p) => p.id === boost.property_id);
    if (!property) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        property.title.toLowerCase().includes(query) ||
        property.area.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeFeatured = featuredProperties?.length || 0;
  const activeBoosts = boosts?.filter((b) => {
    const endDate = new Date(b.end_date);
    return endDate.getTime() > Date.now() && b.type === 'boost';
  }).length || 0;
  const totalRevenue = boosts?.reduce((sum, b) => sum + b.amount, 0) || 0;

  const handleCharge = async (boost: any) => {
    setProcessingId(boost.id);
    try {
      const response = await processPaystackPaymentFlow({
        amount: boost.amount,
        currency: 'GHS',
        email: 'admin@hommie.com',
        type: boost.type === 'featured' ? 'featured_listing' : 'boost',
        reference: generatePaymentReference('PAYSTACK'),
        metadata: { boost_id: boost.id, property_id: boost.property_id },
      });

      if (response.status !== 'success') {
        alert(response.message || 'Payment initialization failed');
        return;
      }

      if (response.data?.authorization_url) {
        window.open(response.data.authorization_url, '_blank');
      }

      await createTransactionRecord(
        boost.property_id,
        boost.type === 'featured' ? 'featured_listing' : 'boost',
        boost.amount,
        response.data?.reference || generatePaymentReference('PAYSTACK'),
        'paystack',
        boost.property_id,
        undefined,
        { boost_id: boost.id }
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Featured Listings</h1>
          <p className="text-text-secondary">Manage featured and boosted property listings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-primary-light text-primary">
                <Star size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">{activeFeatured}</h3>
            <p className="text-sm text-text-secondary">Featured Listings</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <TrendingUp size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">{activeBoosts}</h3>
            <p className="text-sm text-text-secondary">Active Boosts</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <Building2 size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">{boosts?.length || 0}</h3>
            <p className="text-sm text-text-secondary">Total Boosts</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <TrendingUp size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">₵{totalRevenue.toLocaleString()}</h3>
            <p className="text-sm text-text-secondary">Total Revenue</p>
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
                placeholder="Search by property title, area, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-muted" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'featured' | 'boost')}
                className="px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="all">All Types</option>
                <option value="featured">Featured</option>
                <option value="boost">Boost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Featured Boosts List */}
        <div>
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingLogo label="Loading featured listings..." />
            </div>
          ) : filteredBoosts && filteredBoosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBoosts.map((boost) => {
                const property = allProperties?.find((p) => p.id === boost.property_id);
                if (!property) return null;
                return (
                  <BoostCard
                    key={boost.id}
                    boost={boost}
                    property={property}
                    onCharge={handleCharge}
                    processing={processingId === boost.id}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-surface rounded-3xl p-12 text-center shadow-sm border border-border">
              <Star size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary">No featured listings found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

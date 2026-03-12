'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery } from '@tanstack/react-query';
import { getProperties, getUsers } from '@/lib/data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MapPin, DollarSign } from 'lucide-react';

async function fetchAnalytics() {
  const properties = await getProperties();
  const users = await getUsers();

  return {
    properties,
    users,
  };
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  // Process data for charts
  const locationData = analytics?.properties.reduce((acc: any, prop: any) => {
    const key = `${prop.city}, ${prop.region}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) || {};

  const locationChartData = Object.entries(locationData)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 10);

  const propertyTypeData = analytics?.properties.reduce((acc: any, prop: any) => {
    acc[prop.type] = (acc[prop.type] || 0) + 1;
    return acc;
  }, {}) || {};

  const propertyTypeChartData = Object.entries(propertyTypeData).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));

  const priceRanges = [
    { range: '0-500', min: 0, max: 500 },
    { range: '500-1000', min: 500, max: 1000 },
    { range: '1000-2000', min: 1000, max: 2000 },
    { range: '2000-5000', min: 2000, max: 5000 },
    { range: '5000+', min: 5000, max: Infinity },
  ];

  const priceDistributionData = priceRanges.map((range) => ({
    range: range.range,
    count: analytics?.properties.filter((p: any) => p.price >= range.min && p.price < range.max).length || 0,
  }));

  const COLORS = ['#0066FF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Analytics & Insights</h1>
          <p className="text-text-secondary">Platform performance and trends</p>
        </div>

        {isLoading ? (
          <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-border">
            <LoadingLogo label="Loading analytics..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Listings by Location */}
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary-light rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Listings by Location</h2>
                    <p className="text-sm text-text-secondary">Top 10 cities</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0066FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Property Types Distribution */}
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary-light rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Property Types</h2>
                    <p className="text-sm text-text-secondary">Distribution by type</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={propertyTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertyTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Price Distribution */}
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary-light rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Price Distribution</h2>
                    <p className="text-sm text-text-secondary">Listings by price range (₵)</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="range" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0066FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Total Locations</h3>
                <p className="text-3xl font-bold text-text-primary">{Object.keys(locationData).length}</p>
                <p className="text-xs text-text-muted mt-1">Active cities/regions</p>
              </div>
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Avg. Price</h3>
                <p className="text-3xl font-bold text-text-primary">
                  ₵{analytics?.properties.length
                    ? Math.round(
                        analytics.properties.reduce((sum: number, p: any) => sum + (p.price || 0), 0) /
                          analytics.properties.length
                      ).toLocaleString()
                    : 0}
                </p>
                <p className="text-xs text-text-muted mt-1">Across all listings</p>
              </div>
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Most Popular Type</h3>
                <p className="text-3xl font-bold text-text-primary">
                  {propertyTypeChartData[0]?.type || 'N/A'}
                </p>
                <p className="text-xs text-text-muted mt-1">Property category</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

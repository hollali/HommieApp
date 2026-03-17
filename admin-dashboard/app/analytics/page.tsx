'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsData } from '@/lib/data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, MapPin, DollarSign, Users, Calendar, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-full'],
    queryFn: getAnalyticsData,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingLogo label="Generating insights..." />
        </div>
      </DashboardLayout>
    );
  }

  // Monthly Revenue Growth
  const revenueByMonth = (analytics?.transactions || [])
    .filter(t => t.status === 'completed')
    .reduce((acc: any, t) => {
      const month = new Date(t.created_at).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + Number(t.amount);
      return acc;
    }, {});

  const revenueChartData = Object.entries(revenueByMonth).map(([month, amount]) => ({
    month,
    amount,
  }));

  // Booking Trends
  const bookingsByMonth = (analytics?.bookings || []).reduce((acc: any, b) => {
    const month = new Date(b.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const bookingChartData = Object.entries(bookingsByMonth).map(([month, count]) => ({
    month,
    count,
  }));

  // Property Segments
  const typeData = (analytics?.properties || []).reduce((acc: Record<string, number>, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(typeData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // User Roles
  const roleData = (analytics?.users || []).reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const userPieData = Object.entries(roleData).map(([name, value]) => ({
    name: name.replace('_', ' ').charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-2">Platform Intelligence</h1>
            <p className="text-text-secondary text-lg">Real-time data visualization and growth performance</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-green-50 text-green-700 px-4 py-2 rounded-2xl flex items-center gap-2 font-bold border border-green-100">
                <ArrowUpRight size={20} />
                +12.5% Growth
             </div>
             <div className="bg-surface border border-border px-4 py-2 rounded-2xl text-text-secondary font-semibold">
                Last 30 Days
             </div>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Revenue" 
            value={`₵${analytics?.transactions.reduce((s,t) => s + (t.status === 'completed' ? Number(t.amount) : 0), 0).toLocaleString()}`} 
            change="+8.2%" 
            icon={<DollarSign className="text-primary" />} 
          />
          <MetricCard 
            title="Active Users" 
            value={analytics?.users.length || 0} 
            change="+4.1%" 
            icon={<Users className="text-blue-500" />} 
          />
          <MetricCard 
            title="Total Bookings" 
            value={analytics?.bookings.length || 0} 
            change="+15.5%" 
            icon={<Calendar className="text-green-500" />} 
          />
          <MetricCard 
            title="New Listings" 
            value={analytics?.properties.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0} 
            change="+2.4%" 
            trend="up"
            icon={<MapPin className="text-orange-500" />} 
          />
        </div>

        {/* Chart Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Growth */}
          <div className="bg-surface rounded-[2rem] p-8 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h2 className="text-xl font-bold text-text-primary">Revenue Growth</h2>
                  <p className="text-sm text-text-secondary">Gross revenue trends across all services</p>
               </div>
               <div className="p-3 bg-primary/10 rounded-2xl">
                 <TrendingUp className="text-primary w-6 h-6" />
               </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#0066FF" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Volume */}
          <div className="bg-surface rounded-[2rem] p-8 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h2 className="text-xl font-bold text-text-primary">Booking Volume</h2>
                  <p className="text-sm text-text-secondary">Monthly reservation frequency</p>
               </div>
               <div className="p-3 bg-green-50 rounded-2xl">
                 <Calendar className="text-green-600 w-6 h-6" />
               </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Distribution */}
          <div className="bg-surface rounded-[2rem] p-8 shadow-sm border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-2">User Ecosystem</h2>
            <p className="text-sm text-text-secondary mb-8">Breakdown of platform participants</p>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 ml-4">
                 {userPieData.map((d, i) => (
                   <div key={d.name} className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                      {d.name}: {d.value}
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Property Inventory */}
          <div className="bg-surface rounded-[2rem] p-8 shadow-sm border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-2">Inventory Mix</h2>
            <p className="text-sm text-text-secondary mb-8">Distribution of property types</p>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Geographic Insights */}
        <div className="bg-surface rounded-[2.5rem] p-8 shadow-sm border border-border">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h2 className="text-2xl font-black text-text-primary tracking-tight">Geographic Insights</h2>
                 <p className="text-text-secondary">Property concentration and market activity by city.</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-[1.5rem] border border-orange-100">
                 <MapPin className="text-orange-600 w-8 h-8" />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-background/50 rounded-[2rem] p-6 border border-border relative overflow-hidden h-[400px]">
                 {/* Visual representation of a map or list */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 grayscale pointer-events-none">
                    <MapPin size={200} />
                 </div>
                 <div className="relative z-10 space-y-4">
                    {Object.entries((analytics?.properties || []).reduce((acc: any, p) => {
                      acc[p.city] = (acc[p.city] || 0) + 1;
                      return acc;
                    }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([city, count]: any, idx) => (
                      <div key={city} className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-primary shadow-sm border border-border">
                            {idx + 1}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-end mb-1">
                               <span className="font-bold text-text-primary">{city}</span>
                               <span className="text-sm font-black text-primary">{count} listings</span>
                            </div>
                            <div className="h-3 bg-white rounded-full overflow-hidden border border-border/50 shadow-inner">
                               <div 
                                 className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000" 
                                 style={{ width: `${(count / (analytics?.properties.length || 1)) * 100}%` }}
                               />
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="p-6 bg-white rounded-[2rem] border border-border shadow-sm">
                    <h3 className="font-black text-text-primary mb-1">Market Leader</h3>
                    <p className="text-sm text-text-secondary mb-4">Accra remains the primary hub for listings.</p>
                    <div className="text-4xl font-black text-primary">64%</div>
                    <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">Share of Inventory</p>
                 </div>
                 <div className="p-6 bg-white rounded-[2rem] border border-border shadow-sm">
                    <h3 className="font-black text-text-primary mb-1">Emerging Area</h3>
                    <p className="text-sm text-text-secondary mb-4">Kumasi has seen 22% growth this month.</p>
                    <div className="text-4xl font-black text-green-600">+22%</div>
                    <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">MoM Listing Growth</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, change, icon, trend = 'up' }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border group hover:border-primary/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-background rounded-2xl group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        </div>
      </div>
      <h3 className="text-text-secondary font-semibold text-sm mb-1">{title}</h3>
      <p className="text-3xl font-extrabold text-text-primary">{value}</p>
    </div>
  );
}

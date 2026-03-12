import {
  User,
  Property,
  Report,
  Subscription,
  Transaction,
  FeaturedBoost,
  DashboardStats,
  RevenueStats,
  ListingStatus,
  ReportStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from './types';
import {
  getMockUsers,
  updateMockUser,
  getMockProperties,
  updateMockProperty,
  getMockReports,
  updateMockReport,
  getMockSubscriptions,
  getMockTransactions,
  getMockFeaturedBoosts,
  getDashboardStats as getMockDashboardStats,
  getRevenueStats as getMockRevenueStats,
  addAdminLog as addMockAdminLog,
  getMockAdminLogs,
  getMockAdmins,
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';

async function safeSelect<T>(table: string, select = '*'): Promise<T[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from(table).select(select);
  if (error) return null;
  return (data || []) as T[];
}

function normalizeUser(user: any): User {
  return {
    id: user.id,
    full_name: user.full_name ?? user.fullName ?? null,
    phone: user.phone ?? null,
    email: user.email ?? null,
    role: (user.role as User['role']) || 'tenant',
    created_at: user.created_at || new Date().toISOString(),
    is_suspended: user.is_suspended ?? false,
    last_login: user.last_login ?? null,
    verification_status: user.verification_status,
    verification_documents: user.verification_documents,
    verification_requested_at: user.verification_requested_at,
    subscription_plan: user.subscription_plan,
    subscription_status: user.subscription_status,
    subscription_start_date: user.subscription_start_date,
    subscription_end_date: user.subscription_end_date,
  };
}

function normalizeProperty(property: any): Property {
  return {
    id: property.id,
    owner_id: property.owner_id,
    title: property.title,
    description: property.description ?? null,
    type: property.type,
    price: Number(property.price || 0),
    payment_type: property.payment_type,
    region: property.region,
    city: property.city,
    area: property.area,
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    furnished: property.furnished ?? false,
    parking: property.parking ?? false,
    amenities: property.amenities ?? [],
    is_available: property.is_available ?? true,
    status: property.status || 'pending',
    is_verified: property.is_verified ?? false,
    created_at: property.created_at || new Date().toISOString(),
    updated_at: property.updated_at,
    is_featured: property.is_featured ?? false,
    is_boosted: property.is_boosted ?? false,
    featured_until: property.featured_until ?? null,
    boosted_until: property.boosted_until ?? null,
    verification_fee_paid: property.verification_fee_paid ?? false,
  };
}

export async function getUsers(): Promise<User[]> {
  const data = await safeSelect<User>('users');
  if (!data) return getMockUsers();
  return data.map(normalizeUser);
}

export async function updateUser(userId: string, updates: Partial<User>) {
  if (!isSupabaseConfigured) {
    updateMockUser(userId, updates);
    return;
  }
  const { error } = await supabase.from('users').update(updates).eq('id', userId);
  if (error) {
    updateMockUser(userId, updates);
  }
}

export async function getProperties(): Promise<Property[]> {
  const data = await safeSelect<Property>('properties');
  if (!data) return getMockProperties();
  return data.map(normalizeProperty);
}

export async function updateProperty(propertyId: string, updates: Partial<Property>) {
  if (!isSupabaseConfigured) {
    updateMockProperty(propertyId, updates);
    return;
  }
  const { error } = await supabase.from('properties').update(updates).eq('id', propertyId);
  if (error) {
    updateMockProperty(propertyId, updates);
  }
}

export async function cleanupExpiredFeaturedListings(): Promise<number> {
  const properties = await getProperties();
  const now = Date.now();
  const expired = properties.filter(
    (p) => p.is_featured && p.featured_until && new Date(p.featured_until).getTime() <= now
  );

  if (expired.length === 0) return 0;

  await Promise.all(
    expired.map((property) =>
      updateProperty(property.id, { is_featured: false, featured_until: null })
    )
  );

  await addAdminLog({
    action: 'expired_featured_cleanup',
    entity_type: 'property',
    entity_id: expired[0].id,
    details: { count: expired.length },
  });

  return expired.length;
}

export async function getReports(): Promise<Report[]> {
  const data = await safeSelect<Report>('reports');
  if (!data) return getMockReports();
  return data;
}

export async function updateReport(reportId: string, updates: Partial<Report>) {
  if (!isSupabaseConfigured) {
    updateMockReport(reportId, updates);
    return;
  }
  const { error } = await supabase.from('reports').update(updates).eq('id', reportId);
  if (error) {
    updateMockReport(reportId, updates);
  }
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const data = await safeSelect<Subscription>('subscriptions');
  if (!data) return getMockSubscriptions();

  const users = await getUsers();
  const subscriptionUsers = new Set(data.map((sub) => sub.user_id));
  const derived = users
    .filter((u) => u.subscription_plan)
    .filter((u) => !subscriptionUsers.has(u.id))
    .map((u) => ({
      id: `sub_${u.id}`,
      user_id: u.id,
      plan: u.subscription_plan || 'free',
      status: u.subscription_status || 'active',
      start_date: u.subscription_start_date || new Date().toISOString(),
      end_date: u.subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: u.subscription_plan === 'basic' ? 100 : 0,
      created_at: u.subscription_start_date || new Date().toISOString(),
    }));

  return [...data, ...derived];
}

export async function createSubscriptionRecord(input: {
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  amount: number;
}) {
  if (!isSupabaseConfigured) return;
  await supabase.from('subscriptions').insert([
    {
      user_id: input.user_id,
      plan: input.plan,
      status: input.status,
      start_date: input.start_date,
      end_date: input.end_date,
      amount: input.amount,
      created_at: input.start_date,
    },
  ]);
}

export async function updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
  if (!isSupabaseConfigured) return;
  await supabase.from('subscriptions').update({ status }).eq('id', subscriptionId);
}

export async function getTransactions(): Promise<Transaction[]> {
  const data = await safeSelect<Transaction>('transactions');
  if (!data) return getMockTransactions();
  return data;
}

export async function getFeaturedBoosts(): Promise<FeaturedBoost[]> {
  const data = await safeSelect<FeaturedBoost>('featured_boosts');
  if (!data) return getMockFeaturedBoosts();
  return data;
}

export async function addAdminLog(input: {
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  admin_id?: string;
}) {
  const adminId = input.admin_id || 'admin_1';
  if (!isSupabaseConfigured) {
    addMockAdminLog({
      admin_id: adminId,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      details: input.details || {},
    });
    return;
  }
  await supabase.from('admin_logs').insert([
    {
      admin_id: adminId,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      details: input.details || {},
    },
  ]);
}

export async function getAdminLogs() {
  if (!isSupabaseConfigured) {
    return getMockAdminLogs();
  }
  const { data } = await supabase.from('admin_logs').select('*').order('timestamp', { ascending: false }).limit(10);
  return data || [];
}

export async function getAdmins() {
  if (!isSupabaseConfigured) {
    const { getMockAdmins } = await import('./mockData');
    return getMockAdmins();
  }
  const { data } = await supabase.from('admin_users').select('*');
  return data || [];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured) {
    return getMockDashboardStats();
  }

  const [users, properties, reports] = await Promise.all([
    getUsers(),
    getProperties(),
    getReports(),
  ]);

  const today = new Date();
  const isToday = (date: string) => {
    const d = new Date(date);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  return {
    totalUsers: users.length,
    totalListings: properties.length,
    activeListings: properties.filter((p) => p.status === 'approved').length,
    pendingApprovals: properties.filter((p) => p.status === 'pending').length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    verifiedListings: properties.filter((p) => p.is_verified).length,
    pendingVerifications: users.filter((u) => u.verification_status === 'pending').length,
    verifiedUsers: users.filter((u) => u.verification_status === 'verified').length,
    newUsersToday: users.filter((u) => u.created_at && isToday(u.created_at)).length,
    newListingsToday: properties.filter((p) => p.created_at && isToday(p.created_at)).length,
  };
}

export async function getRevenueStats(): Promise<RevenueStats> {
  if (!isSupabaseConfigured) {
    return getMockRevenueStats();
  }

  const transactions = await getTransactions();
  const completed = transactions.filter((t) => t.status === 'completed');
  const total = completed.reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthly = completed.reduce((sum, t) => sum + (t.type === 'subscription' ? t.amount : 0), 0);
  const featured = completed.reduce((sum, t) => sum + (t.type === 'featured_listing' ? t.amount : 0), 0);
  const verification = completed.reduce((sum, t) => sum + (t.type === 'verification' ? t.amount : 0), 0);

  const today = new Date();
  const todayTotal = completed
    .filter((t) => t.created_at && new Date(t.created_at).toDateString() === today.toDateString())
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    total_revenue: total,
    monthly_revenue: monthly,
    today_revenue: todayTotal,
    active_subscriptions: (await getSubscriptions()).filter((s) => s.status === 'active').length,
    subscriptions_revenue: monthly,
    featured_revenue: featured,
    verification_revenue: verification,
    transaction_count: transactions.length,
    featured_listings_count: (await getFeaturedBoosts()).filter((b) => b.type === 'featured').length,
  };
}

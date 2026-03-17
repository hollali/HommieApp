// Mock Data Service for Admin Dashboard
// Uses localStorage for persistence (similar to AsyncStorage in mobile app)

import {
  User,
  Property,
  Admin,
  AdminLog,
  Report,
  DashboardStats,
  ListingStatus,
  ReportStatus,
  ReportReason,
  AdminRole,
  UserRole,
  PropertyType,
  Subscription,
  Transaction,
  SubscriptionPlan,
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  FeaturedBoost,
  RevenueStats,
  PricingPlan,
  SupportTicket,
  Booking,
} from './types';

const STORAGE_KEYS = {
  USERS: 'hommie_admin:users',
  PROPERTIES: 'hommie_admin:properties',
  ADMINS: 'hommie_admin:admins',
  ADMIN_LOGS: 'hommie_admin:admin_logs',
  REPORTS: 'hommie_admin:reports',
  SESSION: 'hommie_admin:session',
  SUBSCRIPTIONS: 'hommie_admin:subscriptions',
  TRANSACTIONS: 'hommie_admin:transactions',
  FEATURED_BOOSTS: 'hommie_admin:featured_boosts',
  SUPPORT_TICKETS: 'hommie_admin:support_tickets',
};

// Initialize flag to prevent circular calls
let isInitializing = false;

// Initialize with sample data if empty
export function initializeMockData() {
  if (typeof window === 'undefined') return;
  
  // Prevent recursive calls
  if (isInitializing) return;
  isInitializing = true;

  try {
    // Users
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(generateMockUsers()));
    }

    // Admins (needed for properties)
    if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(generateMockAdmins()));
    }

    // Properties - get users directly from localStorage to avoid recursion
    if (!localStorage.getItem(STORAGE_KEYS.PROPERTIES)) {
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(generateMockProperties(users)));
    }

    // Reports - get data directly from localStorage
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
      const propertiesData = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
      const users = usersData ? JSON.parse(usersData) : [];
      const properties = propertiesData ? JSON.parse(propertiesData) : [];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(generateMockReports(users, properties)));
    }

    // Admin Logs - get admins directly from localStorage
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_LOGS)) {
      const adminsData = localStorage.getItem(STORAGE_KEYS.ADMINS);
      const admins = adminsData ? JSON.parse(adminsData) : [];
      localStorage.setItem(STORAGE_KEYS.ADMIN_LOGS, JSON.stringify(generateMockAdminLogs(admins)));
    }

    // Support Tickets
    if (!localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS)) {
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(generateMockSupportTickets(users)));
    }
  } finally {
    isInitializing = false;
  }
}

// Generate Mock Data
function generateMockUsers(): User[] {
  const now = Date.now();
  return [
    {
      id: 'user_1',
      full_name: 'Kwame Asante',
      phone: '+233241234567',
      email: 'kwame@example.com',
      role: 'tenant',
      created_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_2',
      full_name: 'Ama Osei',
      phone: '+233242345678',
      email: 'ama@example.com',
      role: 'landlord',
      created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      subscription_plan: 'basic',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_3',
      full_name: 'Kofi Mensah',
      phone: '+233243456789',
      email: 'kofi@example.com',
      role: 'agent',
      created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      verification_status: 'verified',
      subscription_plan: 'pro',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_3b',
      full_name: 'Eunice Marfo',
      phone: '+233241119999',
      email: 'eunice@example.com',
      role: 'airbnb_host',
      created_at: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      verification_status: 'verified',
    },
    {
      id: 'user_4',
      full_name: 'Esi Darko',
      phone: '+233244567890',
      email: 'esi@example.com',
      role: 'tenant',
      created_at: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
    },
    {
      id: 'user_5',
      full_name: 'Yaw Boateng',
      phone: '+233245678901',
      email: 'yaw@example.com',
      role: 'landlord',
      created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: true,
      last_login: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_6',
      full_name: 'Abena Kumi',
      phone: '+233246789012',
      email: 'abena@example.com',
      role: 'agent',
      created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 30 * 60 * 1000).toISOString(),
      subscription_plan: 'pro',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_7',
      full_name: 'Nana Owusu',
      phone: '+233247890123',
      email: 'nana@example.com',
      role: 'tenant',
      created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
    },
    {
      id: 'user_8',
      full_name: 'Akosua Frimpong',
      phone: '+233248901234',
      email: 'akosua@example.com',
      role: 'landlord',
      created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_9',
      full_name: 'Kweku Adjei',
      phone: '+233249012345',
      email: 'kweku@example.com',
      role: 'tenant',
      created_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
    },
    {
      id: 'user_10',
      full_name: 'Maame Adu',
      phone: '+233240123456',
      email: 'maame@example.com',
      role: 'agent',
      created_at: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      is_suspended: false,
      last_login: new Date(now - 45 * 60 * 1000).toISOString(),
    },
  ];
}

function generateMockProperties(users: User[]): Property[] {
  const now = Date.now();
  const landlords = users.filter((u) => u.role === 'landlord' || u.role === 'agent' || u.role === 'airbnb_host');
  const statuses: ListingStatus[] = ['pending', 'approved', 'approved', 'approved', 'rejected', 'suspended'];
  const types: PropertyType[] = ['apartment', 'house', 'hostel', 'store', 'airbnb', 'office'];
  const regions = ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central'];
  const cities = {
    'Greater Accra': ['Accra', 'Tema', 'Madina'],
    'Ashanti': ['Kumasi', 'Obuasi'],
    'Western': ['Takoradi', 'Sekondi'],
    'Eastern': ['Koforidua', 'Nsawam'],
    'Central': ['Cape Coast', 'Kasoa'],
  };
  const areas = ['East Legon', 'Cantonments', 'Labone', 'Osu', 'Dansoman', 'Tesano', 'Achimota'];

  return Array.from({ length: 25 }, (_, i) => {
    const owner = landlords[Math.floor(Math.random() * landlords.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const city = cities[region as keyof typeof cities][
      Math.floor(Math.random() * cities[region as keyof typeof cities].length)
    ];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const type = owner.role === 'airbnb_host' ? 'airbnb' : types[Math.floor(Math.random() * types.length)];
    const createdDaysAgo = Math.floor(Math.random() * 60);
    const created = new Date(now - createdDaysAgo * 24 * 60 * 60 * 1000);

    return {
      id: `prop_${i + 1}`,
      owner_id: owner.id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} in ${area}, ${city}`,
      description: `Beautiful ${type} located in ${area}. Well maintained with modern amenities.`,
      type,
      price: Math.floor(Math.random() * 5000) + 300,
      payment_type: owner.role === 'airbnb_host'
        ? 'daily'
        : (['daily', 'weekly', 'monthly'][Math.floor(Math.random() * 3)] as 'daily' | 'weekly' | 'monthly'),
      region,
      city,
      area,
      latitude: 5.6 + Math.random() * 0.5,
      longitude: -0.2 + Math.random() * 0.5,
      bedrooms: type === 'office' || type === 'store' ? null : Math.floor(Math.random() * 5) + 1,
      bathrooms: type === 'office' || type === 'store' ? null : Math.floor(Math.random() * 3) + 1,
      furnished: Math.random() > 0.5,
      parking: Math.random() > 0.4,
      amenities: ['WiFi', 'Water', 'Security', 'Electricity'].slice(0, Math.floor(Math.random() * 4) + 1),
      is_available: status === 'approved',
      status,
      is_verified: status === 'approved' && Math.random() > 0.3,
      created_at: created.toISOString(),
      updated_at: Math.random() > 0.7 ? new Date(created.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      // Monetization fields
      is_featured: Math.random() > 0.7,
      is_boosted: Math.random() > 0.8,
      featured_until: Math.random() > 0.7 ? new Date(now + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() : null,
      boosted_until: Math.random() > 0.8 ? new Date(now + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString() : null,
      verification_fee_paid: Math.random() > 0.3,
      owner,
    };
  });
}

function generateMockAdmins(): Admin[] {
  const now = Date.now();
  return [
    {
      id: 'admin_1',
      email: 'admin@hommie.com',
      role: 'super_admin',
      full_name: 'Admin User',
      last_login: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'admin_2',
      email: 'moderator@hommie.com',
      role: 'moderator',
      full_name: 'Moderator User',
      last_login: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'admin_3',
      email: 'support@hommie.com',
      role: 'support',
      full_name: 'Support Agent',
      last_login: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateMockReports(users: User[], properties: Property[]): Report[] {
  const now = Date.now();
  const reasons: ReportReason[] = ['scam', 'incorrect_info', 'inappropriate_content', 'spam', 'other'];
  const statuses: ReportStatus[] = ['pending', 'pending', 'pending', 'resolved', 'dismissed'];
  const tenants = users.filter((u) => u.role === 'tenant');

  return Array.from({ length: 8 }, (_, i) => {
    const reporter = tenants[Math.floor(Math.random() * tenants.length)];
    const isPropertyReport = Math.random() > 0.3;
    const targetProperty = isPropertyReport ? properties[Math.floor(Math.random() * properties.length)] : null;
    const targetUser = !isPropertyReport ? users[Math.floor(Math.random() * users.length)] : null;
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDaysAgo = Math.floor(Math.random() * 14);
    const created = new Date(now - createdDaysAgo * 24 * 60 * 60 * 1000);

    return {
      id: `report_${i + 1}`,
      reporter_id: reporter.id,
      target_type: isPropertyReport ? ('property' as const) : ('user' as const),
      target_id: isPropertyReport ? targetProperty!.id : targetUser!.id,
      reason,
      description: `Report reason: ${reason}. This listing/user seems suspicious.`,
      status,
      admin_notes: status !== 'pending' ? `Resolved by admin: Action taken.` : null,
      created_at: created.toISOString(),
      resolved_at: status !== 'pending' ? new Date(created.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      resolved_by: status !== 'pending' ? 'admin_1' : null,
      reporter,
      target_property: isPropertyReport ? targetProperty! : undefined,
      target_user: !isPropertyReport ? targetUser! : undefined,
    };
  });
}

function generateMockAdminLogs(admins: Admin[]): AdminLog[] {
  const now = Date.now();
  const actions = ['approved_property', 'rejected_property', 'suspended_user', 'verified_property', 'resolved_report'];
  const entityTypes: AdminLog['entity_type'][] = ['property', 'user', 'report'];

  return Array.from({ length: 20 }, (_, i) => {
    const admin = admins[Math.floor(Math.random() * admins.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const createdHoursAgo = Math.floor(Math.random() * 72);
    const created = new Date(now - createdHoursAgo * 60 * 60 * 1000);

    const severity: AdminLog['severity'] = action.includes('suspended') || action.includes('rejected') ? 'high' : 'medium';
    const category: AdminLog['category'] = entityType === 'property' ? 'moderation' : 'moderation';

    return {
      id: `log_${i + 1}`,
      admin_id: admin.id,
      action,
      entity_type: entityType,
      entity_id: `${entityType}_${Math.floor(Math.random() * 10) + 1}`,
      details: { action, timestamp: created.toISOString() },
      timestamp: created.toISOString(),
      severity,
      category,
      admin,
    };
  });
}

function generateMockSupportTickets(users: User[]): SupportTicket[] {
  const now = Date.now();
  const tenants = users.filter(u => u.role === 'tenant' || u.role === 'landlord' || u.role === 'agent');
  const categories: SupportTicket['category'][] = ['billing', 'technical', 'account', 'listing', 'other'];
  const priorities: SupportTicket['priority'][] = ['low', 'medium', 'high', 'critical'];
  const statuses: SupportTicket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];

  return Array.from({ length: 15 }, (_, i) => {
    const user = tenants[Math.floor(Math.random() * tenants.length)];
    const createdDaysAgo = Math.floor(Math.random() * 30);
    const created = i === 0 ? new Date() : new Date(now - createdDaysAgo * 24 * 60 * 60 * 1000);
    
    return {
      id: `ticket_${i + 1}`,
      user_id: user.id || 'system',
      subject: i === 0 ? "URGENT: Payment failure on premium plan" : `Help needed with ${categories[i % categories.length]}`,
      message: "I am having some trouble with my recent transaction. Can you please help me check if it went through? I've tried multiple times but the page keeps loading forever.",
      status: i === 0 ? 'open' : statuses[i % statuses.length],
      priority: i === 0 ? 'critical' : priorities[i % priorities.length],
      category: categories[i % categories.length],
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      user
    };
  });
}

// Getter Functions
export function getMockUsers(): User[] {
  if (typeof window === 'undefined') return [];
  
  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    initializeMockData();
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function getMockProperties(): Property[] {
  if (typeof window === 'undefined') return [];
  
  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.PROPERTIES)) {
    initializeMockData();
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
  const properties: Property[] = data ? JSON.parse(data) : [];
  // Ensure owner data is included
  const users = getMockUsers();
  return properties.map((p) => ({
    ...p,
    owner: users.find((u) => u.id === p.owner_id),
  }));
}

export function getMockAdmins(): Admin[] {
  if (typeof window === 'undefined') return [];
  
  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
    initializeMockData();
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.ADMINS);
  return data ? JSON.parse(data) : [];
}

export function getMockReports(): Report[] {
  if (typeof window === 'undefined') return [];
  
  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    initializeMockData();
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
  const reports: Report[] = data ? JSON.parse(data) : [];
  // Ensure related data is included
  const users = getMockUsers();
  const properties = getMockProperties();
  return reports.map((r) => ({
    ...r,
    reporter: users.find((u) => u.id === r.reporter_id),
    target_property: r.target_type === 'property' ? properties.find((p) => p.id === r.target_id) : undefined,
    target_user: r.target_type === 'user' ? users.find((u) => u.id === r.target_id) : undefined,
  }));
}

export function getMockAdminLogs(): AdminLog[] {
  if (typeof window === 'undefined') return [];
  
  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN_LOGS)) {
    initializeMockData();
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.ADMIN_LOGS);
  const logs: AdminLog[] = data ? JSON.parse(data) : [];
  // Ensure admin data is included
  const admins = getMockAdmins();
  return logs.map((log) => ({
    ...log,
    admin: admins.find((a) => a.id === log.admin_id),
  }));
}

export function getMockSupportTickets(): SupportTicket[] {
  if (typeof window === 'undefined') return [];
  if (!localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS)) {
    initializeMockData();
  }
  const data = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
  const tickets: SupportTicket[] = data ? JSON.parse(data) : [];
  const users = getMockUsers();
  return tickets.map(t => ({
    ...t,
    user: users.find(u => u.id === t.user_id)
  }));
}

// Update Functions
export function updateMockUser(userId: string, updates: Partial<User>): void {
  if (typeof window === 'undefined') return;
  const users = getMockUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
}

export function updateMockProperty(propertyId: string, updates: Partial<Property>): void {
  if (typeof window === 'undefined') return;
  const properties = getMockProperties();
  const index = properties.findIndex((p) => p.id === propertyId);
  if (index >= 0) {
    properties[index] = { ...properties[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  }
  // Log the action
  const currentAdmin = getCurrentAdmin();
  addAdminLog({
    admin_id: currentAdmin?.id || 'admin_1',
    action: `updated_property`,
    entity_type: 'property',
    entity_id: propertyId,
    details: updates,
    severity: 'medium',
    category: 'moderation'
  });
}

export function updateMockReport(reportId: string, updates: Partial<Report>): void {
  if (typeof window === 'undefined') return;
  const reports = getMockReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index >= 0) {
    reports[index] = {
      ...reports[index],
      ...updates,
      resolved_at: updates.status && updates.status !== 'pending' ? new Date().toISOString() : reports[index].resolved_at,
    };
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
  // Log the action
  const currentAdmin = getCurrentAdmin();
  addAdminLog({
    admin_id: currentAdmin?.id || 'admin_1',
    action: `updated_report`,
    entity_type: 'report',
    entity_id: reportId,
    details: updates,
    severity: 'low',
    category: 'moderation'
  });
}

export function addAdminLog(log: Omit<AdminLog, 'id' | 'timestamp' | 'admin'>): void {
  if (typeof window === 'undefined') return;
  const logs = getMockAdminLogs();
  const currentAdmin = getCurrentAdmin();
  const newLog: AdminLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    admin_id: currentAdmin?.id || 'admin_1',
    timestamp: new Date().toISOString(),
    admin: currentAdmin || getMockAdmins()[0],
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.ADMIN_LOGS, JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
}

// Dashboard Stats
export function getDashboardStats(): DashboardStats {
  const users = getMockUsers();
  const properties = getMockProperties();
  const reports = getMockReports();
  const tickets = getMockSupportTickets();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    totalUsers: users.length,
    totalListings: properties.length,
    activeListings: properties.filter((p) => p.is_available && p.status === 'approved').length,
    pendingApprovals: properties.filter((p) => p.status === 'pending').length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    verifiedListings: properties.filter((p) => p.is_verified).length,
    pendingVerifications: users.filter(u => u.verification_status === 'pending').length,
    verifiedUsers: users.filter(u => u.verification_status === 'verified').length,
    newUsersToday: users.filter((u) => new Date(u.created_at) >= today).length,
    newListingsToday: properties.filter((p) => new Date(p.created_at) >= today).length,
    pendingPayouts: 0,
    openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
  };
}

// Auth Functions
export function getCurrentAdmin(): Admin | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!session) return null;
    const { adminId } = JSON.parse(session);
    const admins = getMockAdmins();
    return admins.find((a) => a.id === adminId) || null;
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
}

export function setCurrentAdmin(admin: Admin | null): void {
  if (typeof window === 'undefined') return;
  if (admin) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ adminId: admin.id }));
    // Update last login
    const admins = getMockAdmins();
    const index = admins.findIndex((a) => a.id === admin.id);
    if (index >= 0) {
      admins[index] = { ...admins[index], last_login: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export function mockLogin(email: string, password: string): Admin | null {
  // For demo: password is not checked, just email match
  try {
    // Ensure mock data is initialized
    initializeMockData();
    
    const admins = getMockAdmins();
    if (!admins || admins.length === 0) {
      console.error('No admins found in mock data');
      return null;
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const admin = admins.find((a) => a.email.toLowerCase() === normalizedEmail);
    
    if (admin) {
      setCurrentAdmin(admin);
      console.log('Login successful for:', admin.email);
      return admin;
    } else {
      console.log('Admin not found. Available emails:', admins.map(a => a.email));
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function mockLogout(): void {
  setCurrentAdmin(null);
}

// Monetization Mock Data Generation Functions

function generateMockSubscriptions(users: User[]): Subscription[] {
  const now = Date.now();
  const plans: SubscriptionPlan[] = ['basic', 'pro', 'enterprise'];
  const landlordsAndAgents = users.filter(
    (u) => u.role === 'landlord' || u.role === 'agent' || u.role === 'airbnb_host'
  );
  
  return landlordsAndAgents
    .filter((u) => u.subscription_plan && u.subscription_status === 'active')
    .map((user) => {
      const plan = user.subscription_plan || 'basic';
      const startDate = user.subscription_start_date || new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = user.subscription_end_date || new Date(now + 20 * 24 * 60 * 60 * 1000).toISOString();
      
      const planPrices: Record<SubscriptionPlan, number> = {
        free: 0,
        basic: 100,
        pro: 250,
        enterprise: 500,
      };

      return {
        id: `sub_${user.id}`,
        user_id: user.id,
        plan,
        status: user.subscription_status || 'active',
        start_date: startDate,
        end_date: endDate,
        amount: planPrices[plan],
        created_at: startDate,
      };
    });
}

function generateMockTransactions(
  users: User[],
  properties: Property[],
  subscriptions: Subscription[]
): Transaction[] {
  const now = Date.now();
  const transactions: Transaction[] = [];
  
  // Subscription transactions
  subscriptions.forEach((sub) => {
    transactions.push({
      id: `txn_sub_${sub.id}`,
      user_id: sub.user_id,
      type: 'subscription',
      amount: sub.amount,
      currency: 'GHS',
      status: 'completed',
      payment_method: 'paystack',
      reference: `SUB-${sub.id}-${Date.now()}`,
      description: `Subscription payment - ${sub.plan} plan`,
      subscription_id: sub.id,
      metadata: { plan: sub.plan },
      created_at: sub.created_at,
      completed_at: sub.created_at,
    });
  });

  // Featured listing transactions
  properties
    .filter((p) => p.is_featured && p.featured_until)
    .forEach((prop) => {
      const daysFeatured = 7;
      const amount = 50; // ₵50 for 7 days
      transactions.push({
        id: `txn_feat_${prop.id}`,
        user_id: prop.owner_id,
        type: 'featured_listing',
        amount,
        currency: 'GHS',
        status: 'completed',
        payment_method: 'paystack',
        reference: `FEAT-${prop.id}-${Date.now()}`,
        description: `Featured listing for ${daysFeatured} days`,
        property_id: prop.id,
        metadata: { days: daysFeatured },
        created_at: prop.created_at,
        completed_at: prop.created_at,
      });
    });

  // Boost transactions
  properties
    .filter((p) => p.is_boosted && p.boosted_until)
    .forEach((prop) => {
      const amount = 10; // ₵10 per day
      transactions.push({
        id: `txn_boost_${prop.id}`,
        user_id: prop.owner_id,
        type: 'boost',
        amount,
        currency: 'GHS',
        status: 'completed',
        payment_method: 'mobile_money',
        reference: `BOOST-${prop.id}-${Date.now()}`,
        description: 'Daily boost payment',
        property_id: prop.id,
        metadata: { type: 'daily' },
        created_at: prop.created_at,
        completed_at: prop.created_at,
      });
    });

  // Verification transactions
  properties
    .filter((p) => p.verification_fee_paid)
    .forEach((prop) => {
      const amount = 30; // ₵30 verification fee
      transactions.push({
        id: `txn_verify_${prop.id}`,
        user_id: prop.owner_id,
        type: 'verification',
        amount,
        currency: 'GHS',
        status: 'completed',
        payment_method: 'paystack',
        reference: `VERIFY-${prop.id}-${Date.now()}`,
        description: 'Property verification fee',
        property_id: prop.id,
        metadata: { verified: true },
        created_at: prop.created_at,
        completed_at: prop.created_at,
      });
    });

  return transactions;
}

function generateMockFeaturedBoosts(properties: Property[]): FeaturedBoost[] {
  const now = Date.now();
  const boosts: FeaturedBoost[] = [];

  properties
    .filter((p) => p.is_featured && p.featured_until)
    .forEach((prop) => {
      const startDate = new Date(prop.created_at);
      const endDate = new Date(prop.featured_until!);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      
      boosts.push({
        id: `boost_feat_${prop.id}`,
        property_id: prop.id,
        type: 'featured',
        duration_days: daysDiff,
        amount: 50,
        status: endDate.getTime() > now ? 'active' : 'expired',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: prop.created_at,
      });
    });

  properties
    .filter((p) => p.is_boosted && p.boosted_until)
    .forEach((prop) => {
      const startDate = new Date(prop.created_at);
      const endDate = new Date(prop.boosted_until!);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      
      boosts.push({
        id: `boost_daily_${prop.id}`,
        property_id: prop.id,
        type: 'boost',
        duration_days: daysDiff,
        amount: 10 * daysDiff,
        status: endDate.getTime() > now ? 'active' : 'expired',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: prop.created_at,
      });
    });

  return boosts;
}

// Monetization Getter Functions

export function getMockSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return [];
  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
    initializeMockData();
  }
  const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
  return data ? JSON.parse(data) : [];
}

export function getMockTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    initializeMockData();
  }
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export function getMockFeaturedBoosts(): FeaturedBoost[] {
  if (typeof window === 'undefined') return [];
  if (!localStorage.getItem(STORAGE_KEYS.FEATURED_BOOSTS)) {
    initializeMockData();
  }
  const data = localStorage.getItem(STORAGE_KEYS.FEATURED_BOOSTS);
  return data ? JSON.parse(data) : [];
}

// Revenue Statistics

export function getRevenueStats(): RevenueStats {
  const transactions = getMockTransactions();
  const subscriptions = getMockSubscriptions();
  const properties = getMockProperties();
  const now = Date.now();
  
  const completedTransactions = transactions.filter((t) => t.status === 'completed');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTransactions = completedTransactions.filter((t) => {
    const txDate = new Date(t.created_at);
    return txDate >= today;
  });
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyTransactions = completedTransactions.filter((t) => {
    const txDate = new Date(t.created_at);
    return txDate >= thisMonthStart;
  });

  const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const subscriptionsRevenue = completedTransactions
    .filter((t) => t.type === 'subscription')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const featuredRevenue = completedTransactions
    .filter((t) => t.type === 'featured_listing')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const verificationRevenue = completedTransactions
    .filter((t) => t.type === 'verification')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeSubscriptions = subscriptions.filter((s) => {
    const endDate = new Date(s.end_date);
    return s.status === 'active' && endDate.getTime() > now;
  }).length;

  const featuredListings = properties.filter((p) => {
    if (!p.featured_until) return false;
    return new Date(p.featured_until).getTime() > now;
  }).length;

  return {
    total_revenue: totalRevenue,
    monthly_revenue: monthlyRevenue,
    today_revenue: todayRevenue,
    subscriptions_revenue: subscriptionsRevenue,
    featured_revenue: featuredRevenue,
    verification_revenue: verificationRevenue,
    payouts_total: 0,
    transaction_count: completedTransactions.length,
    active_subscriptions: activeSubscriptions,
    featured_listings_count: featuredListings,
  };
}

// Pricing Plans

export function getPricingPlans(): PricingPlan[] {
  return [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'GHS',
      interval: 'monthly',
      features: ['1 listing', 'Basic support'],
      max_listings: 1,
      featured_listings: false,
      analytics: false,
      priority_support: false,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 100,
      currency: 'GHS',
      interval: 'monthly',
      features: ['10 listings', 'Featured listings', 'Basic analytics'],
      max_listings: 10,
      featured_listings: true,
      analytics: true,
      priority_support: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 300,
      currency: 'GHS',
      interval: 'monthly',
      features: ['Unlimited listings', 'Featured listings', 'Advanced analytics'],
      max_listings: null,
      featured_listings: true,
      analytics: true,
      priority_support: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 0,
      currency: 'GHS',
      interval: 'custom',
      features: ['Custom listings', 'Dedicated support', 'Team onboarding'],
      max_listings: null,
      featured_listings: true,
      analytics: true,
      priority_support: true,
    },
  ];
}

// Featured Boost Pricing

export function getFeaturedBoostPricing() {
  return {
    featured_7_days: { price: 50, duration: 7, name: '7 Days Featured' },
    featured_30_days: { price: 120, duration: 30, name: '30 Days Featured' },
    boost_daily: { price: 10, duration: 1, name: 'Daily Boost' },
    verification: { price: 30, duration: null, name: 'Verification Badge' },
  };
}

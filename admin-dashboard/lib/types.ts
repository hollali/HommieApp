export type UserRole =
  | 'guest'
  | 'tenant'
  | 'airbnb_host'
  | 'agent'
  | 'landlord'
  | 'admin'
  | 'super_admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type AdminRole = 'super_admin' | 'moderator' | 'support';

export type PropertyType = 'apartment' | 'airbnb' | 'hotel' | 'hostel' | 'store' | 'house' | 'warehouse' | 'office' | 'land' | 'other';

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export type ReportReason = 'scam' | 'incorrect_info' | 'inappropriate_content' | 'spam' | 'other';

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'subscription' | 'featured_listing' | 'boost' | 'verification' | 'commission' | 'booking' | 'payout' | 'support';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'billing' | 'technical' | 'account' | 'listing' | 'other';
  created_at: string;
  updated_at: string;
  user?: User;
}
export type PaymentMethod = 'paystack' | 'mobile_money' | 'card' | 'bank_transfer';

export interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  role: UserRole;
  created_at: string;
  is_suspended?: boolean;
  last_login?: string;
  verification_status?: VerificationStatus;
  verification_documents?: string[] | null;
  verification_requested_at?: string | null;
  // Subscription fields
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  price: number;
  payment_type: 'daily' | 'weekly' | 'monthly';
  region: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean;
  parking: boolean;
  amenities: string[];
  is_available: boolean;
  status: ListingStatus;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  owner?: User;
  // Monetization fields
  is_featured?: boolean;
  is_boosted?: boolean;
  featured_until?: string | null;
  boosted_until?: string | null;
  verification_fee_paid?: boolean;
}

export interface Admin {
  id: string;
  email: string;
  role: AdminRole;
  full_name: string | null;
  last_login: string | null;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: 'property' | 'user' | 'report' | 'payout' | 'verification' | 'system' | 'support';
  entity_id: string;
  details: Record<string, any> | null;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'moderation' | 'financial' | 'support' | 'system';
  ip_address?: string;
  admin?: Admin;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'property' | 'user';
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  reporter?: User;
  target_property?: Property;
  target_user?: User;
}

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingApprovals: number;
  pendingReports: number;
  verifiedListings: number;
  pendingVerifications: number;
  verifiedUsers: number;
  newUsersToday: number;
  newListingsToday: number;
  pendingPayouts: number;
  openTickets?: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  amount: number;
  created_at: string;
  user?: User;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  reference: string;
  description: string | null;
  property_id?: string | null;
  subscription_id?: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  completed_at?: string | null;
  user?: User;
  property?: Property;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'custom';
  features: string[];
  max_listings: number | null; // null = unlimited
  featured_listings: boolean;
  analytics: boolean;
  priority_support: boolean;
}

export interface FeaturedBoost {
  id: string;
  property_id: string;
  type: 'featured' | 'boost';
  duration_days: number;
  amount: number;
  status: 'active' | 'expired';
  start_date: string;
  end_date: string;
  created_at: string;
  property?: Property;
}


export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  method: 'bank' | 'mobile_money';
  account_details: {
    account_number: string;
    provider: string;
  };
  status: 'pending' | 'paid' | 'rejected';
  requested_at: string;
  paid_at?: string | null;
  admin_notes?: string | null;
  user?: User;
}

export interface Booking {
  id: string;
  tenant_id: string;
  property_id: string;
  scheduled_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  tenant?: User;
  property?: Property;
}

export interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  today_revenue: number;
  subscriptions_revenue: number;
  featured_revenue: number;
  verification_revenue: number;
  payouts_total: number;
  transaction_count: number;
  active_subscriptions: number;
  featured_listings_count: number;
  total_bookings?: number;
}

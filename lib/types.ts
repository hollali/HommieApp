export type UserRole =
  | 'guest'
  | 'tenant'
  | 'airbnb_host'
  | 'agent'
  | 'landlord'
  | 'admin'
  | 'super_admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type PropertyType = 'apartment' | 'airbnb' | 'hotel' | 'hostel' | 'store' | 'house' | 'warehouse' | 'office' | 'land' | 'other';

export type PaymentType = 'daily' | 'weekly' | 'monthly';

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'subscription' | 'featured_listing' | 'boost' | 'verification' | 'commission';
export type PaymentMethod = 'paystack' | 'mobile_money' | 'card' | 'bank_transfer';

export interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  role: UserRole;
  created_at: string;
  avatar_url?: string | null;
  verification_status?: VerificationStatus;
  verification_documents?: string[] | null;
  verification_requested_at?: string | null;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
  host_about?: string | null;
  host_languages?: string | null;
  host_response_rate?: string | null;
  host_since?: string | null;
  push_token?: string | null;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  price: number;
  payment_type: PaymentType;
  region: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean;
  parking: boolean; // Parking availability
  amenities: string[];
  images?: string[]; // Array of image URLs
  is_available: boolean;
  status: ListingStatus;
  created_at: string;
  owner?: User;
  is_featured?: boolean;
  featured_until?: string | null;
  property_images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  created_at: string;
}

export interface Booking {
  id: string;
  tenant_id: string;
  property_id: string;
  scheduled_date: string;
  status: BookingStatus;
  created_at: string;
  updated_at?: string;
  property?: Property;
  tenant?: User;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
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
  property_id?: string | null;
  subscription_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  completed_at?: string | null;
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
}

export interface GhanaRegion {
  id: string;
  name: string;
  cities: GhanaCity[];
}

export interface GhanaCity {
  id: string;
  name: string;
  region_id: string;
  areas: string[];
}


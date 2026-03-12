import { PaymentMethod } from './types';
import { Ionicons } from '@expo/vector-icons';

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethod;
  details: {
    // Mobile Money
    provider?: 'mtn' | 'vodafone' | 'airteltigo';
    phoneNumber?: string;
    
    // Card
    lastFour?: string;
    cardType?: 'visa' | 'mastercard' | 'verve';
    expiryMonth?: string;
    expiryYear?: string;
    cardholderName?: string;
    
    // Bank Transfer
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branch?: string;
  };
  isDefault?: boolean;
  createdAt: string;
}

// Mock storage for saved payment methods (in production, this would be in Supabase/SecureStorage)
let savedPaymentMethods: SavedPaymentMethod[] = [];

export const getSavedPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  // In production, fetch from Supabase/SecureStorage
  return savedPaymentMethods;
};

export const addSavedPaymentMethod = async (method: Omit<SavedPaymentMethod, 'id' | 'createdAt'>): Promise<SavedPaymentMethod> => {
  const newMethod: SavedPaymentMethod = {
    ...method,
    id: `pm_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  savedPaymentMethods.push(newMethod);
  
  // In production, save to Supabase/SecureStorage
  return newMethod;
};

export const removeSavedPaymentMethod = async (id: string): Promise<void> => {
  savedPaymentMethods = savedPaymentMethods.filter(method => method.id !== id);
  // In production, remove from Supabase/SecureStorage
};

export const setDefaultPaymentMethod = async (id: string): Promise<void> => {
  savedPaymentMethods = savedPaymentMethods.map(method => ({
    ...method,
    isDefault: method.id === id,
  }));
  // In production, update in Supabase/SecureStorage
};

export const getDefaultPaymentMethod = async (): Promise<SavedPaymentMethod | null> => {
  return savedPaymentMethods.find(method => method.isDefault) || null;
};

// Helper functions to format payment method display
export const formatPaymentMethodDisplay = (method: SavedPaymentMethod): string => {
  switch (method.type) {
    case 'mobile_money':
      return `${method.details.provider?.toUpperCase()} •••${method.details.phoneNumber?.slice(-4)}`;
    case 'card':
      return `${method.details.cardType?.toUpperCase()} ••••${method.details.lastFour}`;
    case 'bank_transfer':
      return `${method.details.bankName} •••${method.details.accountNumber?.slice(-4)}`;
    default:
      return 'Unknown payment method';
  }
};

export const getPaymentMethodIcon = (type: PaymentMethod): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'mobile_money':
      return 'phone-portrait-outline';
    case 'card':
      return 'card-outline';
    case 'bank_transfer':
      return 'cash-outline';
    case 'paystack':
      return 'card-outline';
    default:
      return 'card-outline';
  }
};

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Use dummy data mode if Supabase credentials are not provided
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('📱 Running in MOCK DATA mode (Supabase not configured)');
  console.log('💡 To use Supabase, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Use dummy URL/key for mock mode to prevent errors
const mockUrl = 'https://mock.supabase.co';
const mockKey = 'mock-anon-key-for-development-only';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Creates a Supabase client that uses a Clerk JWT for authentication.
 * This allows using Supabase RLS (Row Level Security) with Clerk users.
 */
export const createClerkSupabaseClient = (clerkToken: string | null) => {
  return createClient(
    supabaseUrl || mockUrl,
    supabaseAnonKey || mockKey,
    {
      global: {
        headers: {
          ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
        },
      },
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
};

export const supabase = createClient(
  supabaseUrl || mockUrl, 
  supabaseAnonKey || mockKey, 
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);


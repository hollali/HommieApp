import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use dummy URL/key for mock mode to prevent errors
const mockUrl = 'https://mock.supabase.co';
const mockKey = 'mock-anon-key-for-development-only';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Creates a Supabase client that uses a Clerk JWT for authentication.
 * This allows using Supabase RLS (Row Level Security) with Clerk users.
 */
export const createClerkSupabaseClient = (clerkToken?: string | null) => {
  return createClient(
    supabaseUrl || mockUrl,
    supabaseAnonKey || mockKey,
    {
      global: {
        headers: {
          Authorization: clerkToken ? `Bearer ${clerkToken}` : undefined,
        },
      },
    }
  );
};

export const supabase = createClient(
  supabaseUrl || mockUrl,
  supabaseAnonKey || mockKey
);

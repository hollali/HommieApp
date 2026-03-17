import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '../lib/supabase';
import { useMemo } from 'react';

/**
 * Custom hook to get an authenticated Supabase client using Clerk.
 * 
 * Usage:
 * const supabase = useSupabase();
 * const { data } = await supabase.from('properties').select('*');
 */
export function useSupabase() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return {
      /**
       * Execute a Supabase query with automatic Clerk authentication.
       * This is preferred for operations that require Row Level Security (RLS).
       */
      async query() {
        // You must have a JWT template named 'supabase' in your Clerk Dashboard
        const token = await getToken({ template: 'supabase' });
        return createClerkSupabaseClient(token);
      }
    };
  }, [getToken]);
}

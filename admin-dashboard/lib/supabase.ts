import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use dummy URL/key for mock mode to prevent errors
const mockUrl = 'https://mock.supabase.co';
const mockKey = 'mock-anon-key-for-development-only';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || mockUrl,
  supabaseAnonKey || mockKey
);

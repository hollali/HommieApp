import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from './supabase';

/**
 * Gets a Supabase client authenticated with the current Clerk user.
 * Use this in Server Components, Server Actions, and API Routes.
 */
export async function getSupabaseServer() {
  const { getToken } = await auth();
  
  // You must have a JWT template named 'supabase' in your Clerk Dashboard
  const token = await getToken({ template: 'supabase' });
  
  return createClerkSupabaseClient(token);
}

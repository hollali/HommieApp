import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { User } from '../lib/types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useAuth() {
  const { isLoaded: authLoaded, userId, getToken, signOut: clerkSignOut } = useClerkAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useClerkUser();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Fetch user profile from Supabase if configured, otherwise use Clerk data
    async function getProfile() {
      if (isSupabaseConfigured && userId) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && data) {
            setUser(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching Supabase profile:', err);
        }
      }

      // Fallback: Build a basic user object from Clerk
      if (clerkUser) {
        setUser({
          id: userId,
          full_name: clerkUser.fullName || clerkUser.firstName || 'User',
          phone: clerkUser.primaryPhoneNumber?.phoneNumber || null,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          role: 'tenant', // Default role
          created_at: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
          avatar_url: clerkUser.imageUrl,
          verification_status: 'unverified'
        } as User);
      }
      setLoading(false);
    }

    getProfile();
  }, [authLoaded, userLoaded, userId, clerkUser]);

  return {
    isLoaded: authLoaded && userLoaded && !loading,
    isSignedIn: !!userId,
    user,
    userId,
    loading: !authLoaded || !userLoaded || loading,
    signOut: clerkSignOut,
    getToken
  };
}

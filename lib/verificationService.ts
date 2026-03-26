import { createClerkSupabaseClient, isSupabaseConfigured, supabase } from './supabase';
import { storageService } from './storage';
import { getUserById, updateUser } from './mockData';

export const verificationService = {
  /**
   * Uploads verification documents to Supabase Storage and updates user status
   */
  async submitVerification(userId: string, documentUris: string[], clerkToken: string | null = null) {
    try {
      // In dev/mock mode, keep verification state in AsyncStorage.
      if (!isSupabaseConfigured) {
        await updateUser(userId, {
          verification_status: 'pending',
          verification_documents: documentUris,
          verification_requested_at: new Date().toISOString(),
        });
        return { success: true };
      }

      const client = clerkToken ? createClerkSupabaseClient(clerkToken) : supabase;

      // 1. Upload documents to a 'verification-docs' bucket
      const uploadPromises = documentUris.map((uri, index) => {
        const path = `${userId}/${Date.now()}_${index}`;
        return storageService.uploadImage('verification-docs', path, uri, client);
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(
        (u): u is string => typeof u === 'string' && u.length > 0
      );

      // 2. Update user's verification status and store document URLs
      const { error } = await client
        .from('users')
        .update({
          verification_status: 'pending',
          verification_documents: uploadedUrls,
          verification_requested_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const e: any = error;
      console.error('Error submitting verification:', {
        userId,
        message: e?.message ?? String(error),
        code: e?.code,
        details: e?.details,
      });
      throw error;
    }
  },

  /**
   * Fetches the current verification status for a user
   */
  async getVerificationStatus(userId: string, clerkToken: string | null = null) {
    try {
      if (!isSupabaseConfigured) {
        const user = await getUserById(userId);
        if (!user) return null;
        return {
          verification_status: user.verification_status ?? 'unverified',
          verification_documents: user.verification_documents ?? [],
          verification_requested_at: user.verification_requested_at ?? null,
        };
      }

      const client = clerkToken ? createClerkSupabaseClient(clerkToken) : supabase;

      const { data, error } = await client
        .from('users')
        .select('verification_status, verification_documents, verification_requested_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      const e: any = error;
      if (e?.code === 'PGRST116') {
        // .single() with no matching row
        return null;
      }
      console.error('Error fetching verification status:', {
        userId,
        message: e?.message ?? String(error),
        code: e?.code,
        details: e?.details,
      });
      return null;
    }
  }
};

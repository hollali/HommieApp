import { supabase } from './supabase';
import { storageService } from './storage';

export const verificationService = {
  /**
   * Uploads verification documents to Supabase Storage and updates user status
   */
  async submitVerification(userId: string, documentUris: string[]) {
    try {
      // 1. Upload documents to a 'verification-docs' bucket
      const uploadPromises = documentUris.map((uri, index) => {
        const path = `${userId}/${Date.now()}_${index}`;
        return storageService.uploadImage('verification-docs', path, uri);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // 2. Update user's verification status and store document URLs
      const { error } = await supabase
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
      console.error('Error submitting verification:', error);
      throw error;
    }
  },

  /**
   * Fetches the current verification status for a user
   */
  async getVerificationStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('verification_status, verification_documents, verification_requested_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      return null;
    }
  }
};

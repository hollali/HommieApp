import { supabase, isSupabaseConfigured } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export const storageService = {
  /**
   * Upload an image to Supabase Storage
   * @param bucket The storage bucket name
   * @param path The path within the bucket
   * @param uri The local file URI
   */
  async uploadImage(
    bucket: string,
    path: string,
    uri: string,
    supabaseClient: any = supabase
  ): Promise<string | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const fileExt = uri.split('.').pop();
      const fileName = `${path}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Unexpected error during image upload:', error);
      return null;
    }
  },

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(bucket: string, pathPrefix: string, uris: string[]): Promise<string[]> {
    const uploadPromises = uris.map((uri, index) => 
      this.uploadImage(bucket, `${pathPrefix}_${index}_${Date.now()}`, uri)
    );
    
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  }
};

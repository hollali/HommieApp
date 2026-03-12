import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Property } from '../lib/types';

export function useProperties(filters?: {
  type?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:users(id, full_name, phone),
          property_images(image_url)
        `);

      if (filters?.isAvailable !== false) {
        query = query.eq('is_available', true);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.region) {
        query = query.eq('region', filters.region);
      }

      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
  });
}


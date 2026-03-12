
/**
 * Utility for handling server-side and client-side watermarking logic.
 * In a real production environment, this would ideally happen via:
 * 1. Cloudinary transformations
 * 2. Supabase Storage dynamic transformations (using imgproxy)
 * 3. A dedicated backend worker
 */

/**
 * Appends watermarking parameters to a URL if it's from a supported service (like Cloudinary),
 * or returns the URL as is for client-side overlaying.
 */
export function getWatermarkedUrl(url: string | undefined): string {
  if (!url) return '';

  // 1. Cloudinary support
  if (url.includes('cloudinary.com')) {
    // Insert 'l_hommie_logo,o_30,w_100,g_south_east,x_10,y_10/' after '/upload/'
    // This is a standard Cloudinary overlay transformation
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/l_hommie_logo,o_30,w_100,g_south_east,x_10,y_10/');
    }
  }

  // 2. Supabase Storage support (if using dynamic transformations)
  if (url.includes('supabase.co/storage/v1/object/public')) {
    // Supabase supports transformations via query params if configured
    return `${url}?width=800&quality=80&watermark=true`;
  }

  return url;
}

/**
 * Checks if a property needs watermarking based on its owner type or visibility.
 */
export function needsWatermark(propertyType: string): boolean {
  // We strictly watermark Airbnb and Hotel listings to prevent direct deals
  return ['airbnb', 'hotel'].includes(propertyType);
}

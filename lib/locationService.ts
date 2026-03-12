import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Location permission is required to use this feature.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<LocationResult | null> {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) return null;

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Reverse geocode to get address
    let address: string | undefined;
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (addresses.length > 0) {
        const addr = addresses[0];
        address = [
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country,
        ]
          .filter(Boolean)
          .join(', ');
      }
    } catch (e) {
      // Geocoding failed, but we still have coordinates
      console.warn('Reverse geocoding failed:', e);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
    };
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to get location');
    return null;
  }
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<LocationResult | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
        address,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return null;
  }
}


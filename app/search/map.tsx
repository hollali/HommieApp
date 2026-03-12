import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import MapView, { Marker } from 'react-native-maps';
import { formatCurrency } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function MapViewScreen() {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const router = useRouter();

  const { data: properties } = useQuery({
    queryKey: ['properties', 'map'],
    queryFn: async () => {
      // Use mock data
      const { getProperties } = await import('../../lib/mockData');
      let allProperties = await getProperties();
      
      // Filter by availability and coordinates
      allProperties = allProperties.filter(
        (p) => p.is_available && p.status === 'approved' && p.latitude !== null && p.longitude !== null
      );
      
      return allProperties.map((p) => ({
        ...p,
        property_images: [],
      }));
    },
  });

  const initialRegion = {
    latitude: 5.6037, // Accra coordinates
    longitude: -0.1870,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <Text style={styles.searchText}>Accra, Ghana</Text>
          <TouchableOpacity>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <View style={styles.filterButtonContent}>
            <Ionicons name="options" size={20} color="#000" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{properties?.length || 0} homes found</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {properties?.map((property: any) => (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.latitude,
                longitude: property.longitude,
              }}
              onPress={() => setSelectedProperty(property)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerBubble}>
                  <Text style={styles.markerPrice}>
                    {formatCurrency(property.price)}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity
          style={styles.mapToggleButton}
          onPress={() => router.back()}
        >
          <Ionicons name="menu" size={24} color="#0066FF" />
        </TouchableOpacity>
      </View>

      {selectedProperty && (
        <TouchableOpacity 
          style={styles.propertyCard}
          onPress={() => router.push(`/property/${selectedProperty.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.propertyCardImage}>
            {selectedProperty.property_images?.[0]?.image_url ? (
              <View style={styles.propertyCardImagePlaceholder}>
                <Ionicons name="image" size={32} color="#999" />
              </View>
            ) : (
              <View style={styles.propertyCardImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#999" />
              </View>
            )}
          </View>
          <View style={styles.propertyCardInfo}>
            <Text style={styles.propertyCardPrice} numberOfLines={1}>
              {formatCurrency(selectedProperty.price)}/{selectedProperty.payment_type}
            </Text>
            <Text style={styles.propertyCardTitle} numberOfLines={1}>
              {selectedProperty.title}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#0066FF" />
              <Text style={styles.propertyCardLocation} numberOfLines={1}>
                {selectedProperty.area}, {selectedProperty.city}
              </Text>
            </View>
            <View style={styles.propertyCardDetails}>
              {selectedProperty.bedrooms && (
                <View style={styles.propertyCardDetail}>
                  <Ionicons name="bed" size={16} color="#666" />
                  <Text style={styles.propertyCardDetailText}>{selectedProperty.bedrooms}</Text>
                </View>
              )}
              {selectedProperty.bathrooms && (
                <View style={styles.propertyCardDetail}>
                  <Ionicons name="water" size={16} color="#666" />
                  <Text style={styles.propertyCardDetailText}>{selectedProperty.bathrooms}</Text>
                </View>
              )}
              {selectedProperty.parking && (
                <View style={styles.propertyCardDetail}>
                  <Ionicons name="car" size={16} color="#666" />
                  <Text style={styles.propertyCardDetailText}>Parking</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    padding: 8,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  markerPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  mapToggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  propertyCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  propertyCardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  propertyCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyCardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  propertyCardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 4,
  },
  propertyCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  propertyCardLocation: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  propertyCardDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  propertyCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyCardDetailText: {
    fontSize: 12,
    color: '#666',
  },
});


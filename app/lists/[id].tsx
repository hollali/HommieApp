import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatCurrency } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Mock list data - in production, fetch from Supabase
  const listData = {
    id,
    name: 'Apartment in East Legon',
    count: 10,
  };

  // Mock properties - in production, fetch properties in this list
  const { data: properties, isLoading } = useQuery({
    queryKey: ['list-properties', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const { getProperties } = await import('../../lib/mockData');
        const allProperties = await getProperties();
        return allProperties.filter((p) => p.is_available).slice(0, 10);
      }

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(image_url)
        `)
        .eq('is_available', true)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{listData.name}</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('List options', 'Choose an action', [
              { text: 'Rename', onPress: () => {} },
              { text: 'Delete', style: 'destructive', onPress: () => {} },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.listInfo}>
        <Text style={styles.listCount}>{listData.count} Locations</Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading properties...</Text>
        </View>
      ) : properties && properties.length > 0 ? (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PropertyItem
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No properties in this list</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function PropertyItem({ property, onPress }: { property: any; onPress: () => void }) {
  const imageUrls = (property.property_images || [])
    .map((img: any) => img.image_url)
    .filter(Boolean);

  return (
    <TouchableOpacity style={styles.propertyCard} onPress={onPress}>
      {imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {imageUrls.map((url: string, index: number) => (
            <Image
              key={`${property.id}-image-${index}`}
              source={{ uri: url }}
              style={styles.propertyImage}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.propertyImage, styles.propertyImagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color="#999" />
        </View>
      )}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyPrice}>
          {formatCurrency(property.price)}/{property.payment_type === 'monthly' ? 'A Month' : property.payment_type}
        </Text>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {property.area}, {property.city}
        </Text>
        <View style={styles.propertyDetails}>
          {property.bedrooms && (
            <View style={styles.propertyDetail}>
              <Ionicons name="bed" size={16} color="#666" />
              <Text style={styles.propertyDetailText}>{property.bedrooms}</Text>
            </View>
          )}
          {property.bathrooms && (
            <View style={styles.propertyDetail}>
              <Ionicons name="water" size={16} color="#666" />
              <Text style={styles.propertyDetailText}>{property.bathrooms}</Text>
            </View>
          )}
          <View style={styles.propertyDetail}>
            <Ionicons name="car" size={16} color="#666" />
            <Text style={styles.propertyDetailText}>2</Text>
          </View>
          <View style={styles.propertyDetail}>
            <Ionicons name="square-outline" size={16} color="#666" />
            <Text style={styles.propertyDetailText}>1200sqt</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  listInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  propertyImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  propertyImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  propertyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyDetailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
});



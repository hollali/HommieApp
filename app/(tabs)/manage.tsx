import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../lib/constants';
import { propertyService } from '../../lib/propertyService';

export default function ManageScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: hostStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['host-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await propertyService.getHostAnalytics(user.id);
    },
    enabled: !!user,
  });

  const { data: properties, isLoading: propertiesLoading, refetch: refetchProperties } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await propertyService.getOwnerProperties(user.id);
    },
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchProperties()]);
    setRefreshing(false);
  };

  if (user?.role === 'tenant') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Partner Center</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="business-outline" size={64} color="#0066FF" />
          </View>
          <Text style={styles.emptyTitle}>Become a Partner</Text>
          <Text style={styles.emptySubtitle}>List your properties and start earning with Hommie.</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.actionButtonText}>Upgrade to Host</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Host Dashboard</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/property/create/step1')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Listing Views" 
            value={hostStats?.totalViews.toString() || '0'} 
            icon="eye-outline" 
            color="#4560F7" 
          />
          <StatCard 
            title="Inquiries" 
            value={hostStats?.totalInquiries.toString() || '0'} 
            icon="chatbubbles-outline" 
            color="#00C853" 
          />
          <StatCard 
            title="Listings" 
            value={hostStats?.activeListings.toString() || '0'} 
            icon="home-outline" 
            color="#FF9500" 
          />
          <StatCard 
            title="Bookings" 
            value={hostStats?.pendingBookings.toString() || '0'} 
            icon="calendar-outline" 
            color="#FF3B30" 
          />
        </View>

        {/* Listings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {propertiesLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#0066FF" />
          ) : properties && properties.length > 0 ? (
            properties.map((prop: any) => (
              <PropertyItem key={prop.id} property={prop} />
            ))
          ) : (
            <View style={styles.noListings}>
              <Text style={styles.noListingsText}>You haven't added any listings yet.</Text>
            </View>
          )}
        </View>

        {/* Action Center */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionButton 
              title="Add New Listing" 
              icon="add-circle-outline" 
              onPress={() => router.push('/property/create/step1')} 
            />
            <ActionButton 
              title="Withdraw Earnings" 
              icon="wallet-outline" 
              onPress={() => router.push('/payments/payout')} 
            />
            <ActionButton 
              title="Verification" 
              icon="shield-checkmark-outline" 
              onPress={() => router.push('/verification')} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function PropertyItem({ property }: any) {
  const imageUrl = property.property_images?.[0]?.image_url;
  
  return (
    <TouchableOpacity style={styles.propertyItem}>
      <Image 
        source={imageUrl ? { uri: imageUrl } : require('../../assets/images/placeholder.png')} 
        style={styles.propertyImage} 
      />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
        <Text style={styles.propertyLocation}>{property.city}, {property.area}</Text>
        <View style={styles.propertyStatusRow}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: property.status === 'approved' ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: property.status === 'approved' ? '#2E7D32' : '#EF6C00' }
            ]}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.propertyPrice}>
             {formatCurrency(property.price)}/{property.payment_type}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

function ActionButton({ title, icon, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#0066FF" />
      <Text style={styles.quickActionText}>{title}</Text>
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
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  seeAll: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  propertyLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  propertyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  propertyPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
  },
  noListings: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  noListingsText: {
    color: '#999',
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '48%',
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

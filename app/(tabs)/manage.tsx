import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../lib/constants';
import { propertyService } from '../../lib/propertyService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

/**
 * ManageScreen - Host Dashboard
 * Provides overview of listings, analytics, and quick actions for property owners.
 */
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

  // If user is a tenant, show "Become a Host" experience
  if (user?.role === 'tenant') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Partner Center</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={['#0066FF', '#4560F7']}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="business" size={48} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>Monetize Your Property</Text>
          <Text style={styles.emptySubtitle}>Join thousands of hosts earning passive income on Hommie.</Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <LinearGradient
              colors={['#0066FF', '#4560F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Become a Partner</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.title}>Host Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/property/create/step1')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0066FF', '#4560F7']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#0066FF']} 
            tintColor="#0066FF"
          />
        }
      >
        {/* Analytics Section */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Views" 
            value={hostStats?.totalViews || 0} 
            icon="eye-outline" 
            colors={['#4facfe', '#00f2fe']} 
          />
          <StatCard 
            title="Total Inquiries" 
            value={hostStats?.totalInquiries || 0} 
            icon="chatbubbles-outline" 
            colors={['#667eea', '#764ba2']} 
          />
          <StatCard 
            title="Active Listings" 
            value={hostStats?.activeListings || 0} 
            icon="home-outline" 
            colors={['#2af598', '#009efd']} 
          />
          <StatCard 
            title="Pending Actions" 
            value={hostStats?.pendingBookings || 0} 
            icon="alert-circle-outline" 
            colors={['#f093fb', '#f5576c']} 
          />
        </View>

        {/* Listings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Properties</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/listings')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {propertiesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066FF" />
            </View>
          ) : properties && properties.length > 0 ? (
            properties.map((prop: any) => (
              <PropertyItem key={prop.id} property={prop} onPress={() => router.push(`/property/${prop.id}`)} />
            ))
          ) : (
            <View style={styles.noListings}>
              <Ionicons name="home-outline" size={48} color="#D1D1D6" />
              <Text style={styles.noListingsText}>You haven't listed any properties yet.</Text>
              <TouchableOpacity onPress={() => router.push('/property/create/step1')}>
                <Text style={styles.createFirstText}>List your first property</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <QuickAction 
              title="Add New" 
              icon="add-circle" 
              color="#0066FF"
              onPress={() => router.push('/property/create/step1')} 
            />
            <QuickAction 
              title="Payouts" 
              icon="wallet" 
              color="#34C759"
              onPress={() => router.push('/payments/payout')} 
            />
            <QuickAction 
              title="Verify" 
              icon="shield-checkmark" 
              color="#5856D6"
              onPress={() => router.push('/verification')} 
            />
            <QuickAction 
              title="Settings" 
              icon="settings" 
              color="#8E8E93"
              onPress={() => router.push('/(tabs)/profile')} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, colors }: any) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <Ionicons name={icon} size={20} color="#FFF" />
      </LinearGradient>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );
}

function PropertyItem({ property, onPress }: any) {
  // Fix: The placeholder path was broken in the screenshot, ensuring correct path here.
  const imageUrl = property.property_images?.[0]?.image_url;
  const placeholder = require('../../assets/property-placeholder.png');
  
  return (
    <TouchableOpacity style={styles.propertyItem} onPress={onPress} activeOpacity={0.7}>
      <Image 
        source={imageUrl ? { uri: imageUrl } : placeholder} 
        style={styles.propertyImage}
        defaultSource={placeholder}
      />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={12} color="#8E8E93" />
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {property.area}, {property.city}
          </Text>
        </View>
        
        <View style={styles.propertyFooter}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: property.status === 'approved' ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: property.status === 'approved' ? '#4CAF50' : '#FF9800' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: property.status === 'approved' ? '#2E7D32' : '#E65100' }
            ]}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.propertyPrice}>
             {formatCurrency(property.price)}<Text style={styles.pricePeriod}>/{property.payment_type}</Text>
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
    </TouchableOpacity>
  );
}

function QuickAction({ title, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  addButton: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 28,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
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
    color: '#1C1C1E',
  },
  seeAll: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  propertyImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
    flex: 1,
  },
  propertyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  pricePeriod: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  noListings: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
  },
  noListingsText: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  createFirstText: {
    color: '#0066FF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickAction: {
    alignItems: 'center',
    width: '22%',
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FFF',
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});


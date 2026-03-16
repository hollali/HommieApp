import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../lib/adminService';
import { formatCurrency } from '../../lib/constants';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Security Check: Only super_admin can access
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const fetchStats = async () => {
    const data = await adminService.getPlatformStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4560F7" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.welcomeText}>Hello, {user?.full_name || 'Admin'}</Text>
        <Text style={styles.subtitle}>Here is what's happening on Hommie today.</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <AdminStatCard 
            title="Total Users" 
            value={stats?.totalUsers || '0'} 
            icon="people-outline" 
            color="#4560F7" 
          />
          <AdminStatCard 
            title="Pending Verif." 
            value={stats?.pendingVerifications || '0'} 
            icon="shield-half-sharp" 
            color="#FF9500" 
            onPress={() => router.push('/admin/verifications')}
          />
          <AdminStatCard 
            title="Total Properties" 
            value={stats?.totalProperties || '0'} 
            icon="business-outline" 
            color="#00C853" 
          />
          <AdminStatCard 
            title="Total Revenue" 
            value={formatCurrency(stats?.totalRevenue || 0)} 
            icon="cash-outline" 
            color="#FF3B30" 
          />
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuGrid}>
          <AdminMenuButton 
            title="Identity Verifications" 
            subtitle={`${stats?.pendingVerifications || 0} pending review`}
            icon="shield-checkmark-outline" 
            onPress={() => router.push('/admin/verifications')}
            badge={stats?.pendingVerifications > 0}
          />
          <AdminMenuButton 
            title="Payout Requests" 
            subtitle="Review pending withdrawals"
            icon="card-outline" 
            onPress={() => router.push('/admin/payouts')}
          />
          <AdminMenuButton 
            title="Manage Users" 
            subtitle="Search and edit users"
            icon="person-search-outline" 
            onPress={() => router.push('/admin/users')}
          />
          <AdminMenuButton 
            title="Platform Settings" 
            subtitle="Fees, limits, etc."
            icon="options-outline" 
            onPress={() => router.push('/admin/settings')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminStatCard({ title, value, icon, color, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.statCard} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

function AdminMenuButton({ title, subtitle, icon, onPress, badge }: any) {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={24} color="#4560F7" />
        {badge && <View style={styles.badge} />}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  menuGrid: {
    gap: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

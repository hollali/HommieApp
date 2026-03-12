import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { setMockProfile } from '../lib/mockAuth';

export default function SwitchRoleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'tenant', label: 'Tenant', description: 'Find and rent properties' },
    { value: 'airbnb_host', label: 'Airbnb Host', description: 'List short-stay properties' },
    { value: 'landlord', label: 'Landlord', description: 'List and manage long-term rentals' },
    { value: 'agent', label: 'Agent', description: 'Manage multiple property listings' },
  ];

  const handleSwitchRole = async (newRole: string) => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to switch roles');
      return;
    }

    if (newRole === user?.role) {
      Alert.alert('Info', 'You are already using this role');
      return;
    }

    Alert.alert(
      'Switch Role',
      `Are you sure you want to switch to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            setLoading(true);
            try {
              if (!isSupabaseConfigured) {
                await setMockProfile({ role: newRole as any });
                Alert.alert('Success', `Role switched to ${newRole}`, [
                  { text: 'OK', onPress: () => router.back() },
                ]);
                return;
              }

              const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', user?.id);

              if (error) throw error;

              // User profile will refresh automatically via useAuth hook
              Alert.alert('Success', `Role switched to ${newRole}`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to switch role');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Switch Role</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          Switch between different roles to access features tailored to your needs.
        </Text>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleCard,
                user?.role === role.value && styles.roleCardActive,
              ]}
              onPress={() => handleSwitchRole(role.value)}
              disabled={loading}
            >
              <View style={styles.roleHeader}>
                <View>
                  <Text style={[
                    styles.roleLabel,
                    user?.role === role.value && styles.roleLabelActive,
                  ]}>
                    {role.label}
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    user?.role === role.value && styles.roleDescriptionActive,
                  ]}>
                    {role.description}
                  </Text>
                </View>
                {user?.role === role.value && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Current</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#0066FF" />
          <Text style={styles.infoText}>
            You can switch roles anytime. Some features may require additional verification for landlord, agent, and host roles.
          </Text>
        </View>
      </ScrollView>
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
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  rolesContainer: {
    marginBottom: 32,
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  roleCardActive: {
    backgroundColor: '#F0F7FF',
    borderColor: '#4560F7',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  roleLabelActive: {
    color: '#4560F7',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  roleDescriptionActive: {
    color: '#4560F7',
  },
  activeBadge: {
    backgroundColor: '#4560F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4560F7',
    lineHeight: 20,
  },
});



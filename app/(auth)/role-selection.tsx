import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { setMockProfile } from '../../lib/mockAuth';

const roles = [
  { value: 'tenant', label: 'Tenant', description: 'Find and rent properties' },
  { value: 'airbnb_host', label: 'Airbnb Host', description: 'List short-stay properties' },
  { value: 'landlord', label: 'Landlord', description: 'List and manage long-term rentals' },
  { value: 'agent', label: 'Agent', description: 'Manage multiple property listings' },
];

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      // Update Supabase/local storage
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('users')
          .update({ role: selectedRole })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Update mock profile
        await setMockProfile({ role: selectedRole as any });
      }

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>Hommie</Text>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select how you'll use Hommie</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleCard,
                selectedRole === role.value && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(role.value)}
            >
              <Text style={[
                styles.roleLabel,
                selectedRole === role.value && styles.roleLabelSelected,
              ]}>
                {role.label}
              </Text>
              <Text style={[
                styles.roleDescription,
                selectedRole === role.value && styles.roleDescriptionSelected,
              ]}>
                {role.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, (!selectedRole || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  rolesContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#F9F9F9',
  },
  roleCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  roleLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  roleLabelSelected: {
    color: '#0066FF',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  roleDescriptionSelected: {
    color: '#0066FF',
  },
  button: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});


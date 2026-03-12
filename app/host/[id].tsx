import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getUserById } from '../../lib/mockData';
import { useAuth } from '../../hooks/useAuth';

export default function HostProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hostId = Array.isArray(id) ? id[0] : id || '';
  const router = useRouter();
  const { user } = useAuth();

  const { data: host } = useQuery({
    queryKey: ['host-profile', hostId],
    queryFn: async () => {
      if (!hostId) return null;
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('users').select('*').eq('id', hostId).single();
        return data || null;
      }
      return getUserById(hostId);
    },
    enabled: !!hostId,
  });

  if (!host) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Host Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Host not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleMessageHost = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to message this host.');
      router.push('/(auth)/login');
      return;
    }
    const { getOrCreateChat } = await import('../../lib/mockData');
    const chat = await getOrCreateChat(user.id, host.id, `host_${host.id}`);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Host Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {host.avatar_url ? (
              <Image source={{ uri: host.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={48} color="#4560F7" />
            )}
          </View>
          <Text style={styles.name}>{host.full_name || 'Host'}</Text>
          <Text style={styles.subtitle}>
            {host.verification_status === 'verified' ? 'Verified Host' : 'Host'}
          </Text>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessageHost}>
            <Text style={styles.messageButtonText} numberOfLines={1} ellipsizeMode="tail">
              Message Host
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionText}>{host.host_about || 'No bio added yet.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Host Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#0066FF" />
            <Text style={styles.detailText}>Host since: {host.host_since || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" />
            <Text style={styles.detailText}>Response rate: {host.host_response_rate || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0066FF" />
            <Text style={styles.detailText}>Languages: {host.host_languages || 'N/A'}</Text>
          </View>
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
  profileCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4560F7',
    fontWeight: '600',
  },
  messageButton: {
    marginTop: 16,
    backgroundColor: '#4560F7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  messageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#000',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});

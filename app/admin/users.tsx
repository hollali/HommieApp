import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../lib/adminService';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    const data = await adminService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const roles = ['tenant', 'landlord', 'agent', 'airbnb_host', 'admin', 'super_admin'];
    
    Alert.alert(
      'Change Role',
      `Select a new role for this user. Current role: ${currentRole}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...roles.filter(r => r !== currentRole && r !== 'super_admin').map(role => ({
          text: `Make ${role}`,
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.updateUserRole(userId, role);
              Alert.alert('Success', 'Role updated successfully');
              await loadUsers();
            } catch (err) {
              Alert.alert('Error', 'Failed to update role');
              setLoading(false);
            }
          }
        }))
      ]
    );
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator size="large" color="#4560F7" style={{ marginTop: 20 }} />
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#CCC" />
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Image 
                  source={{ uri: user.avatar_url || 'https://via.placeholder.com/150' }} 
                  style={styles.avatar} 
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.full_name || 'No Name'}</Text>
                  <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
                  
                  <View style={styles.tags}>
                    <View style={[styles.roleTag, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                      <Text style={[styles.roleTagText, { color: getRoleColor(user.role) }]}>
                        {user.role}
                      </Text>
                    </View>
                    {user.verification_status === 'verified' && (
                      <Ionicons name="checkmark-circle" size={16} color="#00C853" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => handleRoleChange(user.id, user.role)}
                >
                  <Ionicons name="swap-horizontal" size={18} color="#4560F7" />
                  <Text style={styles.actionBtnText}>Change Role</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
    case 'super_admin': return '#FF3B30';
    case 'landlord': return '#00C853';
    case 'agent': return '#FF9500';
    case 'airbnb_host': return '#9C27B0';
    default: return '#4560F7'; // tenant
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9F9',
    margin: 20, marginBottom: 0,
    borderRadius: 12, paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#000' },
  content: { flex: 1 },
  list: { padding: 20, gap: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { marginTop: 12, fontSize: 16, color: '#666', fontWeight: '500' },
  userCard: {
    borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16,
    backgroundColor: '#FFF'
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0' },
  userDetails: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 16, fontWeight: '700', color: '#000' },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  tags: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  actions: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F0F7FF' },
  actionBtnText: { color: '#4560F7', fontSize: 14, fontWeight: '600' }
});

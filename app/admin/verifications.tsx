import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../lib/adminService';

export default function VerificationReviewScreen() {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    const data = await adminService.getPendingVerifications();
    setPendingUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (userId: string, status: 'verified' | 'unverified') => {
    if (status === 'unverified' && !rejectionReason) {
      Alert.alert('Reason required', 'Please provide a reason for rejecting the verification.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.updateVerificationStatus(userId, status, rejectionReason);
      Alert.alert('Success', `User has been ${status === 'verified' ? 'approved' : 'rejected'}.`);
      setSelectedUser(null);
      setRejectionReason('');
      fetchPending();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4560F7" />
        <Text style={styles.loadingText}>Loading Verifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Verifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={80} color="#CCC" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>There are no pending identity verifications at the moment.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.countText}>{pendingUsers.length} Pending Verification{pendingUsers.length > 1 ? 's' : ''}</Text>
            {pendingUsers.map((user) => (
              <TouchableOpacity 
                key={user.id} 
                style={styles.userCard}
                onPress={() => setSelectedUser(user)}
              >
                <View style={styles.userAvatar}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={24} color="#4560F7" />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.full_name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.requestTime}>
                    Requested: {new Date(user.verification_requested_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.docCountBadge}>
                  <Ionicons name="documents-outline" size={14} color="#FFF" />
                  <Text style={styles.docCountText}>{user.verification_documents?.length || 0}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={!!selectedUser} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Review ID</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>{selectedUser?.full_name}</Text>
              <Text style={styles.reviewerEmail}>{selectedUser?.email}</Text>
            </View>

            <Text style={styles.sectionLabel}>Submitted Documents</Text>
            <View style={styles.docsGallery}>
              {selectedUser?.verification_documents?.map((url: string, index: number) => (
                <View key={index} style={styles.docWrapper}>
                  <Image source={{ uri: url }} style={styles.docImage} resizeMode="contain" />
                  <Text style={styles.docLabel}>Document {index + 1}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionSection}>
              <Text style={styles.sectionLabel}>Admin Action</Text>
              <TextInput 
                style={styles.reasonInput}
                placeholder="Reason for rejection (optional for approval)"
                placeholderTextColor="#999"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.rejectBtn, actionLoading && styles.btnDisabled]}
                  onPress={() => handleAction(selectedUser.id, 'unverified')}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.approveBtn, actionLoading && styles.btnDisabled]}
                  onPress={() => handleAction(selectedUser.id, 'verified')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Approve</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContainer: {
    padding: 20,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  requestTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  docCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4560F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  docCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  reviewerInfo: {
    marginBottom: 24,
  },
  reviewerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  reviewerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  docsGallery: {
    gap: 20,
    marginBottom: 32,
  },
  docWrapper: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  docImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#EEE',
    borderRadius: 8,
  },
  docLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 24,
    paddingBottom: 40,
  },
  reasonInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FF3B30',
  },
  approveBtn: {
    backgroundColor: '#00C853',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

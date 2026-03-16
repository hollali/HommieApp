import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../lib/adminService';
import { formatCurrency } from '../../lib/constants';

export default function AdminPayoutsScreen() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadPayouts = async () => {
    const data = await adminService.getPayoutRequests();
    setPayouts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleApprove = async (id: string, amount: number) => {
    Alert.alert(
      'Confirm Approval',
      `Are you sure you want to approve this payout of ${formatCurrency(amount)}? Have you completed the transfer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.updatePayoutStatus(id, 'paid');
              Alert.alert('Success', 'Payout approved');
              await loadPayouts();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve payout');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      await adminService.updatePayoutStatus(rejectingId, 'rejected', rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
      Alert.alert('Success', 'Payout rejected');
      await loadPayouts();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject payout');
      setLoading(false);
    }
  };

  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');
  const completedPayouts = payouts.filter(p => p.status === 'paid' || p.status === 'rejected');

  const displayData = activeTab === 'pending' ? pendingPayouts : completedPayouts;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingPayouts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]} 
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            History ({completedPayouts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator size="large" color="#4560F7" style={{ marginTop: 20 }} />
        ) : displayData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={48} color="#CCC" />
            <Text style={styles.emptyStateText}>No payout requests found</Text>
          </View>
        ) : (
          displayData.map((payout) => (
            <View key={payout.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{payout.users?.full_name || 'Unknown User'}</Text>
                  <Text style={styles.cardSubtitle}>{new Date(payout.requested_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(payout.amount)}</Text>
              </View>

              <View style={styles.detailsBox}>
                <Text style={styles.detailText}>Method: <Text style={styles.bold}>{payout.method.replace('_', ' ').toUpperCase()}</Text></Text>
                <Text style={styles.detailText}>Provider: <Text style={styles.bold}>{payout.account_details?.provider}</Text></Text>
                <Text style={styles.detailText}>Account: <Text style={styles.bold}>{payout.account_details?.account_number}</Text></Text>
                {payout.status !== 'pending' && payout.status !== 'processing' && (
                   <Text style={[styles.detailText, { marginTop: 8 }]}>Status: <Text style={[styles.bold, { color: payout.status === 'paid' ? '#00C853' : '#FF3B30' }]}>{payout.status.toUpperCase()}</Text></Text>
                )}
                {payout.rejection_reason && (
                  <Text style={styles.reasonText}>Reason: {payout.rejection_reason}</Text>
                )}
              </View>

              {activeTab === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnReject]}
                    onPress={() => setRejectingId(payout.id)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                    <Text style={styles.btnRejectText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnApprove]}
                    onPress={() => handleApprove(payout.id, payout.amount)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.btnApproveText}>Mark as Paid</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal visible={!!rejectingId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Payout</Text>
            <Text style={styles.modalSubtitle}>Please explicitly provide a reason for rejecting this payout. This will be shown to the user.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for rejection..."
              multiline
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { setRejectingId(null); setRejectionReason(''); }}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDanger]} onPress={handleReject}>
                <Text style={styles.modalBtnDangerText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4560F7' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#4560F7' },
  content: { flex: 1 },
  list: { padding: 20, gap: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { marginTop: 12, fontSize: 16, color: '#666', fontWeight: '500' },
  card: {
    borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16,
    backgroundColor: '#FFF'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '700', color: '#4560F7' },
  detailsBox: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 16 },
  detailText: { fontSize: 14, color: '#444', marginBottom: 4 },
  bold: { fontWeight: '700', color: '#000' },
  reasonText: { fontSize: 13, color: '#FF3B30', marginTop: 8, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  btnReject: { backgroundColor: '#FFF0F0' },
  btnApprove: { backgroundColor: '#4560F7' },
  btnRejectText: { color: '#FF3B30', fontWeight: '600' },
  btnApproveText: { color: '#FFF', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnDanger: { backgroundColor: '#FF3B30' },
  modalBtnText: { color: '#666', fontWeight: '600' },
  modalBtnDangerText: { color: '#FFF', fontWeight: '600' }
});

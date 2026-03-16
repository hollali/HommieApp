import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.list}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Maintenance Mode</Text>
              <Text style={styles.settingDesc}>Temporarily disable user access to the app</Text>
            </View>
            <Switch value={false} onValueChange={() => {}} />
          </View>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>New User Registrations</Text>
              <Text style={styles.settingDesc}>Allow new users to sign up</Text>
            </View>
            <Switch value={true} onValueChange={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fees & Commissions</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Booking Commission (%)</Text>
              <Text style={styles.settingDesc}>Current: 5%</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Host Payout Fee</Text>
              <Text style={styles.settingDesc}>Current: 1%</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Require KYC for Listing</Text>
              <Text style={styles.settingDesc}>Hosts must be verified before posting properties</Text>
            </View>
            <Switch value={true} onValueChange={() => {}} />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  settingDesc: { fontSize: 13, color: '#666', marginTop: 4 },
  saveBtn: {
    backgroundColor: '#4560F7', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 24
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});

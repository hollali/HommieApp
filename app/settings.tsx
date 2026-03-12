import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
  const router = useRouter();
  useAuth(); // auth context; user not used on settings menu

  const settingsOptions = [
    {
      id: 'edit-profile',
      icon: 'person-outline',
      label: 'Edit Profile',
      screen: '/profile/edit',
    },
    {
      id: 'payments',
      icon: 'card-outline',
      label: 'Payments',
      screen: '/payments',
    },
    {
      id: 'biometrics',
      icon: 'finger-print-outline',
      label: 'Biometric Authentication',
      screen: '/settings/biometrics',
    },
    {
      id: 'verification',
      icon: 'checkmark-circle-outline',
      label: 'Identity Verification',
      screen: '/verification',
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notifications',
      screen: '/settings/notifications',
    },
    {
      id: 'switch-role',
      icon: 'swap-vertical-outline',
      label: 'Switch role',
      screen: '/switch-role',
    },
    {
      id: 'list-space',
      icon: 'home-outline',
      label: 'List your space',
      screen: '/property/create',
    },
    {
      id: 'support',
      icon: 'help-circle-outline',
      label: 'Contact Support',
      screen: '/support',
    },
    {
      id: 'lists',
      icon: 'list-outline',
      label: 'Your Lists',
      screen: '/lists',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.settingItem}
            onPress={() => router.push(option.screen as any)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name={option.icon as any} size={24} color="#0066FF" />
            </View>
            <Text style={styles.settingLabel}>{option.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
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
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});


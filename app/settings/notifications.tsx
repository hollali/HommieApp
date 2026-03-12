import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@hommie:notification_settings';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  newListings: boolean;
  messages: boolean;
  bookings: boolean;
  favorites: boolean;
  promotions: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    newListings: true,
    messages: true,
    bookings: true,
    favorites: true,
    promotions: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (data) {
        setSettings(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Methods</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications on your device</Text>
              </View>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={(value) => updateSetting('pushEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications via email</Text>
              </View>
            </View>
            <Switch
              value={settings.emailEnabled}
              onValueChange={(value) => updateSetting('emailEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications via SMS</Text>
              </View>
            </View>
            <Switch
              value={settings.smsEnabled}
              onValueChange={(value) => updateSetting('smsEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Notify Me About</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="home-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>New Listings</Text>
                <Text style={styles.settingDescription}>Properties matching your search</Text>
              </View>
            </View>
            <Switch
              value={settings.newListings}
              onValueChange={(value) => updateSetting('newListings', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubbles-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Messages</Text>
                <Text style={styles.settingDescription}>New messages from hosts/landlords</Text>
              </View>
            </View>
            <Switch
              value={settings.messages}
              onValueChange={(value) => updateSetting('messages', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Bookings</Text>
                <Text style={styles.settingDescription}>Booking confirmations and updates</Text>
              </View>
            </View>
            <Switch
              value={settings.bookings}
              onValueChange={(value) => updateSetting('bookings', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Favorites</Text>
                <Text style={styles.settingDescription}>Updates on saved properties</Text>
              </View>
            </View>
            <Switch
              value={settings.favorites}
              onValueChange={(value) => updateSetting('favorites', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="gift-outline" size={24} color="#0066FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Promotions</Text>
                <Text style={styles.settingDescription}>Special offers and discounts</Text>
              </View>
            </View>
            <Switch
              value={settings.promotions}
              onValueChange={(value) => updateSetting('promotions', value)}
              trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
              thumbColor="#FFF"
            />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});

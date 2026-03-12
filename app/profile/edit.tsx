import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { setMockProfile } from '../../lib/mockAuth';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const formatRole = (role?: string) => {
    if (!role) return 'Tenant';
    if (role === 'airbnb_host') return 'Airbnb Host';
    if (role === 'super_admin') return 'Super Admin';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '');
  const [hostAbout, setHostAbout] = useState(user?.host_about || '');
  const [hostLanguages, setHostLanguages] = useState(user?.host_languages || '');
  const [hostResponseRate, setHostResponseRate] = useState(user?.host_response_rate || '');
  const [hostSince, setHostSince] = useState(user?.host_since || '');
  const [loading, setLoading] = useState(false);

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photos to continue.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setLoading(true);
    try {
      const profileData: any = {
        full_name: fullName,
        phone: phone || null,
        avatar_url: avatarUri || null,
        ...(user?.role === 'airbnb_host'
          ? {
              host_about: hostAbout || null,
              host_languages: hostLanguages || null,
              host_response_rate: hostResponseRate || null,
              host_since: hostSince || null,
            }
          : {}),
      };

      // Update Supabase/local storage
      if (!isSupabaseConfigured) {
        await setMockProfile(profileData);
      } else {
        const { error } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', user?.id);

        if (error) throw error;
      }

      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={48} color="#4560F7" />
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
            />
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Role</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.roleText}>{formatRole(user?.role)}</Text>
            </View>
            <Text style={styles.hint}>Change role in Settings</Text>
          </View>

          {user?.role === 'airbnb_host' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>About you</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share a short bio about yourself"
                  placeholderTextColor="#999"
                  value={hostAbout}
                  onChangeText={setHostAbout}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Languages</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. English, Twi"
                  placeholderTextColor="#999"
                  value={hostLanguages}
                  onChangeText={setHostLanguages}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Response rate</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 98%"
                  placeholderTextColor="#999"
                  value={hostResponseRate}
                  onChangeText={setHostResponseRate}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Host since</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2022"
                  placeholderTextColor="#999"
                  value={hostSince}
                  onChangeText={setHostSince}
                />
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4560F7',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    minHeight: 100,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4560F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});


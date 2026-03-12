import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { addReport } from '../../../lib/mockData';

type ReportReason = 'scam' | 'incorrect_info' | 'inappropriate_content' | 'spam' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; icon: string; description: string }[] = [
  {
    value: 'scam',
    label: 'Scam or Fraud',
    icon: 'warning',
    description: 'This listing appears to be fraudulent or a scam',
  },
  {
    value: 'incorrect_info',
    label: 'Incorrect Information',
    icon: 'information-circle',
    description: 'The listing contains false or misleading information',
  },
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    icon: 'ban',
    description: 'The listing contains inappropriate or offensive content',
  },
  {
    value: 'spam',
    label: 'Spam',
    icon: 'close-circle',
    description: 'This appears to be spam or a duplicate listing',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'ellipsis-horizontal',
    description: 'Another reason not listed above',
  },
];

export default function ReportPropertyScreen() {
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to submit a report');
      router.push('/(auth)/login');
      return;
    }

    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide additional details about your report');
      return;
    }

    setLoading(true);
    try {
      await addReport({
        reporter_id: user.id,
        target_type: 'property',
        target_id: propertyId || '',
        reason: selectedReason,
        description: description.trim(),
        status: 'pending',
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
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
        <Text style={styles.title}>Report Property</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Why are you reporting this property?</Text>
          <Text style={styles.sectionDescription}>
            Help us understand the issue so we can take appropriate action.
          </Text>

          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.value && styles.reasonCardSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View style={styles.reasonHeader}>
                  <View style={styles.reasonIconContainer}>
                    <Ionicons
                      name={reason.icon as any}
                      size={24}
                      color={selectedReason === reason.value ? '#0066FF' : '#666'}
                    />
                  </View>
                  <View style={styles.reasonTextContainer}>
                    <Text style={styles.reasonLabel}>{reason.label}</Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                  {selectedReason === reason.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.label}>Additional Details</Text>
            <Text style={styles.labelHint}>
              Please provide more information about why you're reporting this property
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#0066FF" />
            <Text style={styles.infoText}>
              Reports are reviewed by our moderation team. False reports may result in account restrictions.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  reasonsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  reasonCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  reasonCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reasonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonTextContainer: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 13,
    color: '#666',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

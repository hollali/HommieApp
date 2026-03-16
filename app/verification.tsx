import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { verificationService } from '../lib/verificationService';

export default function VerificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'unverified' | 'not_started'>('not_started');
  const [uploading, setUploading] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    verificationService.getVerificationStatus(user.id).then((status) => {
      if (status) {
        setVerificationStatus(status.verification_status as any);
        setDocumentsCount(status.verification_documents?.length || 0);
      }
    });
  }, [user]);

  const handleStartVerification = () => {
    startVerificationFlow();
  };

  const startVerificationFlow = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo access to upload your documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const documents = result.assets.map((asset) => asset.uri);
      
      if (user) {
        await verificationService.submitVerification(user.id, documents);
        setDocumentsCount(Math.min(3, documents.length));
        setVerificationStatus('pending');
      }

      setVerificationStatus('pending');
      Alert.alert(
        'Verification Submitted',
        'Your documents have been submitted. Our team will review them within 24-48 hours.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const requirements = [
    'Government-issued ID (Ghana Card, Passport, or Driver’s License)',
    'Proof of address (Utility bill or Bank statement)',
    'Clear photo of yourself holding your ID',
  ];
  const completedSteps =
    verificationStatus === 'pending' || verificationStatus === 'verified'
      ? requirements.length
      : documentsCount;
  const progressPercent = Math.min(1, completedSteps / requirements.length);

  const handleBack = () => {
    if (verificationStatus !== 'verified') {
      Alert.alert('Verification required', 'Complete verification to continue.');
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Identity Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusCard}>
          {verificationStatus === 'verified' && (
            <View style={styles.statusIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#25D366" />
            </View>
          )}
          {verificationStatus === 'pending' && (
            <View style={styles.statusIcon}>
              <Ionicons name="time-outline" size={64} color="#FFA500" />
            </View>
          )}
          {verificationStatus === 'not_started' && (
            <View style={styles.statusIcon}>
              <Ionicons name="document-text-outline" size={64} color="#0066FF" />
            </View>
          )}

          <Text style={styles.statusTitle}>
            {verificationStatus === 'verified'
              ? 'Verified'
              : verificationStatus === 'pending'
              ? 'Verification Pending'
              : 'Identity Not Verified'}
          </Text>
          <Text style={styles.statusDescription}>
            {verificationStatus === 'verified'
              ? 'Your identity has been verified. You can now list properties and receive payments.'
              : verificationStatus === 'pending'
              ? 'Your documents are being reviewed. This usually takes 24-48 hours.'
              : 'Verify your identity to list properties and receive payments securely.'}
          </Text>
          {verificationStatus !== 'verified' && (
            <Text style={styles.mandatoryText}>Verification is mandatory to continue.</Text>
          )}
        </View>

        <View style={styles.requirementsSection}>
          <Text style={styles.sectionTitle}>Verification Progress</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>{completedSteps} / {requirements.length} completed</Text>
            <Text style={styles.progressPercent}>{Math.round(progressPercent * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
          </View>

          <Text style={styles.sectionTitle}>Required Documents</Text>
          {requirements.map((item, index) => {
            const done = completedSteps > index;
            return (
              <View key={item} style={styles.requirementItem}>
                <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done ? '#25D366' : '#999'} />
                <Text style={[styles.requirementText, done && styles.requirementTextDone]}>{item}</Text>
              </View>
            );
          })}

          {verificationStatus !== 'verified' && (
            <TouchableOpacity
              style={[styles.startButton, uploading && styles.startButtonDisabled]}
              onPress={handleStartVerification}
              disabled={uploading}
            >
              <Text style={styles.startButtonText}>
                {uploading ? 'Uploading...' : verificationStatus === 'pending' ? 'Re-upload documents' : 'Start Verification'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {verificationStatus === 'pending' && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#0066FF" />
            <Text style={styles.infoText}>
              We'll notify you once your verification is complete. You can continue using the app in the meantime.
            </Text>
          </View>
        )}
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
  statusCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  mandatoryText: {
    marginTop: 12,
    fontSize: 12,
    color: '#B00020',
    fontWeight: '600',
  },
  requirementsSection: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4560F7',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  requirementTextDone: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0066FF',
    lineHeight: 20,
  },
});



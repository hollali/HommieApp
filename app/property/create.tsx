import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Image } from 'expo-image';

export default function PropertyCreateScreen() {
  const router = useRouter();
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const placeholderImage = require('../../assets/property-placeholder.png');
  const { user } = useAuth();

  if (user?.role === 'tenant') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#CCC" />
          <Text style={styles.lockTitle}>Listings are for agents, landlords, and hosts</Text>
          <Text style={styles.lockSubtitle}>Switch role to create listings</Text>
          <TouchableOpacity style={styles.lockButton} onPress={() => router.push('/switch-role')}>
            <Text style={styles.lockButtonText}>Switch Role</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const questions = [
    {
      title: 'What should I prepare?',
      body: 'Gather clear photos, the exact location, and pricing before you start.',
    },
    {
      title: 'How many photos do I need?',
      body: 'At least one is required, but 5–8 high quality photos work best.',
    },
    {
      title: 'What if I don’t know the exact area?',
      body: 'Use the nearest landmark or popular location to help tenants find it.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>Save & Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setQuestionsOpen(true)}>
          <Text style={styles.headerButton}>Questions</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>Step 1</Text>
          <Text style={styles.stepTitle}>Tell us about</Text>
          <Text style={styles.stepTitle}>your place</Text>
          <Text style={styles.stepDescription}>
            in this step, we'll ask you which type of property you have. with key informations about
            the property such as the location, description and photos
          </Text>
        </View>

        <View style={styles.floorPlanContainer}>
          <Image
            source={placeholderImage}
            style={styles.floorPlanImage}
            contentFit="cover"
          />
        </View>

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => router.push('/property/create/step1')}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={questionsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Questions</Text>
              <TouchableOpacity onPress={() => setQuestionsOpen(false)}>
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {questions.map((item) => (
                <View key={item.title} style={styles.modalItem}>
                  <Text style={styles.modalItemTitle}>{item.title}</Text>
                  <Text style={styles.modalItemText}>{item.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
  floorPlanContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
  },
  floorPlanImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    maxHeight: 320,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  modalItemText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  lockButton: {
    marginTop: 20,
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lockButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});


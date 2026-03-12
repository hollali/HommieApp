import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ContactSupportScreen() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    {
      question: 'How do I list a property?',
      answer: 'Go to Profile > My Listings, then tap Create Listing and follow the steps.',
    },
    {
      question: 'How do I get verified?',
      answer: 'Open a property and select Verification. Pay the fee and our team will review it.',
    },
    {
      question: 'How do I contact a landlord?',
      answer: 'Open a listing and use the Contact section. Hosts are booked in-app only.',
    },
    {
      question: 'Why can’t I see my listings?',
      answer: 'Listings are available for agents, landlords, and hosts. Switch role in Settings.',
    },
  ];

  const handleCall = () => {
    Linking.openURL('tel:+233123456789');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@hommie.app?subject=Support Request');
  };

  const handleLiveChat = () => {
    // Use in-app chat as support chat placeholder
    Alert.alert('Live Chat', 'Starting a support chat...', [
      { text: 'OK', onPress: () => router.push('/(tabs)/chats') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <SupportOption title="Call Us" icon="call" onPress={handleCall} />
        <SupportOption title="Email Us" icon="mail" onPress={handleEmail} />
        <SupportOption title="Live Chat" icon="chatbubbles" onPress={handleLiveChat} />

        <Text style={styles.sectionTitle}>FAQs</Text>
        <View style={styles.faqCard}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <TouchableOpacity
                key={faq.question}
                style={styles.faqItem}
                onPress={() => setOpenFaq(isOpen ? null : index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#666"
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SupportOption({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.optionCard} onPress={onPress}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.optionButton}>
        <Ionicons name={icon as any} size={20} color="#FFF" />
      </View>
    </TouchableOpacity>
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
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  optionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4560F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  faqItem: {
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});


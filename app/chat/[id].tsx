import { useState } from 'react';
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getMessages, sendMessage as sendMessageToStorage, getProperties, getUserById } from '../../lib/mockData';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FEATURE_FLAGS } from '../../lib/featureFlags';
import { formatGhanaPhone } from '../../lib/constants';
import ChatInterface from '../../components/ChatInterface';
import { messagingService, Conversation } from '../../lib/messaging';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [attachmentSending, setAttachmentSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [useNewChatInterface, setUseNewChatInterface] = useState(true); // Toggle for new interface

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => messagingService.getMessages(user?.id || '', '', undefined, chatId),
    enabled: !!chatId && !!user,
    refetchInterval: 5000, // Poll less frequently when using Realtime
  });

  const { data: chat } = useQuery({
    queryKey: ['chat', chatId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await messagingService.getConversationById(chatId);
    },
    enabled: !!user && !!chatId,
  });

  const { data: contact } = useQuery({
    queryKey: ['chat-contact', chat?.id, chat?.property_id, user?.id],
    queryFn: async () => {
      if (!chat || !user) return null;

      const otherUserId = chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id;

      const properties = await getProperties();
      const property = properties.find((p) => p.id === chat.property_id);
      const isAirbnbBlocked = property?.type === 'airbnb' || property?.owner?.role === 'airbnb_host';

      // Prefer owner details from property when chatting with the owner
      let otherUser =
        property && otherUserId === property.owner_id && property.owner ? property.owner : await getUserById(otherUserId);

      return {
        isAirbnbBlocked,
        name: otherUser?.full_name || (isAirbnbBlocked ? 'Host' : 'Contact'),
        phone: otherUser?.phone || null,
      };
    },
    enabled: !!chat && !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ text, imageUrl }: { text: string; imageUrl?: string }) => {
      if (!user) throw new Error('Not authenticated');
      // Get chat to find receiver
      const chat = await messagingService.getConversationById(chatId);
      if (!chat) throw new Error('Chat not found');

      const receiverId = chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id;
      return await messagingService.sendMessage({
        chat_id: chatId,
        sender_id: user.id,
        receiver_id: receiverId,
        property_id: chat.property_id,
        content: text,
        type: imageUrl ? 'image' : 'text',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      setIsTyping(false);
    },
  });

  // Mark messages as read when viewing
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      await messagingService.markAsRead(user?.id || '', chatId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  // Mark messages as read when component mounts or messages change
  React.useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages
        .filter((m) => m.receiver_id === user.id && !m.read_at)
        .map((m) => m.id);
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(unreadMessages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markAsReadMutation stable, omit to avoid extra runs
  }, [messages, user]);

  const handleSend = () => {
    if (!message.trim() || !user) return;
    sendMutation.mutate({ text: message.trim() });
    setMessage('');
    setIsTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    // Typing indicator logic
    if (!isTyping && text.trim().length > 0) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
    setTypingTimeout(timeout);
  };

  const handleCall = () => {
    if (!contact) return;
    if (contact.isAirbnbBlocked) {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    const phone = contact.phone ? formatGhanaPhone(contact.phone) : null;
    if (!phone) {
      Alert.alert('No phone number', 'This user has not added a phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    if (!contact) return;
    if (contact.isAirbnbBlocked) {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    const phone = contact.phone ? formatGhanaPhone(contact.phone) : null;
    if (!phone) {
      Alert.alert('No phone number', 'This user has not added a phone number.');
      return;
    }
    const waNumber = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${waNumber}`);
  };

  const handleScheduleViewing = () => {
    if (!FEATURE_FLAGS.airbnbBookings) {
      Alert.alert('Coming soon', 'In-app bookings will be available after launch.');
      return;
    }
    if (!chat?.property_id) {
      Alert.alert('Unavailable', 'No property linked to this chat.');
      return;
    }
    router.push(`/booking/${chat.property_id}`);
  };

  const handleOpenListing = () => {
    if (!chat?.property_id) {
      Alert.alert('Unavailable', 'No property linked to this chat.');
      return;
    }
    router.push(`/property/${chat.property_id}`);
  };

  const handlePlusPress = () => {
    if (message.trim()) {
      handleSend();
      return;
    }
    setActionsOpen(true);
  };

  const handleAttachPhoto = async () => {
    if (attachmentSending || !user) return;
    setAttachmentSending(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo access to attach an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0].uri;
      await sendMutation.mutateAsync({ text: `📷 Photo: ${uri}`, imageUrl: uri });
      setActionsOpen(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to attach photo');
    } finally {
      setAttachmentSending(false);
    }
  };

  const handleShareListing = async () => {
    if (!chat?.property_id || !user) {
      Alert.alert('Unavailable', 'No property linked to this chat.');
      return;
    }
    try {
      const properties = await getProperties();
      const property = properties.find((p) => p.id === chat.property_id);
      if (!property) {
        Alert.alert('Unavailable', 'Listing not found.');
        return;
      }
      const summary = `${property.title} • ${property.area}, ${property.city}`;
      await sendMutation.mutateAsync({ text: `Listing: ${summary}` });
      setActionsOpen(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share listing');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {useNewChatInterface ? (
        <ChatInterface
          conversationId={chatId || ''}
          otherUserId={chat?.participant1_id === user?.id ? chat?.participant2_id || '' : chat?.participant1_id || ''}
          propertyId={chat?.property_id}
          onBack={() => router.back()}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerAvatar}>
                <Ionicons name="person" size={24} color="#0066FF" />
              </View>
              <Text style={styles.headerName}>{contact?.name || 'Chat'}</Text>
            </View>
            <View style={styles.headerActions}>
              {!!contact && !contact.isAirbnbBlocked && (
                <>
                  <TouchableOpacity style={styles.headerIconButton} onPress={handleCall}>
                    <Ionicons name="call-outline" size={20} color="#0066FF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerIconButton} onPress={handleWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
          >
            {messagesLoading ? (
              <View style={styles.loadingContainer}>
                <Text>Loading messages...</Text>
              </View>
            ) : (
              <>
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={{
                      ...item,
                      type: item.sender_id === user?.id ? 'sent' : 'received',
                    }}
                    isFirstMessage={item.content.includes('listing enquiry')}
                  />
                )}
                inverted={false}
              />
                {isTyping && (
                  <View style={styles.typingIndicator}>
                    <View style={styles.typingBubble}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                )}
                {contact?.isAirbnbBlocked && (
                  <View style={styles.lockedNotice}>
                    <Ionicons name="lock-closed" size={20} color="#666" />
                    <Text style={styles.lockedNoticeText}>
                      Real-time chat is limited until booking is confirmed.
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Write Message"
                placeholderTextColor="#999"
                value={message}
                onChangeText={handleTextChange}
                multiline
              />
              <View style={styles.inputActions}>
                {FEATURE_FLAGS.airbnbBookings && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleScheduleViewing}>
                    <Ionicons name="calendar-outline" size={20} color="#0066FF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton} onPress={handleOpenListing}>
                  <Ionicons name="person-add-outline" size={20} color="#0066FF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendButton} onPress={handlePlusPress}>
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          <Modal
            visible={actionsOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setActionsOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Actions</Text>
                <TouchableOpacity style={styles.modalAction} onPress={handleAttachPhoto} disabled={attachmentSending}>
                  <Ionicons name="image-outline" size={20} color="#0066FF" />
                  <Text style={styles.modalActionText}>
                    {attachmentSending ? 'Attaching...' : 'Attach Photo'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAction} onPress={handleShareListing}>
                  <Ionicons name="home-outline" size={20} color="#0066FF" />
                  <Text style={styles.modalActionText}>Share Listing</Text>
                </TouchableOpacity>
                {FEATURE_FLAGS.airbnbBookings && (
                  <TouchableOpacity style={styles.modalAction} onPress={handleScheduleViewing}>
                    <Ionicons name="calendar-outline" size={20} color="#0066FF" />
                    <Text style={styles.modalActionText} numberOfLines={1} ellipsizeMode="tail">
                      Book Stay
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.modalCancel} onPress={() => setActionsOpen(false)}>
                  <Text style={styles.modalCancelText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

function MessageBubble({ message, isFirstMessage }: { message: any; isFirstMessage?: boolean }) {
  // Check if this is an enquiry message (contains property reference)
  if (message.property_id && isFirstMessage) {
    return (
      <View style={styles.enquiryBubble}>
        <Text style={styles.enquiryTitle}>listing enquiry</Text>
        <View style={styles.enquiryContent}>
          <View style={styles.enquiryImage}>
            <Ionicons name="home" size={32} color="#666" />
          </View>
          <Text style={styles.enquiryAddress}>Property Listing</Text>
        </View>
        <Text style={styles.enquiryText}>{message.text}</Text>
        {message.type === 'sent' && (
          <View style={styles.messageStatus}>
            {message.read_at ? (
              <Ionicons name="checkmark-done" size={14} color="#0066FF" />
            ) : (
              <Ionicons name="checkmark" size={14} color="#999" />
            )}
          </View>
        )}
      </View>
    );
  }

  const isImageMessage = message.image_url || message.text.startsWith('📷 Photo:');

  return (
    <View style={[
      styles.messageBubble, 
      message.type === 'sent' && styles.messageBubbleSent,
      message.is_flagged && styles.flaggedBubble
    ]}>
      {message.is_flagged && (
        <View style={styles.flaggedHeader}>
          <Ionicons name="shield-checkmark" size={14} color="#B00020" />
          <Text style={styles.flaggedHeaderText}>Security Alert</Text>
        </View>
      )}
      {isImageMessage && (
        <View style={styles.messageImageContainer}>
          <Ionicons name="image" size={48} color={message.type === 'sent' ? '#FFF' : '#666'} />
        </View>
      )}
      <Text style={[
        styles.messageText, 
        message.type === 'sent' && styles.messageTextSent,
        message.is_flagged && styles.flaggedText
      ]}>
        {isImageMessage ? message.text.replace('📷 Photo: ', '') : message.text}
      </Text>
      {message.is_flagged && (
        <Text style={styles.flaggedReason}>
          {message.flag_reason || 'This message was flagged for containing restricted contact info.'}
        </Text>
      )}
      {message.type === 'sent' && (
        <View style={styles.messageStatus}>
          {message.read_at ? (
            <Ionicons name="checkmark-done" size={14} color={message.type === 'sent' ? '#FFF' : '#0066FF'} />
          ) : (
            <Ionicons name="checkmark" size={14} color={message.type === 'sent' ? 'rgba(255,255,255,0.7)' : '#999'} />
          )}
        </View>
      )}
    </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    minWidth: 24,
    justifyContent: 'flex-end',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messagesList: {
    padding: 20,
    gap: 16,
  },
  enquiryBubble: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  enquiryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 12,
  },
  enquiryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  enquiryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enquiryAddress: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  enquiryText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  messageBubble: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  messageBubbleSent: {
    backgroundColor: '#0066FF',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  messageTextSent: {
    color: '#FFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalActionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    flexShrink: 1,
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  messageStatus: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageImageContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F5F5',
    margin: 20,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  lockedNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  flaggedBubble: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFDADA',
    borderWidth: 1,
  },
  flaggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  flaggedHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B00020',
    textTransform: 'uppercase',
  },
  flaggedText: {
    color: '#333',
    opacity: 0.6,
  },
  flaggedReason: {
    fontSize: 11,
    color: '#B00020',
    marginTop: 6,
    fontStyle: 'italic',
    padding: 6,
    backgroundColor: 'rgba(176, 0, 32, 0.05)',
    borderRadius: 6,
  },
});


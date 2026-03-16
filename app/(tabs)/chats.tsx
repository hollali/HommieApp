import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { 
  messagingService,
  getConversationDisplayName, 
  getConversationAvatar, 
  formatMessageTime 
} from '../../lib/messaging';

export default function ChatsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteChat = (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call an API
            console.log('Deleting chat:', chatId);
            // Update local state for demo
            queryClient.setQueryData(['chats', user?.id], (oldChats: any[]) => 
              oldChats?.filter(chat => chat.id !== chatId)
            );
          },
        },
      ]
    );
  };

  const archiveChat = (chatId: string) => {
    Alert.alert(
      'Archive Chat',
      'Are you sure you want to archive this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'default',
          onPress: () => {
            // In a real app, this would call an API
            console.log('Archiving chat:', chatId);
            // Update local state for demo
            queryClient.setQueryData(['chats', user?.id], (oldChats: any[]) => 
              oldChats?.filter(chat => chat.id !== chatId)
            );
          },
        },
      ]
    );
  };

  const resetSwipe = () => {
    // This will be called to reset the swipe position
    console.log('Reset swipe position');
  };

  const { data: chats, isLoading, refetch } = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await messagingService.getConversations(user.id);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.id) return;
    
    // Subscribe to any new messages to refresh the conversation list
    const unsubscribe = messagingService.subscribeToAllMessages(user.id, () => {
      refetch();
    });
    
    return () => unsubscribe();
  }, [user?.id, refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={64} color="#0066FF" />
          </View>
          <Text style={styles.emptyTitle}>No Message Yet On</Text>
          <Text style={styles.emptySubtitle}>Your Inbox</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.exploreButtonText}>Explore Listing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChatItem 
            chat={item} 
            onPress={() => router.push(`/chat/${item.id}`)}
            onDelete={() => deleteChat(item.id)}
            onArchive={() => archiveChat(item.id)}
            userId={user?.id || ''}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ChatItem({ 
  chat, 
  onPress, 
  onDelete, 
  onArchive,
  userId
}: { 
  chat: any; 
  onPress: () => void; 
  onDelete: () => void; 
  onArchive: () => void;
  userId: string;
}) {
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = 100;

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldDelete = event.translationX < -SWIPE_THRESHOLD;
      const shouldArchive = event.translationX > SWIPE_THRESHOLD;

      if (shouldDelete) {
        translateX.value = withSpring(-300);
        runOnJS(onDelete)();
      } else if (shouldArchive) {
        translateX.value = withSpring(300);
        runOnJS(onArchive)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -50 ? 1 : 0,
  }));

  const archiveStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 50 ? 1 : 0,
  }));

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.deleteButton, deleteStyle]}>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash" size={20} color="#FFF" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View style={[styles.archiveButton, archiveStyle]}>
        <TouchableOpacity onPress={onArchive} style={styles.actionButton}>
          <Ionicons name="archive" size={20} color="#FFF" />
          <Text style={styles.actionText}>Archive</Text>
        </TouchableOpacity>
      </Animated.View>

    <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedStyle]}>
          <TouchableOpacity style={styles.chatItem} onPress={onPress}>
            <View style={styles.avatar}>
              {getConversationAvatar(chat, userId) ? (
                <Image source={{ uri: getConversationAvatar(chat, userId) }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={24} color="#0066FF" />
              )}
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>
                {getConversationDisplayName(chat, userId)}
              </Text>
              <Text style={styles.chatPreview} numberOfLines={1}>
                {chat.last_message || 'No messages yet'}
              </Text>
            </View>
            <View style={styles.chatMeta}>
              <Text style={[
                styles.chatTime, 
                (chat.unread_count > 0) && styles.chatTimeUnread
              ]}>
                {formatMessageTime(chat.last_message_time || chat.created_at)}
              </Text>
              {chat.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{chat.unread_count}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
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
  listContent: {
    padding: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  chatTimeUnread: {
    color: '#0066FF',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#0066FF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 32,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  archiveButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});


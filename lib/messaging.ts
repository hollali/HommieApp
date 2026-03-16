import { supabase, isSupabaseConfigured } from './supabase';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  content: string;
  type: 'text' | 'image' | 'location';
  created_at: string;
  updated_at?: string;
  read_at?: string;
  is_flagged?: boolean;
  flag_reason?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  property_id?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count_p1: number;
  unread_count_p2: number;
  created_at: string;
  updated_at?: string;
  participant1?: {
    id: string;
    name: string;
    avatar?: string;
  };
  participant2?: {
    id: string;
    name: string;
    avatar?: string;
  };
  property?: {
    id: string;
    title: string;
    images?: string[];
  };
}

class MessagingService {
  // Get all conversations for a user
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!isSupabaseConfigured) {
      // Fallback or empty during transitions
      return [];
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:users!participant1_id(id, full_name, avatar_url),
        participant2:users!participant2_id(id, full_name, avatar_url),
        property:properties(id, title)
      `)
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return (data || []).map(conv => ({
        ...conv,
        unread_count: conv.participant1_id === userId ? conv.unread_count_p1 : conv.unread_count_p2,
        participant1: {
            id: conv.participant1.id,
            name: conv.participant1.full_name,
            avatar: conv.participant1.avatar_url
        },
        participant2: {
            id: conv.participant2.id,
            name: conv.participant2.full_name,
            avatar: conv.participant2.avatar_url
        }
    })) as any;
  }

  // Get a single conversation by ID
  async getConversationById(conversationId: string): Promise<Conversation | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:users!participant1_id(id, full_name, avatar_url),
        participant2:users!participant2_id(id, full_name, avatar_url),
        property:properties(id, title)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return {
        ...data,
        participant1: {
            id: data.participant1.id,
            name: data.participant1.full_name,
            avatar: data.participant1.avatar_url
        },
        participant2: {
            id: data.participant2.id,
            name: data.participant2.full_name,
            avatar: data.participant2.avatar_url
        }
    } as any;
  }

  // Get messages for a specific conversation
  async getMessages(
    userId: string,
    otherUserId: string,
    propertyId?: string,
    chatId?: string
  ): Promise<Message[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase.from('messages').select('*');

    if (chatId) {
      query = query.eq('chat_id', chatId);
    } else {
        // Fallback to finding conversation first
        const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(participant1_id.eq.${userId},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${userId})`)
            .maybeSingle();
        
        if (!conv) return [];
        query = query.eq('chat_id', conv.id);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).map(msg => ({
        ...msg,
        content: msg.text // Map 'text' from DB to 'content' for UI
    })) as any;
  }

  // Send a message
  async sendMessage(message: Omit<Message, 'id' | 'created_at' | 'chat_id'> & { chat_id?: string }): Promise<Message | null> {
    if (!isSupabaseConfigured) return null;

    let targetChatId = message.chat_id;

    // 1. Find or create conversation if chatId not provided
    if (!targetChatId) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${message.sender_id},participant2_id.eq.${message.receiver_id}),and(participant1_id.eq.${message.receiver_id},participant2_id.eq.${message.sender_id})`)
        .maybeSingle();

      if (conv) {
        targetChatId = conv.id;
      } else {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant1_id: message.sender_id,
            participant2_id: message.receiver_id,
            property_id: message.property_id,
            last_message: message.content,
            last_message_time: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating conversation:', createError);
          return null;
        }
        targetChatId = newConv.id;
      }
    }

    // 2. Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: targetChatId,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        property_id: message.property_id,
        text: message.content,
        type: message.type || 'text'
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // 3. Update conversation last message and unread count
    // In a real production app, this would be a Postgres trigger or Edge Function
    // For this implementation, we do it client-side for simplicity if triggers are not fully setup
    try {
        await supabase.rpc('increment_unread_count', { 
            conv_id: targetChatId, 
            is_p1: false // Logic depends on who is receiving
        });
    } catch (e) {
        // Fallback update if RPC doesn't exist
        await supabase.from('conversations')
            .update({ 
                last_message: message.content, 
                last_message_time: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', targetChatId);
    }

    return { ...data, content: data.text } as any;
  }

  // Subscribe to all new messages for a user
  subscribeToAllMessages(
    userId: string,
    onMessage: (message: Message) => void
  ) {
    if (!isSupabaseConfigured) return () => {};

    const subscription = supabase
      .channel(`user-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          onMessage(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Mark messages as read
  async markAsRead(userId: string, conversationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Mark messages as read in messages table
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('chat_id', conversationId)
      .eq('receiver_id', userId)
      .is('read_at', null);

    // Reset unread count in conversations table
    const { data: conv } = await supabase
        .from('conversations')
        .select('participant1_id')
        .eq('id', conversationId)
        .single();
    
    if (conv) {
        const isP1 = conv.participant1_id === userId;
        await supabase
            .from('conversations')
            .update({ [isP1 ? 'unread_count_p1' : 'unread_count_p2']: 0 })
            .eq('id', conversationId);
    }
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) return 0;

    const { data, error } = await supabase
      .from('conversations')
      .select('unread_count_p1, unread_count_p2, participant1_id')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

    if (error) return 0;

    return (data || []).reduce((acc, conv) => {
        return acc + (conv.participant1_id === userId ? conv.unread_count_p1 : conv.unread_count_p2);
    }, 0);
  }

  // Subscribe to new messages for a conversation
  subscribeToMessages(
    userId: string,
    conversationId: string,
    callback: (message: Message) => void
  ): () => void {
    if (!isSupabaseConfigured) return () => {};

    const subscription = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${conversationId}`
      }, (payload) => {
        const msg = payload.new as any;
        callback({ ...msg, content: msg.text });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}

export const messagingService = new MessagingService();

// Utility functions
export const formatMessageTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes <= 0 ? 'now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getConversationDisplayName = (
  conversation: Conversation,
  currentUserId: string
): string => {
  const otherParticipant = 
    conversation.participant1_id === currentUserId 
      ? conversation.participant2 
      : conversation.participant1;
  
  return otherParticipant?.name || 'Unknown User';
};

export const getConversationAvatar = (
  conversation: Conversation,
  currentUserId: string
): string | undefined => {
  const otherParticipant = 
    conversation.participant1_id === currentUserId 
      ? conversation.participant2 
      : conversation.participant1;
  
  return otherParticipant?.avatar;
};

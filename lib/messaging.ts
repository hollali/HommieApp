export interface Message {
  id: string;
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
  last_message?: Message;
  unread_count: number;
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

// Mock messaging service (in production, this would use WebSocket/Realtime database)
class MessagingService {
  private messages: Message[] = [];
  private conversations: Conversation[] = [];
  private listeners: Map<string, ((message: Message) => void)[]> = new Map();

  // Initialize with some mock data
  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock conversations
    this.conversations = [
      {
        id: 'conv1',
        participant1_id: 'user1',
        participant2_id: 'user2',
        property_id: 'prop1',
        unread_count: 2,
        created_at: new Date().toISOString(),
        participant1: {
          id: 'user1',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        participant2: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: 'https://i.pravatar.cc/150?img=2',
        },
        property: {
          id: 'prop1',
          title: 'Modern 2-Bedroom Apartment',
          images: ['https://picsum.photos/200/300?random=1'],
        },
      },
    ];

    // Mock messages
    this.messages = [
      {
        id: 'msg1',
        sender_id: 'user2',
        receiver_id: 'user1',
        property_id: 'prop1',
        content: 'Hi! Is this apartment still available?',
        type: 'text',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read_at: undefined,
      },
      {
        id: 'msg2',
        sender_id: 'user2',
        receiver_id: 'user1',
        property_id: 'prop1',
        content: 'I\'m interested in viewing it this weekend.',
        type: 'text',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        read_at: undefined,
      },
    ];

    // Update last message for conversation
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      this.conversations[0].last_message = lastMessage;
    }
  }

  // Get all conversations for a user
  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversations.filter(
      conv => conv.participant1_id === userId || conv.participant2_id === userId
    );
  }

  // Get messages between two users (optionally filtered by property)
  async getMessages(
    userId1: string,
    userId2: string,
    propertyId?: string
  ): Promise<Message[]> {
    let messages = this.messages.filter(
      msg => 
        (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
        (msg.sender_id === userId2 && msg.receiver_id === userId1)
    );

    if (propertyId) {
      messages = messages.filter(msg => msg.property_id === propertyId);
    }

    return messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  // Send a message
  async sendMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };

    this.messages.push(newMessage);

    // Update conversation
    const conversation = this.findOrCreateConversation(
      message.sender_id,
      message.receiver_id,
      message.property_id
    );
    
    conversation.last_message = newMessage;
    conversation.updated_at = newMessage.created_at;

    // Update unread count for receiver
    if (message.receiver_id === conversation.participant1_id) {
      conversation.unread_count++;
    } else {
      conversation.unread_count++;
    }

    // Notify listeners
    this.notifyListeners(newMessage);

    return newMessage;
  }

  // Mark messages as read
  async markAsRead(userId: string, conversationId: string): Promise<void> {
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    // Mark unread messages as read
    const unreadMessages = this.messages.filter(
      msg => 
        msg.receiver_id === userId &&
        !msg.read_at &&
        ((msg.sender_id === conversation.participant1_id && msg.receiver_id === conversation.participant2_id) ||
         (msg.sender_id === conversation.participant2_id && msg.receiver_id === conversation.participant1_id))
    );

    unreadMessages.forEach(msg => {
      msg.read_at = new Date().toISOString();
    });

    // Reset unread count
    conversation.unread_count = 0;
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string): Promise<number> {
    return this.conversations
      .filter(conv => 
        (conv.participant1_id === userId || conv.participant2_id === userId) &&
        conv.unread_count > 0
      )
      .reduce((total, conv) => total + conv.unread_count, 0);
  }

  // Subscribe to new messages for a conversation
  subscribeToMessages(
    userId: string,
    conversationId: string,
    callback: (message: Message) => void
  ): () => void {
    const key = `${userId}_${conversationId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private findOrCreateConversation(
    userId1: string,
    userId2: string,
    propertyId?: string
  ): Conversation {
    let conversation = this.conversations.find(
      conv =>
        (conv.participant1_id === userId1 && conv.participant2_id === userId2) ||
        (conv.participant1_id === userId2 && conv.participant2_id === userId1)
    );

    if (!conversation) {
      conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participant1_id: userId1,
        participant2_id: userId2,
        property_id: propertyId,
        unread_count: 0,
        created_at: new Date().toISOString(),
      };
      this.conversations.push(conversation);
    }

    return conversation;
  }

  private notifyListeners(message: Message) {
    const conversation = this.conversations.find(
      conv =>
        (conv.participant1_id === message.sender_id && conv.participant2_id === message.receiver_id) ||
        (conv.participant1_id === message.receiver_id && conv.participant2_id === message.sender_id)
    );

    if (!conversation) return;

    // Notify sender
    const senderKey = `${message.sender_id}_${conversation.id}`;
    const senderCallbacks = this.listeners.get(senderKey);
    if (senderCallbacks) {
      senderCallbacks.forEach(callback => callback(message));
    }

    // Notify receiver
    const receiverKey = `${message.receiver_id}_${conversation.id}`;
    const receiverCallbacks = this.listeners.get(receiverKey);
    if (receiverCallbacks) {
      receiverCallbacks.forEach(callback => callback(message));
    }
  }
}

export const messagingService = new MessagingService();

// Utility functions
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m ago`;
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

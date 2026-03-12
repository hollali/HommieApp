import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property, Booking, Favorite, User, Subscription } from './types';

const STORAGE_KEYS = {
  USERS: '@hommie:users',
  PROPERTIES: '@hommie:properties',
  BOOKINGS: '@hommie:bookings',
  FAVORITES: '@hommie:favorites',
  TRANSACTIONS: '@hommie:transactions',
  SUBSCRIPTIONS: '@hommie:subscriptions',
  CHATS: '@hommie:chats',
  MESSAGES: '@hommie:messages',
  LISTS: '@hommie:lists',
  NOTIFICATIONS: '@hommie:notifications',
  NOTIFICATION_SETTINGS: '@hommie:notification_settings',
  REPORTS: '@hommie:reports',
  INITIALIZED: '@hommie:initialized',
};

// Initialize sample data on first launch
export async function initializeMockData(): Promise<void> {
  const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized === 'true') {
    return; // Already initialized
  }

  // Generate sample users first
  const users = generateSampleUsers();
  await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Generate sample properties
  const properties = generateSampleProperties(users);
  await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));

  // Generate sample subscriptions
  const subscriptions = generateSampleSubscriptions(users);
  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));

  // Generate sample favorites for first user
  if (users.length > 0) {
    const tenant = users.find((u) => u.role === 'tenant');
    if (tenant && properties.length > 0) {
      const favorites: Favorite[] = properties.slice(0, 3).map((p, i) => ({
        id: `fav_${Date.now()}_${i}`,
        user_id: tenant.id,
        property_id: p.id,
        created_at: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  }

  // Mark as initialized
  await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// Generate sample users
function generateSampleUsers(): User[] {
  const now = Date.now();
  return [
    {
      id: 'user_1',
      full_name: 'Kwame Asante',
      phone: '+233241234567',
      email: 'kwame@example.com',
      role: 'tenant',
      verification_status: 'unverified',
      created_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_2',
      full_name: 'Ama Osei',
      phone: '+233242345678',
      email: 'ama@example.com',
      role: 'landlord',
      verification_status: 'verified',
      subscription_plan: 'free',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_3',
      full_name: 'Kofi Mensah',
      phone: '+233243456789',
      email: 'kofi@example.com',
      role: 'agent',
      verification_status: 'verified',
      subscription_plan: 'basic',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_3b',
      full_name: 'Eunice Marfo',
      phone: '+233241119999',
      email: 'eunice@example.com',
      role: 'airbnb_host',
      verification_status: 'verified',
      host_about: 'Passionate about hosting and making every stay feel like home.',
      host_languages: 'English, Twi',
      host_response_rate: '98%',
      host_since: '2021',
      created_at: new Date(now - 50 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_4',
      full_name: 'Esi Darko',
      phone: '+233244567890',
      email: 'esi@example.com',
      role: 'landlord',
      verification_status: 'unverified',
      subscription_plan: 'free',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 25 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_5',
      full_name: 'Yaw Boateng',
      phone: '+233245678901',
      email: 'yaw@example.com',
      role: 'agent',
      verification_status: 'pending',
      subscription_plan: 'free',
      subscription_status: 'active',
      subscription_start_date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(now + 28 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_6',
      full_name: 'Abena Kumi',
      phone: '+233246789012',
      email: 'abena@example.com',
      role: 'tenant',
      verification_status: 'unverified',
      created_at: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateSampleSubscriptions(users: User[]): Subscription[] {
  return users
    .filter((user) => user.subscription_plan)
    .map((user) => {
      const start = user.subscription_start_date || new Date().toISOString();
      const end =
        user.subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      return {
        id: `sub_${user.id}`,
        user_id: user.id,
        plan: user.subscription_plan || 'free',
        status: user.subscription_status || 'active',
        start_date: start,
        end_date: end,
        amount: user.subscription_plan === 'basic' ? 100 : 0,
        created_at: start,
      };
    });
}

export async function getUsers(): Promise<User[]> {
  await initializeMockData();
  const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export async function getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
  await initializeMockData();
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
  const subscriptions = data ? (JSON.parse(data) as Subscription[]) : [];
  return subscriptions.filter((sub) => sub.user_id === userId);
}

export async function addSubscription(subscription: Subscription): Promise<void> {
  await initializeMockData();
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
  const subscriptions = data ? (JSON.parse(data) as Subscription[]) : [];
  subscriptions.unshift(subscription);
  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
}

export async function getUserById(userId: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.id === userId) || null;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const users = await getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
}

export function getListingLimitForUser(user: User | null): number {
  if (!user) return 0;
  if (user.role === 'agent' || user.role === 'landlord') {
    const plan = user.subscription_plan || 'free';
    return plan === 'basic' && user.subscription_status === 'active' ? 10 : 1;
  }
  if (user.role === 'airbnb_host') {
    return 5;
  }
  return 0;
}

// Generate comprehensive sample properties
function generateSampleProperties(users: User[]): Property[] {
  const landlords = users.filter((u) => u.role === 'landlord' || u.role === 'agent');
  const hosts = users.filter((u) => u.role === 'airbnb_host');
  const now = Date.now();
  const propertyTypes: Property['type'][] = [
    'apartment',
    'house',
    'hostel',
    'store',
    'airbnb',
    'hotel',
    'warehouse',
    'office',
    'land',
  ];

  // Realistic Ghana locations
  const locations = [
    { region: 'Greater Accra', city: 'Accra', area: 'East Legon', lat: 5.6149, lng: -0.1745 },
    { region: 'Greater Accra', city: 'Accra', area: 'Cantonments', lat: 5.5949, lng: -0.1788 },
    { region: 'Greater Accra', city: 'Accra', area: 'Labone', lat: 5.5801, lng: -0.1752 },
    { region: 'Greater Accra', city: 'Accra', area: 'Osu', lat: 5.5552, lng: -0.1737 },
    { region: 'Greater Accra', city: 'Accra', area: 'Dansoman', lat: 5.5756, lng: -0.2838 },
    { region: 'Greater Accra', city: 'Tema', area: 'Community 1', lat: 5.6518, lng: -0.0245 },
    { region: 'Greater Accra', city: 'Madina', area: 'Madina', lat: 5.6851, lng: -0.1653 },
    { region: 'Ashanti', city: 'Kumasi', area: 'Ayeduase', lat: 6.6885, lng: -1.6244 },
    { region: 'Ashanti', city: 'Kumasi', area: 'Santasi', lat: 6.6500, lng: -1.5667 },
    { region: 'Ashanti', city: 'Obuasi', area: 'Obuasi Central', lat: 6.2024, lng: -1.6796 },
    { region: 'Western', city: 'Takoradi', area: 'Sekondi-Takoradi', lat: 4.8845, lng: -1.7557 },
    { region: 'Central', city: 'Cape Coast', area: 'Cape Coast', lat: 5.1313, lng: -1.2795 },
    { region: 'Eastern', city: 'Koforidua', area: 'Koforidua', lat: 6.0833, lng: -0.2667 },
  ];

  const properties: Property[] = [];

  // Price based on type and location
  const basePrices: Record<Property['type'], { min: number; max: number }> = {
    apartment: { min: 800, max: 3000 },
    house: { min: 1500, max: 5000 },
    hostel: { min: 200, max: 800 },
    store: { min: 500, max: 2500 },
    airbnb: { min: 150, max: 500 },
    hotel: { min: 200, max: 800 },
    warehouse: { min: 1000, max: 4000 },
    office: { min: 800, max: 3000 },
    land: { min: 5000, max: 20000 },
    other: { min: 500, max: 2000 },
  };

  // Generate diverse properties
  locations.forEach((location, index) => {
    const type = propertyTypes[index % propertyTypes.length];
    const ownerPool = type === 'airbnb' && hosts.length > 0 ? hosts : landlords;
    const owner = ownerPool[index % ownerPool.length] || ownerPool[0];
    const daysAgo = Math.floor(index * 2.5); // Stagger creation dates
    const created = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const priceRange = basePrices[type];
    const price = Math.floor(Math.random() * (priceRange.max - priceRange.min) + priceRange.min);
    const paymentType: Property['payment_type'] =
      type === 'airbnb' || type === 'hotel' ? 'daily' : type === 'hostel' ? 'weekly' : 'monthly';

    // Bedrooms and bathrooms (null for commercial properties)
    const bedrooms =
      type === 'store' || type === 'warehouse' || type === 'office' || type === 'land'
        ? null
        : Math.floor(Math.random() * 4) + 1;
    const bathrooms =
      type === 'store' || type === 'warehouse' || type === 'office' || type === 'land'
        ? null
        : Math.floor(Math.random() * 3) + 1;

    // Amenities
    const allAmenities = ['WiFi', 'Water', 'Security', 'Electricity', 'Air Conditioning', 'Parking', 'Generator'];
    const amenities = allAmenities.slice(0, Math.floor(Math.random() * 4) + 3);

    // Description based on type
    const descriptions: Record<Property['type'], string> = {
      apartment: `Modern ${bedrooms} bedroom apartment in ${location.area}. Spacious living area, fully furnished with all amenities. Close to schools and shopping centers.`,
      house: `Beautiful ${bedrooms} bedroom house in ${location.area}. Well maintained, gated community, perfect for families.`,
      hostel: `Affordable hostel accommodation in ${location.area}. Safe and secure, close to university. Shared facilities available.`,
      store: `Prime retail space in ${location.area}. High foot traffic area, perfect for business. Includes storage area.`,
      airbnb: `Cozy short-term rental in ${location.area}. Fully furnished, all amenities included. Ideal for tourists and business travelers.`,
      hotel: `Comfortable hotel rooms in ${location.area}. Daily cleaning, WiFi, and breakfast included.`,
      warehouse: `Large warehouse space in ${location.area}. Ideal for storage and logistics. Secure compound.`,
      office: `Modern office space in ${location.area}. Perfect for businesses, includes meeting rooms.`,
      land: `Prime land for sale in ${location.area}. Great investment opportunity, suitable for development.`,
      other: `Property in ${location.area}. Contact for more details.`,
    };

    const isFeatured = Math.random() > 0.8;
    const featuredUntil = isFeatured
      ? new Date(now + Math.floor(Math.random() * 30 + 7) * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const property: Property = {
      id: `prop_${index + 1}_${Date.now()}`,
      owner_id: owner.id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} in ${location.area}, ${location.city}`,
      description: descriptions[type],
      type,
      price,
      payment_type: paymentType,
      region: location.region,
      city: location.city,
      area: location.area,
      latitude: location.lat + (Math.random() - 0.5) * 0.01, // Small variation
      longitude: location.lng + (Math.random() - 0.5) * 0.01,
      bedrooms,
      bathrooms,
      furnished: type !== 'land' && Math.random() > 0.3,
      parking: type !== 'land' && Math.random() > 0.3,
      amenities,
      status: 'approved',
      is_available: true,
      is_featured: isFeatured,
      featured_until: featuredUntil,
      created_at: created.toISOString(),
      owner,
    };

    properties.push(property);
  });

  // Add a few more random properties
  for (let i = locations.length; i < 20; i++) {
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const ownerPool = type === 'airbnb' && hosts.length > 0 ? hosts : landlords;
    const owner = ownerPool[Math.floor(Math.random() * ownerPool.length)] || ownerPool[0];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const daysAgo = Math.floor(Math.random() * 60);
    const created = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    const priceRange = basePrices[type];
    const price = Math.floor(Math.random() * (priceRange.max - priceRange.min) + priceRange.min);
    const paymentType: Property['payment_type'] =
      type === 'airbnb' || type === 'hotel' ? 'daily' : type === 'hostel' ? 'weekly' : 'monthly';

    const bedrooms =
      type === 'store' || type === 'warehouse' || type === 'office' || type === 'land'
        ? null
        : Math.floor(Math.random() * 4) + 1;
    const bathrooms =
      type === 'store' || type === 'warehouse' || type === 'office' || type === 'land'
        ? null
        : Math.floor(Math.random() * 3) + 1;

    const allAmenities = ['WiFi', 'Water', 'Security', 'Electricity', 'Air Conditioning', 'Parking'];
    const amenities = allAmenities.slice(0, Math.floor(Math.random() * 4) + 2);

    const isFeatured = Math.random() > 0.9;
    const featuredUntil = isFeatured
      ? new Date(now + Math.floor(Math.random() * 30 + 7) * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const property: Property = {
      id: `prop_${i + 1}_${Date.now()}`,
      owner_id: owner.id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${location.area}`,
      description: `Well maintained ${type} in ${location.area}, ${location.city}.`,
      type,
      price,
      payment_type: paymentType,
      region: location.region,
      city: location.city,
      area: location.area,
      latitude: location.lat + (Math.random() - 0.5) * 0.01,
      longitude: location.lng + (Math.random() - 0.5) * 0.01,
      bedrooms,
      bathrooms,
      furnished: type !== 'land' && Math.random() > 0.4,
      parking: type !== 'land' && Math.random() > 0.4,
      amenities,
      status: 'approved',
      is_available: true,
      is_featured: isFeatured,
      featured_until: featuredUntil,
      created_at: created.toISOString(),
      owner,
    };

    properties.push(property);
  }

  return properties;
}

// Properties
export async function saveProperty(property: Omit<Property, 'id' | 'created_at'>): Promise<Property> {
  const properties = await getProperties();
  const newProperty: Property = {
    ...property,
    id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    status: property.status || 'pending',
    is_available: property.status === 'approved',
    is_featured: property.is_featured ?? false,
    featured_until: property.featured_until ?? null,
  };
  properties.push(newProperty);
  await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  return newProperty;
}

export async function getProperties(): Promise<Property[]> {
  // Initialize data if not already done
  await initializeMockData();

  const data = await AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES);
  const properties: Property[] = data ? JSON.parse(data) : [];
  const now = Date.now();
  // Add defaults for backward compatibility
  return properties.map((p) => {
    const status = (p as any).status || 'approved';
    const featuredUntil = (p as any).featured_until || null;
    const isFeaturedActive = featuredUntil ? new Date(featuredUntil).getTime() > now : false;
    return {
    ...p,
    parking: p.parking !== undefined ? p.parking : false,
      status,
      is_available: status === 'approved',
      is_featured: isFeaturedActive,
      featured_until: featuredUntil,
    } as Property;
  });
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<void> {
  const properties = await getProperties();
  const index = properties.findIndex((p) => p.id === id);
  if (index !== -1) {
    const previous = properties[index];
    const status = updates.status ?? previous.status;
    properties[index] = {
      ...properties[index],
      ...updates,
      status,
      is_available: status === 'approved',
    };
    await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    if (updates.status && updates.status !== previous.status) {
      await addNotification({
        user_id: previous.owner_id,
        type: 'approval',
        title: `Listing ${updates.status}`,
        message: `Your listing "${previous.title}" was ${updates.status}.`,
        metadata: { property_id: previous.id, status: updates.status },
      });
    }
  }
}

export async function deleteProperty(id: string): Promise<void> {
  const properties = await getProperties();
  const filtered = properties.filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(filtered));
}

// Bookings
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
  const bookings = await getBookings();
  const newBooking: Booking = {
    ...booking,
    id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  bookings.push(newBooking);
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

  try {
    const properties = await getProperties();
    const property = properties.find((p) => p.id === booking.property_id);
    if (property) {
      await addNotification({
        user_id: property.owner_id,
        type: 'booking',
        title: 'New booking request',
        message: `New booking request for "${property.title}".`,
        metadata: { property_id: property.id, booking_id: newBooking.id },
      });
      await addNotification({
        user_id: booking.tenant_id,
        type: 'booking',
        title: 'Booking requested',
        message: `Your booking request for "${property.title}" was submitted.`,
        metadata: { property_id: property.id, booking_id: newBooking.id },
      });
    }
  } catch {
    // Ignore notification errors
  }

  return newBooking;
}

export async function getBookings(userId?: string): Promise<Booking[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
  const bookings = data ? JSON.parse(data) : [];
  return userId ? bookings.filter((b: Booking) => b.tenant_id === userId) : bookings;
}

// Favorites
export async function addFavorite(userId: string, propertyId: string): Promise<Favorite> {
  const favorites = await getFavorites(userId);
  if (favorites.find((f) => f.property_id === propertyId)) {
    throw new Error('Already in favorites');
  }
  const newFavorite: Favorite = {
    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    property_id: propertyId,
    created_at: new Date().toISOString(),
  };
  favorites.push(newFavorite);
  await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  return newFavorite;
}

// Transactions
export async function getTransactions(userId?: string): Promise<any[]> {
  await initializeMockData();
  const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const transactions = data ? JSON.parse(data) : [];
  return userId ? transactions.filter((t: any) => t.user_id === userId) : transactions;
}

export async function addTransaction(transaction: any): Promise<void> {
  const transactions = await getTransactions();
  transactions.push(transaction);
  await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export async function removeFavorite(userId: string, propertyId: string): Promise<void> {
  const favorites = await getFavorites(userId);
  const filtered = favorites.filter((f) => f.property_id !== propertyId);
  await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
}

export async function getFavorites(userId: string): Promise<Favorite[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
  const allFavorites = data ? JSON.parse(data) : [];
  return allFavorites.filter((f: Favorite) => f.user_id === userId);
}

export async function isFavorite(userId: string, propertyId: string): Promise<boolean> {
  const favorites = await getFavorites(userId);
  return favorites.some((f) => f.property_id === propertyId);
}

// Chats/Messages
export interface Chat {
  id: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  text: string;
  created_at: string;
  read_at?: string | null;
  image_url?: string | null;
}

export async function getOrCreateChat(tenantId: string, ownerId: string, propertyId: string): Promise<Chat> {
  const chats = await getChats(tenantId);
  let chat = chats.find((c) => c.owner_id === ownerId && c.property_id === propertyId);
  
  if (!chat) {
    chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      property_id: propertyId,
      tenant_id: tenantId,
      owner_id: ownerId,
      unread_count: 0,
      created_at: new Date().toISOString(),
    };
    chats.push(chat);
    await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }
  
  return chat;
}

export async function getChats(userId: string): Promise<Chat[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
  const allChats = data ? JSON.parse(data) : [];
  return allChats.filter((c: Chat) => c.tenant_id === userId || c.owner_id === userId);
}

export async function sendMessage(message: Omit<Message, 'id' | 'created_at' | 'read_at'>): Promise<Message> {
  // Get all messages from storage first
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
  const allMessages = data ? JSON.parse(data) : [];
  
  const newMessage: Message = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    read_at: null,
  };
  allMessages.push(newMessage);
  
  // Update chat last message
  const chats = await getChats(message.sender_id);
  const chat = chats.find((c) => c.id === message.chat_id);
  if (chat) {
    chat.last_message = message.text;
    chat.last_message_time = newMessage.created_at;
    if (chat.tenant_id !== message.sender_id) {
      chat.unread_count = (chat.unread_count || 0) + 1;
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }
  
  await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));

  await addNotification({
    user_id: message.receiver_id,
    type: 'message',
    title: 'New message',
    message: message.text,
    metadata: { chat_id: message.chat_id, property_id: message.property_id },
  });

  return newMessage;
}

export async function markMessagesAsRead(messageIds: string[]): Promise<void> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
  if (!data) return;
  
  const allMessages: Message[] = JSON.parse(data);
  const now = new Date().toISOString();
  
  const updatedMessages = allMessages.map((msg) => {
    if (messageIds.includes(msg.id) && !msg.read_at) {
      return { ...msg, read_at: now };
    }
    return msg;
  });
  
  await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));
}

// Notifications
export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'message' | 'approval' | 'general';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  metadata?: Record<string, any>;
}

export async function addNotification(input: Omit<NotificationItem, 'id' | 'created_at' | 'read'>) {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all = data ? JSON.parse(data) : [];
  const newItem: NotificationItem = {
    ...input,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    read: false,
  };
  all.unshift(newItem);
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
  return newItem;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all = data ? JSON.parse(data) : [];
  return all.filter((n: NotificationItem) => n.user_id === userId);
}

export async function markAllNotificationsRead(userId: string) {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all = data ? JSON.parse(data) : [];
  const updated = all.map((n: NotificationItem) =>
    n.user_id === userId ? { ...n, read: true } : n
  );
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
}

export async function clearNotifications(userId: string) {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const all = data ? JSON.parse(data) : [];
  const updated = all.filter((n: NotificationItem) => n.user_id !== userId);
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
}

export async function setNotificationPreference(enabled: boolean) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.NOTIFICATION_SETTINGS,
    JSON.stringify({ enabled })
  );
}

export async function getNotificationPreference(): Promise<boolean> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
  if (!data) return true;
  try {
    const parsed = JSON.parse(data);
    return parsed.enabled !== false;
  } catch {
    return true;
  }
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
  const allMessages = data ? JSON.parse(data) : [];
  return allMessages
    .filter((m: Message) => m.chat_id === chatId)
    .sort((a: Message, b: Message) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

// Property Lists
export interface PropertyList {
  id: string;
  user_id: string;
  name: string;
  property_ids: string[];
  created_at: string;
}

export async function createList(userId: string, name: string): Promise<PropertyList> {
  const lists = await getLists(userId);
  const newList: PropertyList = {
    id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    name,
    property_ids: [],
    created_at: new Date().toISOString(),
  };
  lists.push(newList);
  await AsyncStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  return newList;
}

export async function getLists(userId: string): Promise<PropertyList[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LISTS);
  const allLists = data ? JSON.parse(data) : [];
  return allLists.filter((l: PropertyList) => l.user_id === userId);
}

export async function getList(id: string): Promise<PropertyList | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LISTS);
  const allLists = data ? JSON.parse(data) : [];
  return allLists.find((l: PropertyList) => l.id === id) || null;
}

export async function addPropertyToList(listId: string, propertyId: string): Promise<void> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LISTS);
  const lists = data ? JSON.parse(data) : [];
  const list = lists.find((l: PropertyList) => l.id === listId);
  if (list && !list.property_ids.includes(propertyId)) {
    list.property_ids.push(propertyId);
    await AsyncStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  }
}

// Reports
export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'property' | 'user';
  target_id: string;
  reason: 'scam' | 'incorrect_info' | 'inappropriate_content' | 'spam' | 'other';
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export async function addReport(input: Omit<Report, 'id' | 'created_at' | 'resolved_at' | 'resolved_by' | 'admin_notes'>): Promise<Report> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
  const allReports = data ? JSON.parse(data) : [];
  const newReport: Report = {
    ...input,
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolved_by: null,
    admin_notes: null,
  };
  allReports.unshift(newReport);
  await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(allReports));
  return newReport;
}

export async function getReports(): Promise<Report[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
  return data ? JSON.parse(data) : [];
}

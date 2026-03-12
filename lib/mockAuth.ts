import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { User } from './types';

const MOCK_AUTH_KEY = 'hommie_mock_session';
const MOCK_PROFILE_KEY = 'hommie_mock_profile';

function buildMockSession(email: string): Session {
  const now = Math.floor(Date.now() / 1000);
  const userId = 'mock-user-id';

  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 60 * 60,
    expires_at: now + 60 * 60,
    refresh_token: 'mock-refresh-token',
    user: {
      id: userId,
      app_metadata: { provider: 'mock', providers: ['mock'] },
      user_metadata: { full_name: email.split('@')[0] || 'Hommie User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
      role: 'authenticated',
    },
  };
}

export function buildMockUser(email: string): User {
  return {
    id: 'mock-user-id',
    full_name: email.split('@')[0] || 'Hommie User',
    phone: null,
    email,
    role: 'tenant',
    created_at: new Date().toISOString(),
  };
}

export async function setMockProfile(profile: Partial<User>) {
  await AsyncStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
}

export async function getMockProfile() {
  const raw = await AsyncStorage.getItem(MOCK_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<User>;
  } catch {
    return null;
  }
}

export async function clearMockProfile() {
  await AsyncStorage.removeItem(MOCK_PROFILE_KEY);
}

export async function setMockSession(email: string) {
  const session = buildMockSession(email);
  await AsyncStorage.setItem(MOCK_AUTH_KEY, JSON.stringify({ session, email }));
}

export async function getMockSession() {
  const raw = await AsyncStorage.getItem(MOCK_AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { session: Session; email: string };
    return parsed;
  } catch {
    return null;
  }
}

export async function clearMockSession() {
  await AsyncStorage.removeItem(MOCK_AUTH_KEY);
}

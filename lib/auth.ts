import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { Platform } from 'react-native';

// Complete web browser auth sessions
WebBrowser.maybeCompleteAuthSession();

// Get Supabase URL for redirect
/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    // For production, you'll need to configure OAuth in Supabase Dashboard
    // and use the proper redirect URLs
    
    if (Platform.OS === 'web') {
      // Web OAuth flow
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      return data;
    } else {
      // Mobile OAuth flow using deep linking
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            scheme: 'hommie',
            path: 'auth',
          }),
        },
      });

      if (error) throw error;

      // On mobile, Supabase will open a browser, then redirect back
      // The auth state will be handled automatically by Supabase
      return data;
    }
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Sign in with Apple OAuth
 * Note: Apple Sign In requires additional setup for iOS
 */
export async function signInWithApple() {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'web') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Platform.OS === 'web' 
            ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '')
            : AuthSession.makeRedirectUri({
                scheme: 'hommie',
                path: 'auth',
              }),
        },
      });

      if (error) throw error;
      return data;
    } else {
      throw new Error('Apple Sign In is only available on iOS and Web');
    }
  } catch (error: any) {
    console.error('Apple sign in error:', error);
    throw error;
  }
}

/**
 * Sign in with Facebook OAuth
 */
export async function signInWithFacebook() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: Platform.OS === 'web'
          ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '')
          : AuthSession.makeRedirectUri({
              scheme: 'hommie',
              path: 'auth',
            }),
      },
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Facebook sign in error:', error);
    throw error;
  }
}

/**
 * Handle OAuth callback after redirect
 * This should be called from your auth callback route
 */
export async function handleOAuthCallback(url: string) {
  try {
    // Extract the hash fragment from the URL
    const hashParams = new URLSearchParams(url.split('#')[1]);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Set the session
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;
      return data;
    }

    throw new Error('Missing tokens in callback URL');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    throw error;
  }
}

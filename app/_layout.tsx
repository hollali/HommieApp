import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/clerk";
import { notificationService } from "../lib/notifications";
import { initializeMockData } from "../lib/mockData";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayoutNav() {
  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    // Initialize mock data on app start
    initializeMockData().catch(console.error);
  }, []);

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize().then((success) => {
      if (success) {
        console.log("Notifications initialized successfully");
      } else {
        console.warn("Failed to initialize notifications");
      }
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AppContent />
    </ClerkProvider>
  );
}

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    // Register push token when user is available
    if (user?.id) {
      notificationService.registerPushToken(user.id).then((success) => {
        if (success) {
          console.log("Push token registered for user:", user.id);
        }
      });
    }
  }, [user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            {/* Other screens... */}
            <Stack.Screen name="property/[id]" />
            <Stack.Screen name="property/[id]/add-to-list" />
            <Stack.Screen name="property/[id]/report" />
            <Stack.Screen name="booking/[id]" />
            <Stack.Screen name="booking/[id]/payment-options" />
            <Stack.Screen name="message/[propertyId]" />
            <Stack.Screen name="message/success" />
            <Stack.Screen name="booking/success" />
            <Stack.Screen name="payment-callback" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="settings/biometrics" />
            <Stack.Screen name="settings/notifications" />
            <Stack.Screen name="support" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="lists" />
            <Stack.Screen name="lists/[id]" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="payments" />
            <Stack.Screen name="payments/saved-methods" />
            <Stack.Screen name="payments/mobile-money" />
            <Stack.Screen name="payments/card" />
            <Stack.Screen name="payments/bank-transfer" />
            <Stack.Screen name="verification" />
            <Stack.Screen name="switch-role" />
            <Stack.Screen name="bookings" />
            <Stack.Screen name="property/[id]/edit" />
            <Stack.Screen name="property/create/step1" />
            <Stack.Screen name="property/create/step2" />
            <Stack.Screen name="search/map" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

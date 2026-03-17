import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function OAuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/(tabs)/home");
    } else {
      // Small delay to ensure Clerk has processed the session
      const timeout = setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isSignedIn, isLoaded]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Completing authentication...</Text>
    </View>
  );
}

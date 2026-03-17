import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="what-looking-for" />
      <Stack.Screen name="where-looking" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="oauth" />
      <Stack.Screen name="phone-otp" />
      <Stack.Screen name="price-range" />
      <Stack.Screen name="location-search" />
      <Stack.Screen name="notifications-permission" />
      <Stack.Screen name="role-selection" />
    </Stack>
  );
}


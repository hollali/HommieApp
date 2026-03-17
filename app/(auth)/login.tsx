import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSignIn, useOAuth, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as LocalAuthentication from "expo-local-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { startOAuthFlow: googleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: facebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/(tabs)/home");
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
  }, []);

  const handleLogin = async () => {
    if (!isLoaded) return;
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        console.warn("Incomplete sign in status:", result.status);
        Alert.alert(
          "Login",
          "Please complete the login process or check your email.",
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle specific error cases
      if (error.errors?.[0]?.code === "session_exists") {
        Alert.alert(
          "Already Signed In",
          "You are already signed in. Please sign out first to use a different account.",
          [
            {
              text: "Go to Home",
              onPress: () => router.replace("/(tabs)/home"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
      } else {
        Alert.alert(
          "Login Error",
          error.errors?.[0]?.message || error.message || "Failed to login",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onSocialAuth = async (provider: "google" | "facebook" | "apple") => {
    // Check if already signed in
    if (isSignedIn) {
      Alert.alert(
        "Already Signed In",
        "You are already signed in. Please sign out first to use a different account.",
        [
          {
            text: "Go to Home",
            onPress: () => router.replace("/(tabs)/home"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );
      return;
    }

    setLoading(true);

    try {
      const startOAuthFlow =
        provider === "google"
          ? googleOAuth
          : provider === "facebook"
            ? facebookOAuth
            : appleOAuth;

      // Create a dedicated OAuth callback URL
      const redirectUrl = Linking.createURL("/oauth", {
        scheme: "hommie",
      });

      console.log(`Starting ${provider} OAuth with redirect:`, redirectUrl);

      const {
        createdSessionId,
        setActive: setActiveSession,
        signIn: oauthSignIn,
      } = await startOAuthFlow({
        redirectUrl,
      });

      console.log("OAuth Result:", {
        createdSessionId: !!createdSessionId,
        signInStatus: oauthSignIn?.status,
      });

      if (createdSessionId) {
        if (setActiveSession) {
          await setActiveSession({ session: createdSessionId });
        }
        router.replace("/(tabs)/home");
      } else if (oauthSignIn) {
        // Handle sign-in specific logic if needed
        if (oauthSignIn.status === "complete") {
          router.replace("/(tabs)/home");
        } else if (
          oauthSignIn.status === "needs_identifier" ||
          oauthSignIn.status === "needs_first_factor" ||
          oauthSignIn.status === "needs_second_factor"
        ) {
          // Handle cases where additional verification is needed
          Alert.alert(
            "Additional Verification Required",
            "Please check your email for verification instructions.",
          );
        }
      } else {
        console.log("No session created, OAuth flow incomplete");
        Alert.alert("Info", "Please complete the authentication process");
      }
    } catch (err: any) {
      console.error(`${provider} OAuth Error:`, err);

      // Handle specific error cases
      if (err.message?.includes("cancelled")) {
        // User cancelled the flow, do nothing
        console.log("User cancelled OAuth");
      } else if (
        err.errors?.[0]?.code === "session_exists" ||
        err.message?.includes("session already exists")
      ) {
        Alert.alert(
          "Session Already Exists",
          "You already have an active session.",
          [
            {
              text: "Go to Home",
              onPress: () => router.replace("/(tabs)/home"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
      } else {
        Alert.alert(
          "Authentication Failed",
          err.errors?.[0]?.message ||
            err.message ||
            `${provider} authentication failed. Please try again.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceIdLogin = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Face ID is only available on iOS devices.");
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert("Face ID", "Face ID is not set up on this device.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login with Face ID",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
      });

      if (!result.success) {
        return;
      }

      // Here you would typically retrieve stored credentials
      // For now, show a message
      Alert.alert(
        "Face ID Authenticated",
        "Please enter your email and password to complete login.",
        [{ text: "OK" }],
      );
    } catch (error: any) {
      Alert.alert(
        "Face ID Error",
        error.message || "Face ID failed. Please try again.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Log In to your account to explore your dream home.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#CCCCCC"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#CCCCCC"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Signing in..." : "Log in"}
            </Text>
          </TouchableOpacity>

          {/* Face ID Button */}
          <TouchableOpacity
            style={styles.faceIdButton}
            onPress={handleFaceIdLogin}
            disabled={loading}
          >
            <Ionicons name="scan-outline" size={22} color="#4560F7" />
            <Text style={styles.faceIdText}>Use Face ID</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => onSocialAuth("apple")}
              disabled={loading}
            >
              <Ionicons name="logo-apple" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => onSocialAuth("google")}
              disabled={loading}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path
                  fill="#EA4335"
                  d="M24 12.2727c0-.8182-.0909-1.6364-.2727-2.4545H12v4.6364h6.7273c-.2727 1.4545-1.0909 2.7273-2.3636 3.5455v2.9091h3.8182C22.0909 20.0909 24 16.6364 24 12.2727z"
                />
                <Path
                  fill="#34A853"
                  d="M12 24c3.2727 0 6-1.0909 8-2.9091l-3.8182-2.9091c-1.0909.7273-2.4545 1.1818-4.1818 1.1818-3.1818 0-5.9091-2.1818-6.9091-5.1818H1.1818v3.0909C3.1818 21.8182 7.2727 24 12 24z"
                />
                <Path
                  fill="#4285F4"
                  d="M5.0909 14.1818C4.8182 13.4545 4.6364 12.7273 4.6364 12s.1818-1.4545.3636-2.1818V6.7273H1.1818C.4545 8.1818 0 10 0 12s.4545 3.8182 1.1818 5.2727l3.9091-3.0909z"
                />
                <Path
                  fill="#FBBC05"
                  d="M12 4.6364c1.7727 0 3.3636.6364 4.6364 1.8182l3.4545-3.4545C18 1.1818 15.2727 0 12 0 7.2727 0 3.1818 2.1818 1.1818 6.7273l3.9091 3.0909C6.0909 6.8182 8.8182 4.6364 12 4.6364z"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => onSocialAuth("facebook")}
              disabled={loading}
            >
              <Ionicons name="logo-facebook" size={28} color="#1877F2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Haven't an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#CCCCCC",
  },
  loginButton: {
    backgroundColor: "#4560F7",
    borderRadius: 30,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  faceIdButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#4560F7",
    backgroundColor: "#FFF",
    marginBottom: 16,
    gap: 8,
  },
  faceIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4560F7",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    fontSize: 14,
    color: "#CCCCCC",
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#999",
  },
  footerLink: {
    fontSize: 14,
    color: "#4560F7",
    fontWeight: "600",
  },
});

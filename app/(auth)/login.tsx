import { useCallback, useEffect, useRef, useState } from "react";
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
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

interface ClerkError {
  errors?: { code?: string; message?: string }[];
  message?: string;
  code?: string;
}

const BIOMETRIC_EMAIL_KEY = "auth_email";
const BIOMETRIC_PASSWORD_KEY = "auth_password";

const useWarmUpBrowser = () => {
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
  const isMountedRef = useRef(true);
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/(tabs)/home");
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isValidEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const isCancelledAuthError = (error: ClerkError) =>
    error.code === "CANCELLED" || error.message?.toLowerCase().includes("cancelled");

  const handleAuthError = useCallback(
    (error: ClerkError, context = "Authentication") => {
      if (isCancelledAuthError(error)) {
        console.log("User cancelled auth flow");
        return;
      }

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
        return;
      }

      Alert.alert(
        `${context} Failed`,
        error.errors?.[0]?.message || error.message || `${context} failed. Please try again.`,
      );
    },
    [router],
  );

  const askToSaveCredentials = async () =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        "Enable Biometric Login?",
        "Save your credentials securely for biometric login on this device.",
        [
          { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
          { text: "Enable", onPress: () => resolve(true) },
        ],
      );
    });

  const saveCredentialsForBiometric = async (
    emailValue: string,
    passwordValue: string,
  ) => {
    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, emailValue.trim());
    await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, passwordValue);
  };

  const attemptCredentialLogin = async (
    emailValue: string,
    passwordValue: string,
    options?: { promptToSaveCredentials?: boolean },
  ) => {
    if (!isLoaded || loading) return;

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: emailValue.trim(),
        password: passwordValue,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        if (options?.promptToSaveCredentials) {
          const shouldSave = await askToSaveCredentials();
          if (shouldSave) {
            await saveCredentialsForBiometric(emailValue, passwordValue);
          }
        }

        if (isMountedRef.current) {
          router.replace("/(tabs)/home");
        }
      } else {
        console.warn("Incomplete sign in status:", result.status);
        Alert.alert(
          "Login",
          "Please complete the login process or check your email.",
        );
      }
    } catch (error: unknown) {
      handleAuthError(error as ClerkError, "Login");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    if (!isLoaded || loading) return;
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    await attemptCredentialLogin(email, password, {
      promptToSaveCredentials: true,
    });
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
      const redirectUrl = Linking.createURL("/oauth");

      console.log(`Starting ${provider} OAuth with redirect:`, redirectUrl);

      const {
        createdSessionId,
        setActive: setActiveSession,
        signIn: oauthSignIn,
        signUp: oauthSignUp,
      } = await startOAuthFlow({
        redirectUrl,
      });

      console.log("OAuth Result:", {
        createdSessionId: !!createdSessionId,
        signInStatus: oauthSignIn?.status,
        signUpStatus: oauthSignUp?.status,
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
          // Account may not exist yet, direct user to sign-up flow.
          Alert.alert(
            "Account Setup Required",
            "We couldn't complete sign in. Please continue with Sign Up to finish creating your account.",
            [
              {
                text: "Go to Sign Up",
                onPress: () => router.push("/(auth)/signup"),
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ],
          );
        }
      } else if (oauthSignUp) {
        // OAuth can initialize as sign-up if no existing account is found.
        Alert.alert(
          "No Account Found",
          "This Google account isn't linked yet. Please sign up to continue.",
          [
            {
              text: "Go to Sign Up",
              onPress: () => router.push("/(auth)/signup"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
      } else {
        console.log("No session created, OAuth flow incomplete");
        Alert.alert("Info", "Please complete the authentication process");
      }
    } catch (err: unknown) {
      console.error(`${provider} OAuth Error:`, err);
      handleAuthError(err as ClerkError, `${provider} authentication`);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometric Login",
          "Biometric authentication is not set up on this device.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return;
      }

      const storedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const storedPassword = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);

      if (!storedEmail || !storedPassword) {
        Alert.alert(
          "No Stored Credentials",
          "Please log in with email and password first and enable biometric login.",
        );
        return;
      }

      await attemptCredentialLogin(storedEmail, storedPassword);
    } catch (error: unknown) {
      const err = error as ClerkError;
      Alert.alert(
        "Biometric Login Error",
        err.message || "Biometric authentication failed. Please try again.",
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
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/onboarding");
            }
          }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          accessibilityHint="Returns to the previous screen"
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
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              accessibilityRole="button"
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
            accessibilityLabel="Log in"
            accessibilityRole="button"
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Signing in..." : "Log in"}
            </Text>
          </TouchableOpacity>

          {/* Face ID Button */}
          <TouchableOpacity
            style={styles.faceIdButton}
            onPress={handleBiometricLogin}
            disabled={loading}
            accessibilityLabel="Use biometric login"
            accessibilityRole="button"
          >
            <Ionicons name="scan-outline" size={22} color="#4560F7" />
            <Text style={styles.faceIdText}>Use Biometric Login</Text>
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

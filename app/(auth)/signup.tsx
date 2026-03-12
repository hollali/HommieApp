import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSignUp, useOAuth, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
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

export default function SignupScreen() {
  useWarmUpBrowser();

  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();

  // Initialize OAuth hooks
  const { startOAuthFlow: googleOAuth } = useOAuth({
    strategy: "oauth_google",
  });

  const { startOAuthFlow: facebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });

  const { startOAuthFlow: appleOAuth } = useOAuth({
    strategy: "oauth_apple",
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!isLoaded) return;
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!agreedToTerms) {
      Alert.alert("Error", "Please agree to the Terms & Conditions");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ").slice(1).join(" ") || " ",
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      router.push({
        pathname: "/email-verification",
        params: { email: email.trim(), signup: "true" },
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert(
        "Signup Error",
        error.errors?.[0]?.message ||
          error.message ||
          "Failed to create account",
      );
    } finally {
      setLoading(false);
    }
  };

  const onSocialAuth = async (provider: "google" | "facebook" | "apple") => {
    // Remove this check
    // if (!agreedToTerms) {
    //   Alert.alert("Error", "Please agree to the Terms & Conditions");
    //   return;
    // }

    setLoading(true);

    try {
      // Select the appropriate OAuth flow
      const selectedOAuth =
        provider === "google"
          ? googleOAuth
          : provider === "facebook"
            ? facebookOAuth
            : appleOAuth;

      // Create redirect URL with proper scheme
      const redirectUrl = Linking.createURL("/oauth", {
        scheme: "hommie",
      });

      console.log(`Starting ${provider} OAuth with redirect:`, redirectUrl);

      // Start the OAuth flow
      const oauthResult = await selectedOAuth({
        redirectUrl,
      });

      console.log("OAuth Result:", JSON.stringify(oauthResult, null, 2));

      const {
        createdSessionId,
        setActive: setActiveSession,
        signUp: oauthSignUp,
      } = oauthResult;

      if (createdSessionId) {
        // Successfully signed in
        if (setActiveSession) {
          await setActiveSession({ session: createdSessionId });
        }

        // Check if session is active
        const token = await getToken();
        if (token) {
          console.log("Session created successfully");
          router.replace("/(tabs)/home)");
        } else {
          console.log("Session created but no token yet");
          router.replace("/(auth)/login)"); // Fallback to login if session isn't active yet
        }
      } else if (oauthSignUp) {
        // Handle sign-up specific logic
        console.log("OAuth SignUp status:", oauthSignUp.status);

        if (oauthSignUp.status === "missing_requirements") {
          // Email verification might be needed
          if (oauthSignUp.emailAddress) {
            router.push({
              pathname: "/email-verification",
              params: { email: oauthSignUp.emailAddress, signup: "true" },
            });
          } else {
            router.push("/(tabs)/home)"); // Fallback route after sign-up
          }
        } else {
          router.replace("/(tabs)/home)"); // Fallback route after sign-up
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              create your account to explore your dream home.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#CCCCCC"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

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
                autoComplete="email"
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
                autoComplete="password"
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

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxChecked,
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <Text style={styles.termsText}>
                Agree with{" "}
                <Text style={styles.termsLink}>Terms & Condition</Text>
              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? "Creating account..." : "Sign up"}
              </Text>
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
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFF",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4560F7",
    borderColor: "#4560F7",
  },
  termsText: {
    fontSize: 14,
    color: "#999",
  },
  termsLink: {
    color: "#4560F7",
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: "#4560F7",
    borderRadius: 30,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
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

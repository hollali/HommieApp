import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { VerificationBadge } from "../../components/VerificationBadge";
import { useEffect, useState } from "react";

// Define the User type
interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  role?: "tenant" | "airbnb_host" | "super_admin";
  verification_status?: "verified" | "unverified" | "pending";
}

export default function ProfileScreen() {
  const { signOut, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser(); // Get user data from Clerk
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch or combine user data
  useEffect(() => {
    if (clerkUser) {
      // Combine Clerk user data with your custom user data
      setUser({
        id: clerkUser.id,
        full_name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          clerkUser.username ||
          "User",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        avatar_url: clerkUser.imageUrl,
        // These would come from your backend/database
        role: "tenant", // Default role, fetch from your backend
        verification_status: "unverified", // Default status, fetch from your backend
        phone: "", // Fetch from your backend
      });

      // Optionally fetch additional user data from your backend
      // Commented out to prevent network error when backend is not configured
      // fetchUserData(clerkUser.id);
    }
  }, [clerkUser]);

  // Keep the function for future use when backend is ready
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch your custom user data from your backend
      const response = await fetch(`YOUR_API_URL/users/${userId}`);
      const data = await response.json();

      // Update user state with backend data
      setUser((prev) =>
        prev
          ? {
              ...prev,
              role: data.role || prev.role,
              verification_status:
                data.verification_status || prev.verification_status,
              phone: data.phone || prev.phone,
            }
          : null,
      );
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return "Tenant";
    if (role === "airbnb_host") return "Airbnb Host";
    if (role === "super_admin") return "Super Admin";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
            router.replace("/(auth)/login");
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to sign out");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // If not signed in, redirect to login
  useEffect(() => {
    if (!isSignedIn && !loading) {
      router.replace("/(auth)/login");
    }
  }, [isSignedIn]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={48} color="#4560F7" />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user?.full_name || "User"}</Text>
            <View style={styles.roleRow}>
              <Text style={styles.role}>{formatRole(user?.role)}</Text>
              <VerificationBadge
                status={user?.verification_status || "unverified"}
                size="small"
                showText={false}
              />
            </View>
            {user?.email && <Text style={styles.email}>{user.email}</Text>}
          </View>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
        </View>

        <View style={styles.menuSection}>
          <MenuButton
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push("/profile/edit")}
          />
          <MenuButton
            icon="calendar-outline"
            title="My Bookings"
            onPress={() => router.push("/bookings")}
          />
          <MenuButton
            icon="heart-outline"
            title="Favorites"
            onPress={() => router.push("/(tabs)/favorites")}
          />
          <MenuButton
            icon="chatbubbles-outline"
            title="Chats"
            onPress={() => router.push("/(tabs)/chats")}
          />
          <MenuButton
            icon="settings-outline"
            title="Settings"
            onPress={() => router.push("/settings")}
          />
          <MenuButton
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => router.push("/support")}
          />
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, loading && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.signOutText}>
            {loading ? "Signing out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuButton({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuButtonLeft}>
        <Ionicons name={icon as any} size={24} color="#000" />
        <Text style={styles.menuButtonText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#4560F7",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  role: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textTransform: "capitalize",
  },
  phone: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  menuSection: {
    paddingVertical: 16,
  },
  menuButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuButtonText: {
    fontSize: 16,
    color: "#000",
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    backgroundColor: "#FF3B30",
    borderRadius: 30,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

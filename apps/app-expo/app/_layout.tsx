import { Stack } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { useAuth } from "../lib/auth/useAuth";
import LoginScreen from "./login";

function RootLayoutContent() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Stack />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

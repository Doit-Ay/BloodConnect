import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
// **Ensure Import Path is Correct:**
import { AuthProvider, useAuth } from '../src/AuthContext'; // Path assuming context is in src/

/**
 * This component decides which navigator stack to show based on authentication state.
 */
function LayoutDecider() {
  const { userId, isLoading } = useAuth();

  useEffect(() => {
    console.log(`[LayoutDecider] Auth State Update - isLoading: ${isLoading}, userId: ${userId}`);
  }, [isLoading, userId]);

  if (isLoading) {
    console.log("[LayoutDecider] Showing loading indicator.");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D62828" />
      </View>
    );
  }

  // Render the Stack navigator. The screens inside will be conditional.
  // This relies on Expo Router correctly switching stacks based on available screens.
  return (
    // Removed the key prop
    <Stack screenOptions={{ headerShown: false }}>
      {userId ? (
        // --- Screens available when Logged IN ---
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </>
      ) : (
        // --- Screens available when Logged OUT ---
        <>
          {/* Make sure 'Login' matches your app/Login.tsx filename */}
          <Stack.Screen
            name="Login"
            options={{
              title: "Login",
              headerShown: true // Show header for login screen
            }}
          />
          {/* Add Signup screen if applicable */}
          {/* <Stack.Screen name="Signup" options={{ title: "Sign Up" }} /> */}
          {/* +not-found might not be needed when logged out */}
        </>
      )}
    </Stack>
  );
}

/**
 * This is the main RootLayout component exported by default.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <LayoutDecider />
    </AuthProvider>
  );
}

// Basic styles for the loading container
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Or your app's background color
  },
});

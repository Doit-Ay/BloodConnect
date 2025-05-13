// app/Login.tsx (Improved Error Handling & Password Visibility)
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/AuthContext'; // Assuming AuthContext is in src/
import { MaterialIcons } from '@expo/vector-icons'; // Import icons

const API_URL = "add yours url or local address"; // TODO: Change for production/deployment

export default function Login() {
  const router = useRouter();
  const { setUserId } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null); // State for login error message
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility

  const handleLogin = async () => {
    setLoginError(null); // Clear previous errors
    if (!email.trim() || !password) {
      setLoginError('Please enter both email and password.'); // Show error in UI
      return;
    }

    setIsLoading(true);
    console.log("Attempting login for:", email.trim().toLowerCase());
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.error || data.message || `Login failed. Please check credentials.`;
        throw new Error(errorDetail); // Throw error to be caught below
      }

      const userId = data.userId || data.id;
      if (!userId) {
         throw new Error("Login successful, but user ID not returned by server.");
      }

      console.log("Login successful. User ID:", userId);
      await setUserId(userId);
      console.log("setUserId called.");
      router.replace('/(tabs)'); // Explicit navigation
      console.log("Explicit navigation to '/(tabs)' triggered.");

    } catch (error: any) {
      console.error("Login Error:", error);
      setLoginError(error.message); // Set the error state to display in UI
      // Removed Alert.alert here
    } finally {
      setIsLoading(false);
      console.log("handleLogin: setIsLoading(false) called.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
    {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0077B6" />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.box}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to your account.</Text>

          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, isLoading && styles.disabledInput]}
            value={email}
            onChangeText={(text) => { setEmail(text); setLoginError(null); }} // Clear error on change
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            editable={!isLoading}
          />

          {/* Password Input with Visibility Toggle */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, isLoading && styles.disabledInput]} // Adjusted style
              value={password}
              onChangeText={(text) => { setPassword(text); setLoginError(null); }} // Clear error on change
              placeholder="Enter your password"
              secureTextEntry={!isPasswordVisible} // Toggle based on state
              textContentType="password"
              autoComplete="password"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              disabled={isLoading}
            >
              <MaterialIcons
                name={isPasswordVisible ? 'visibility-off' : 'visibility'}
                size={24}
                color="#6C757D"
              />
            </TouchableOpacity>
          </View>

          {/* Display Login Error Message */}
          {loginError && (
            <Text style={styles.errorText}>{loginError}</Text>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          {/* Link to Signup */}
          <TouchableOpacity onPress={() => router.replace("/Signup")} disabled={isLoading}>
            <Text style={[styles.toggleText, isLoading && styles.disabledText]}>
              Don't have an account? Sign Up Here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9ECEF",
  },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, },
      android: { elevation: 6, },
      default: { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)', }
    }),
    marginVertical: 20,
  },
  title: {
    fontSize: 28, fontWeight: "bold", color: "#003049", marginBottom: 8, textAlign: "center",
  },
  subtitle: {
    fontSize: 16, color: "#6C757D", marginBottom: 20, textAlign: "center",
  },
  label: {
    fontSize: 15, marginTop: 15, marginBottom: 5, color: "#343A40", fontWeight: "600",
  },
  input: {
    borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8,
    paddingVertical: Platform.OS === "ios" ? 12 : 10, paddingHorizontal: 12,
    backgroundColor: "#F8F9FA", fontSize: 16, color: "#495057",
  },
  passwordContainer: { // Container to hold input and icon
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  passwordInput: { // Input field adjustments
    flex: 1, // Take up available space
    borderWidth: 0, // Remove individual border
    paddingRight: 40, // Add padding to prevent text overlap with icon
  },
  eyeIcon: { // Icon positioning
    position: 'absolute',
    right: 0,
    padding: 10, // Make touch target larger
  },
   disabledInput: {
     backgroundColor: '#E9ECEF',
     borderColor: '#DEE2E6',
   },
   errorText: { // Style for the login error message
       color: '#DC3545', // Red color
       textAlign: 'center',
       marginTop: 15, // Space above the error message
       marginBottom: 5, // Space below the error message
       fontSize: 14,
       fontWeight: '500',
   },
  button: {
    backgroundColor: "#0077B6", padding: 14, borderRadius: 8,
    alignItems: "center", marginTop: 25, justifyContent: 'center',
    minHeight: 50, opacity: 1,
  },
  buttonText: {
    color: "#fff", fontWeight: "bold", fontSize: 18,
  },
   disabledButton: {
     opacity: 0.6,
   },
  toggleText: {
    color: "#0077B6", marginTop: 20, textAlign: "center",
    fontSize: 15, textDecorationLine: 'underline', opacity: 1,
  },
   disabledText: {
     opacity: 0.6,
   },
});

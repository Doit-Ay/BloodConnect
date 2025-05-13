// src/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode, // Make sure ReactNode is imported
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { router } from "expo-router"; // Removed router import here to avoid confusion

// Key for storing the user ID in AsyncStorage
const USER_ID_STORAGE_KEY = "userId";

// Define the shape of the AuthContext value
export type AuthContextType = {
  userId: number | string | null; // The ID of the currently logged-in user, or null
  isLoading: boolean; // Indicates if the initial authentication state is being loaded
  setUserId: (id: number | string | null) => Promise<void>; // Function to set the user ID (logs in/out)
  signOut: () => Promise<void>; // Function to log out the user
};

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your app and provide the AuthContext
// CORRECTED: Define props as { children: ReactNode }
export function AuthProvider({ children }: { children: ReactNode }) {
  // State to hold the current user ID
  const [userId, setUserIdState] = useState<number | string | null>(null);
  // State to track if the initial loading of the auth state is complete
  const [isLoading, setIsLoading] = useState(true);
  // Ref to track if the component is mounted, to prevent state updates after unmount
  const isMounted = useRef(true);

  // Callback function to set the user ID and persist it in AsyncStorage
  const setUserId = useCallback(async (id: number | string | null) => {
    console.log("AuthContext: setUserId called with:", id); // Add this log
    try {
      if (id != null) {
        // If an ID is provided, store it
        await AsyncStorage.setItem(USER_ID_STORAGE_KEY, id.toString());
        console.log("AuthContext: userId saved to AsyncStorage:", id); // Add this log
      } else {
        // If ID is null, remove it (log out)
        await AsyncStorage.removeItem(USER_ID_STORAGE_KEY);
        console.log("AuthContext: userId removed from AsyncStorage."); // Add this log
      }
      // Update the local state
      setUserIdState(id);
      console.log("AuthContext: userId state updated to:", id); // Add this log
    } catch (error) {
      console.error("AuthContext: Failed to set userId in AsyncStorage", error);
      // Optionally handle AsyncStorage errors more robustly
    }
  }, []); // Dependencies: None, as it only depends on setUserIdState and AsyncStorage

  // Callback function to sign out the user
  const signOut = useCallback(async () => {
    console.log("AuthContext: signOut called.");
    // Call setUserId with null to clear the state and storage
    await setUserId(null);
    console.log("AuthContext: signOut completed. userId should now be null.");
    // Navigation is expected to be handled by _layout.tsx reacting to userId state change.
  }, [setUserId]); // Dependencies: setUserId is needed

  // Effect to load the initial authentication state from AsyncStorage when the provider mounts
  useEffect(() => {
    console.log("AuthContext: Initial load effect running."); // Add this log
    const loadAuthStatus = async () => {
      try {
        // Read the stored user ID
        const stored = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        console.log("AuthContext: Value read from AsyncStorage:", stored); // Add this log
        // Update state only if the component is still mounted
        if (isMounted.current) {
          setUserIdState(stored ?? null); // Set state to stored ID or null
          console.log("AuthContext: Initial userId state set to:", stored ?? null); // Add this log
        }
      } catch (error) {
        console.error("AuthContext: Failed to read userId from AsyncStorage", error);
        // If reading fails, assume no user is logged in
        if (isMounted.current) {
            setUserIdState(null);
        }
      } finally {
        // Mark loading as complete
        if (isMounted.current) {
          setIsLoading(false);
          console.log("AuthContext: Initial loading finished."); // Add this log
        }
      }
    };

    loadAuthStatus();

    // Cleanup function to set the mounted ref to false when the component unmounts
    return () => {
      isMounted.current = false;
      console.log("AuthContext: Cleanup - Component unmounted."); // Add this log
    };
  }, []); // Dependencies: Empty array means this effect runs only once on mount

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({ userId, isLoading, setUserId, signOut }),
    [userId, isLoading, setUserId, signOut] // Dependencies: Include all values in the context
  );

  // Provide the context value to the children components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to easily access the AuthContext value
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  // Throw an error if the hook is used outside of an AuthProvider
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// app/(tabs)/_Layout.tsx - (Whitespace Cleaned)

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

// Import your screen components (ensure paths are correct)
import HomeScreen from "./index"; // Assuming index.tsx is your default tab screen
import CampsScreen from "./Camps";
import RequestBloodScreen from "./RequestBlood";
import ExploreScreen from "./Explore";
import ProfileScreen from "./Profile"; // This should be the Profile.tsx *inside* (tabs)

// Create the Bottom Tab Navigator instance
const Tab = createBottomTabNavigator();

// Custom Header Component with Gradient
const CustomHeader = () => {
  return (
    // Apply gradient background to the header
    <LinearGradient
      colors={['#E63946', '#D62828']} // Example gradient colors (Primary Reds)
      style={styles.header}
      start={{ x: 0, y: 0 }} // Gradient start point
      end={{ x: 1, y: 0 }}   // Gradient end point
    >
      {/* Optional: Add Logo or other elements here */}
      {/* <MaterialIcons name="bloodtype" size={24} color="#fff" style={styles.headerIcon} /> */}
      <Text style={styles.headerTitle}>BloodConnect</Text>
    </LinearGradient>
  );
};

// Main component defining the Tabs Layout
export default function TabsLayout() {
  return (
    // Using React.Fragment <> to group Header and Navigator is correct
    <>
      <CustomHeader />
      {/* IMPORTANT: No whitespace between CustomHeader and Tab.Navigator here */}
      {/* IMPORTANT: No whitespace directly inside <Tab.Navigator> before/between/after Screens */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Hide default header, using custom one
          tabBarActiveTintColor: "#D62828", // Primary Red for active items
          tabBarInactiveTintColor: "#888", // Darker Gray for inactive items
          tabBarStyle: styles.tabBar, // Custom tab bar styles
          tabBarLabelStyle: styles.tabBarLabel, // Custom label styles
          tabBarIcon: ({ focused, color, size }) => { // Define icons dynamically
            let iconName: keyof typeof MaterialIcons.glyphMap; // Use keyof for type safety

            switch (route.name) {
              case 'index': // Corresponds to app/(tabs)/index.tsx
                iconName = focused ? 'home' : 'home';
                break;
              case 'Camps': // Corresponds to app/(tabs)/Camps.tsx
                iconName = focused ? 'local-hospital' : 'local-hospital';
                break;
              case 'RequestBlood': // Corresponds to app/(tabs)/RequestBlood.tsx
                iconName = focused ? 'bloodtype' : 'bloodtype';
                break;
              case 'Explore': // Corresponds to app/(tabs)/Explore.tsx
                iconName = focused ? 'explore' : 'explore';
                break;
              case 'Profile': // Corresponds to app/(tabs)/Profile.tsx
                 // MaterialIcons has 'person' and 'person-outline'
                 iconName = focused ? 'person' : 'person-outline';
                 break;
              default:
                iconName = 'error'; // Fallback icon
            }

            // Render the icon
            return <MaterialIcons name={iconName} size={focused ? size + 2 : size} color={color} />;
          },
        })}
      >
        {/* Define each Tab Screen - Ensure NO whitespace between these */}
        <Tab.Screen
          name="index" // Corresponds to app/(tabs)/index.tsx
          component={HomeScreen}
          options={{ title: "Home" }}
        />
        <Tab.Screen
          name="Camps" // Corresponds to app/(tabs)/Camps.tsx
          component={CampsScreen}
          options={{ title: "Camps" }}
        />
        <Tab.Screen
          name="RequestBlood" // Corresponds to app/(tabs)/RequestBlood.tsx
          component={RequestBloodScreen}
          options={{ title: "Request" }}
        />
        <Tab.Screen
          name="Explore" // Corresponds to app/(tabs)/Explore.tsx
          component={ExploreScreen}
          options={{ title: "Explore" }}
        />
        <Tab.Screen
          name="Profile" // Corresponds to app/(tabs)/Profile.tsx
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        {/* Ensure NO whitespace after the last screen */}
      </Tab.Navigator>
      {/* IMPORTANT: No whitespace here either */}
    </>
  );
}

const styles = StyleSheet.create({
  // Custom Header Styles
  header: {
    height: Platform.OS === 'android' ? 65 : 80, // Slightly increased height
    paddingTop: Platform.OS === 'ios' ? 25 : 10, // Adjust top padding
    // backgroundColor removed, using gradient
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center items vertically
    justifyContent: 'center', // Center items horizontally
    paddingHorizontal: 15,
    // Shadow for depth
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerIcon: { // Optional icon style
      marginRight: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 21, // Slightly larger title
    fontWeight: "bold",
    letterSpacing: 0.5, // Add subtle letter spacing
  },
  // Tab Bar Styles
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#dddddd', // Slightly darker border
    borderTopWidth: 1,
    height: Platform.OS === 'android' ? 65 : 80, // Increased height
    paddingBottom: Platform.OS === 'android' ? 5 : 20, // Adjust bottom padding for notch
    paddingTop: 8, // Add some top padding
    // Add shadow for elevation
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, // Shadow above the tab bar
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600', // Make labels semi-bold
    marginBottom: Platform.OS === 'android' ? 2 : -2, // Fine-tune spacing
  },
});
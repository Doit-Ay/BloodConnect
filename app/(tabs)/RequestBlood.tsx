import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform, // Import Platform
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Linking, // Import Linking for potential 'Call Donor' feature
} from "react-native";
import { Picker } from "@react-native-picker/picker";
// Optional: If using icons
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from "../../src/AuthContext"; // Assuming this path is correct

// --- Interfaces ---
// Describes the structure of a blood request object
interface BloodRequest {
  id: number;
  requesterId?: number; // Added requesterId to filter user's own requests
  bloodGroup: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  note?: string;
  urgencyLevel: "Low" | "Medium" | "High";
}

// Describes the structure of a potential donor match object
interface DonorMatch {
  id: number;
  name: string;
  phone: string;
  location: string;
  bloodGroup: string;
  score?: number; // Matching score from the backend
}

// --- Constants ---
// IMPORTANT: Replace with your actual API URL if different
const API_URL = "add yours url or local address"; // Or your deployed API endpoint
const locationOptions = [ // Example locations, customize as needed
  "Chennai",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
];
const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const urgencies = ["Low", "Medium", "High"] as const; // Use 'as const' for stricter typing
type UrgencyLevel = typeof urgencies[number]; // Type helper for urgency levels

// --- Component ---
export default function RequestBlood() {
  // Authentication context to get the current user's ID
  const { userId } = useAuth();
  // State to manage which tab is currently active ('make', 'nearby', 'matches')
  const [mode, setMode] = useState<"make" | "nearby" | "matches">("make");

  // Form fields state variables
  const [name, setName] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Low");

  // State variables for data fetched from the API
  const [requests, setRequests] = useState<BloodRequest[]>([]); // Nearby requests
  const [matches, setMatches] = useState<DonorMatch[]>([]); // Potential donor matches
  const [ruleFired, setRuleFired] = useState<string>(""); // Matching rule description from backend
  // Loading state indicators
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For the submit button

  // Ref to store the ID of the most recently submitted request by the user
  const lastRequestId = useRef<number | null>(null);

  // --- Effects ---

  // Effect to fetch nearby blood requests when the 'nearby' tab is selected
  useEffect(() => {
    // Only run if mode is 'nearby' and user is logged in
    if (mode === "nearby" && userId) {
      setLoadingNearby(true); // Show loading indicator
      setRequests([]); // Clear previous requests before fetching new ones

      let userLocation = ""; // Variable to store the user's location from profile

      // 1. Fetch the current user's profile to get their location
      fetch(`${API_URL}/users/${userId}`)
        .then((response) => {
          if (!response.ok) throw new Error('Failed to fetch user profile');
          return response.json();
        })
        .then((userData: { bloodGroup: string; location: string }) => {
          // Check if location exists in the user data
          if (!userData.location) {
              throw new Error('User profile location not set.');
          }
          userLocation = userData.location; // Store the fetched location

          // 2. Fetch blood requests based on the user's location
          // Modify the API endpoint/query params based on your backend logic
          // Example: Fetching requests *in* the user's location
          return fetch(
            `${API_URL}/blood_requests?location=${encodeURIComponent(userLocation)}`
            // Alternative: Fetch requests compatible for the user to donate to
            // `${API_URL}/blood_requests?compatibleWith=${userData.bloodGroup}&location=${encodeURIComponent(userLocation)}`
          );
        })
        .then((response) => {
           if (!response.ok) throw new Error('Failed to fetch blood requests');
           return response.json();
        })
        .then((data: BloodRequest[]) => {
            // Filter out requests made by the current user to avoid showing their own requests
            const filteredData = data.filter(req => req.requesterId !== userId);
            setRequests(filteredData); // Update state with fetched and filtered requests
        })
        .catch((error) => {
            // Handle errors during the fetch process
            console.error("Error fetching nearby requests:", error);
            Alert.alert("Error", `Could not load nearby requests. ${error.message || 'Please check connection.'}`);
        })
        .finally(() => {
            setLoadingNearby(false); // Hide loading indicator regardless of success/failure
        });
    }
  }, [mode, userId]); // Dependencies: Re-run effect if mode or userId changes

  // Effect to fetch potential donor matches when the 'matches' tab is selected
  useEffect(() => {
    // Only run if mode is 'matches' and we have an ID from a recently submitted request
    if (mode === "matches" && lastRequestId.current) {
      setLoadingMatches(true); // Show loading indicator
      setMatches([]); // Clear previous matches
      setRuleFired(""); // Clear previous matching rule description

      // Fetch matches from the backend using the stored request ID
      fetch(`${API_URL}/blood_requests/${lastRequestId.current}/match`)
        .then((response) => {
             if (!response.ok) throw new Error('Failed to fetch matches');
             return response.json();
        })
        .then((json: { matches: DonorMatch[]; ruleFired: string }) => {
          // Update state with fetched matches and the rule description
          setMatches(json.matches);
          setRuleFired(json.ruleFired || "Default Matching"); // Use default text if ruleFired is empty
        })
        .catch((error) => {
            // Handle errors during fetch
            console.error("Error fetching matches:", error);
            Alert.alert("Error", "Could not load potential donor matches.");
        })
        .finally(() => {
            setLoadingMatches(false); // Hide loading indicator
        });
    } else if (mode === 'matches' && !lastRequestId.current) {
        // If user navigates to 'matches' tab without submitting a request first
        setMatches([]); // Ensure matches are cleared
        setRuleFired(""); // Ensure rule is cleared
        // No loading indicator needed here, handled by conditional rendering later
    }
    // Dependencies: Re-run effect if mode or the stored lastRequestId changes
  }, [mode, lastRequestId.current]);


  // --- Functions ---

  // Function to handle the submission of the blood request form
  const handleSubmit = async () => {
    // Check if user is logged in
    if (!userId) {
      Alert.alert("Login Required", "Please log in via the Profile tab first.");
      return;
    }
    // Validate required fields
    if (!name.trim() || !bloodType || !location || !address.trim() || !phone.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields (marked with *).");
      return;
    }
    // Validate phone number format (simple 10-digit check)
    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true); // Indicate submission is in progress

    try {
      // Send POST request to the backend API
      const response = await fetch(`${API_URL}/blood_requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: userId, // Include the ID of the user making the request
          name: name.trim(),
          bloodGroup: bloodType,
          location,
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim(), // Send note even if empty, backend can handle
          urgencyLevel: urgency,
        }),
      });

      // Check if the request was successful
      if (!response.ok) {
        // Try to parse error message from backend response
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      // Request successful, parse the response (expecting the new request object with ID)
      const newRequest: BloodRequest = await response.json();
      lastRequestId.current = newRequest.id; // Store the ID of the created request in the ref

      Alert.alert("Success", "Your blood request has been submitted successfully!");

      // Reset form fields to initial state
      setName("");
      setBloodType("");
      setLocation("");
      setAddress("");
      setPhone("");
      setNote("");
      setUrgency("Low");

      // Automatically switch view to the 'Matches' tab
      setMode("matches");

    } catch (error: any) {
        // Handle errors during submission
        console.error("Error submitting request:", error);
        Alert.alert("Submission Failed", `Could not submit your request. ${error.message || 'Please try again.'}`);
    } finally {
        setIsSubmitting(false); // Reset submission state
    }
  };

  // Function to render each item in the Nearby Requests list
  const renderRequestItem = ({ item }: { item: BloodRequest }) => (
    <View style={styles.card}>
      {/* Card Header: Blood Group and Urgency */}
      <View style={styles.cardHeader}>
         {/* Optional Icon */}
         {/* <Icon name="water-outline" size={22} color={getUrgencyColor(item.urgencyLevel).backgroundColor} style={{ transform: [{ rotate: '90deg' }], marginRight: 8 }}/> */}
        <Text style={[styles.cardBloodGroup, getUrgencyColor(item.urgencyLevel)]}>{item.bloodGroup}</Text>
        <Text style={[styles.cardUrgency, getUrgencyColor(item.urgencyLevel)]}>{item.urgencyLevel}</Text>
      </View>
      {/* Card Body: Request details */}
      <View style={styles.cardBody}>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>🧑 Name:</Text> {item.name}</Text>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>📍 Location:</Text> {item.location}</Text>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>🏠 Address:</Text> {item.address}</Text>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>📞 Phone:</Text> {item.phone}</Text>
        {/* Display note only if it exists */}
        {item.note && (
          <Text style={styles.cardNote}><Text style={styles.cardLabel}>📝 Note:</Text> "{item.note}"</Text>
        )}
      </View>
    </View>
  );

  // Function to render each item in the Potential Matches list
  const renderMatchItem = ({ item }: { item: DonorMatch }) => (
    <View style={[styles.card, styles.matchCard]}>
       {/* Card Header: Donor Name and Match Score */}
       <View style={styles.cardHeader}>
         {/* Optional Icon */}
         {/* <Icon name="account-heart-outline" size={22} color="#003049" style={{ marginRight: 8 }}/> */}
         <Text style={styles.matchName}>{item.name}</Text>
         {/* Display score only if available */}
         {item.score != null && (
             <Text style={styles.matchScore}>Match Score: {item.score}</Text>
         )}
       </View>
       {/* Card Body: Donor details */}
       <View style={styles.cardBody}>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>🩸 Group:</Text> {item.bloodGroup}</Text>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>📍 Location:</Text> {item.location}</Text>
        <Text style={styles.cardText}><Text style={styles.cardLabel}>📞 Phone:</Text> {item.phone}</Text>
        {/* Optional: Button to initiate a call */}
        {/* <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <Text style={styles.contactButtonText}>Call Donor</Text>
            <Icon name="phone-outline" size={16} color="#fff" style={{ marginLeft: 5 }}/>
        </TouchableOpacity> */}
       </View>
    </View>
  );

  // Helper function to determine background/text color based on urgency level
  const getUrgencyColor = (level: UrgencyLevel): object => {
      switch (level) {
          case 'High': return styles.highUrgency; // Defined in StyleSheet
          case 'Medium': return styles.mediumUrgency; // Defined in StyleSheet
          default: return styles.lowUrgency; // Defined in StyleSheet
      }
  };

  // --- Render Logic ---

  // If user is not logged in, display a prompt message
  if (!userId) {
    return (
      <View style={styles.centerMessageContainer}>
        {/* Optional: Icon name="login-variant" size={40} color="#555" style={{ marginBottom: 15 }}/> */}
        <Text style={styles.centerMessageText}>Please log in via the Profile tab to make or view blood requests.</Text>
      </View>
    );
  }

  // Main component rendering structure
  return (
    // Use KeyboardAvoidingView for better form usability on smaller screens
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Offset might need adjustment based on header height
    >
      {/* Main container view */}
      <View style={styles.container}>
        {/* Tab Navigation Header */}
        <View style={styles.tabContainer}>
          {/* Map through the modes to generate tab buttons */}
          {(["make", "nearby", "matches"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.tabButton,
                mode === m && styles.tabButtonActive, // Apply active style if mode matches
              ]}
              onPress={() => setMode(m)} // Change mode on press
              disabled={mode === m} // Disable the currently active tab button
            >
              {/* Optional: Add Icons for each tab */}
              {/* {m === 'make' && <Icon name={mode === m ? "plus-circle" : "plus-circle-outline"} size={20} color={mode === m ? styles.tabTextActive.color : styles.tabText.color} />} */}
              {/* {m === 'nearby' && <Icon name={mode === m ? "map-marker-radius" : "map-marker-radius-outline"} size={20} color={mode === m ? styles.tabTextActive.color : styles.tabText.color} />} */}
              {/* {m === 'matches' && <Icon name={mode === m ? "account-search" : "account-search-outline"} size={20} color={mode === m ? styles.tabTextActive.color : styles.tabText.color} />} */}
              {/* Tab Text */}
              <Text
                style={[
                    styles.tabText,
                    mode === m && styles.tabTextActive // Apply active text style
                ]}
              >
                {/* User-friendly names for tabs */}
                {m === "make" ? "Make Request" : m === "nearby" ? "Nearby Requests" : "Potential Matches"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Content Area: Render based on active mode --- */}

        {/* Make Request Form View */}
        {mode === "make" && (
            <ScrollView
                contentContainerStyle={styles.formContainer} // Apply padding etc.
                keyboardShouldPersistTaps="handled" // Ensure taps work when keyboard is up
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.formHeader}>Request Blood Donation</Text>
                <Text style={styles.formSubheader}>Fill in the details below. Fields marked with * are required.</Text>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Recipient's Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter patient's full name"
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words" // Capitalize first letter of each word
                    />
                </View>

                {/* Blood Group Picker */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Required Blood Group *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={bloodType}
                            onValueChange={(itemValue) => setBloodType(itemValue)}
                            style={styles.picker}
                            dropdownIconColor="#003049" // Customize dropdown arrow color
                        >
                            <Picker.Item label="-- Select Blood Group --" value="" style={styles.pickerPlaceholder} />
                            {bloodGroups.map((g) => (
                                <Picker.Item key={g} label={g} value={g} style={styles.pickerItem} />
                            ))}
                        </Picker>
                    </View>
                </View>

                 {/* Urgency Picker */}
                 <View style={styles.inputGroup}>
                    <Text style={styles.label}>Urgency Level *</Text>
                     <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={urgency}
                            onValueChange={(itemValue) => setUrgency(itemValue as UrgencyLevel)}
                            style={styles.picker}
                            dropdownIconColor="#003049"
                        >
                            {urgencies.map((u) => (
                                <Picker.Item key={u} label={u} value={u} style={styles.pickerItem} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Location Picker */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location (City) *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={location}
                            onValueChange={(itemValue) => setLocation(itemValue)}
                            style={styles.picker}
                            dropdownIconColor="#003049"
                        >
                            <Picker.Item label="-- Select City --" value="" style={styles.pickerPlaceholder}/>
                            {locationOptions.map((loc) => (
                                <Picker.Item key={loc} label={loc} value={loc} style={styles.pickerItem} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Address Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Address (Hospital/Home) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Room 101, XYZ Hospital, 123 Main St"
                        placeholderTextColor="#aaa"
                        value={address}
                        onChangeText={setAddress}
                    />
                </View>

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contact Phone Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 10-digit mobile number"
                        placeholderTextColor="#aaa"
                        keyboardType="phone-pad" // Show numeric keyboard
                        maxLength={10} // Limit input length
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                {/* Note Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Additional Note (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]} // Apply multi-line style
                        placeholder="Any specific details, patient condition, or instructions?"
                        placeholderTextColor="#aaa"
                        multiline // Enable multi-line input
                        numberOfLines={4} // Suggest number of lines (Android)
                        value={note}
                        onChangeText={setNote}
                        textAlignVertical="top" // Ensure text starts at the top
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} // Style changes when submitting
                    onPress={handleSubmit}
                    disabled={isSubmitting} // Prevent multiple submissions
                >
                    {/* Show activity indicator while submitting */}
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        // Show button text (and optional icon)
                        // <Icon name="send-check-outline" size={20} color="#fff" style={{marginRight: 8}} />
                        <Text style={styles.submitButtonText}>Submit Blood Request</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        )}

        {/* Nearby Requests List View */}
        {mode === "nearby" && (
            // Show loading indicator or the list
            loadingNearby ? (
                <View style={styles.centerMessageContainer}><ActivityIndicator size="large" color="#D62828" /></View>
            ) : (
                <FlatList
                    data={requests} // Data source for the list
                    renderItem={renderRequestItem} // Function to render each item
                    keyExtractor={(item) => item.id.toString()} // Unique key for each item
                    contentContainerStyle={styles.listContainer} // Styling for the list container
                    // Component to show when the list is empty
                    ListEmptyComponent={
                        <View style={styles.centerMessageContainer}>
                            {/* Optional: Icon name="alert-circle-outline" size={30} color="#555" style={{ marginBottom: 10 }}/> */}
                            <Text style={styles.centerMessageText}>No nearby blood requests found in your location.</Text>
                        </View>
                    }
                />
            )
        )}

        {/* Potential Matches List View */}
        {mode === "matches" && (
            // Show loading indicator, 'submit request first' message, or the list
            loadingMatches ? (
                <View style={styles.centerMessageContainer}><ActivityIndicator size="large" color="#0077B6" /></View>
            ) : !lastRequestId.current ? (
                 // Show message if user hasn't submitted a request in this session
                 <View style={styles.centerMessageContainer}>
                    {/* Optional: Icon name="information-outline" size={30} color="#555" style={{ marginBottom: 10 }}/> */}
                    <Text style={styles.centerMessageText}>Please submit a request on the 'Make Request' tab first to view potential donor matches.</Text>
                 </View>
            ) : (
                // Container for the matches list and header
                <View style={styles.listContainer}>
                    {/* Display the matching rule used by the backend */}
                    <Text style={styles.matchesHeader}>
                         Potential donors based on rule: {ruleFired}
                    </Text>
                    <FlatList
                        data={matches} // Data source for matches
                        renderItem={renderMatchItem} // Function to render each match item
                        keyExtractor={(item) => item.id.toString()} // Unique key
                        // Component to show when no matches are found
                        ListEmptyComponent={
                            <View style={styles.centerMessageContainer}>
                                {/* Optional: Icon name="account-cancel-outline" size={30} color="#555" style={{ marginBottom: 10 }}/> */}
                                <Text style={styles.centerMessageText}>No potential donor matches found for your recent request at this time.</Text>
                            </View>
                        }
                    />
                </View>
            )
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
// Grouped and refined styles for better organization and appearance
const styles = StyleSheet.create({
  // --- Containers ---
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8', // Light background for the entire screen
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  listContainer: { // Used for FlatList content padding
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  // --- Centered Messages (Loading, Empty, Login Prompt) ---
  centerMessageContainer: {
    flex: 1, // Take available space
    justifyContent: "center",
    alignItems: "center",
    padding: 30, // More padding
  },
  centerMessageText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
  },
  // --- Tab Navigation ---
  tabContainer: {
    flexDirection: "row",
    backgroundColor: '#ffffff', // White background for tabs
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    // Add subtle shadow for depth
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1, // Distribute space equally
    flexDirection: 'row', // Layout icon and text horizontally
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 15, // Increased vertical padding
    paddingHorizontal: 10,
    borderBottomWidth: 3, // Thickness of the active indicator line
    borderBottomColor: 'transparent', // Hide border by default
  },
  tabButtonActive: {
    borderBottomColor: "#D62828", // Primary Red color for active tab indicator
  },
  tabText: {
    fontSize: 14,
    color: "#555", // Default text color
    marginLeft: 5, // Space between icon and text (adjust if no icon)
    textAlign: 'center',
    fontWeight: '500', // Medium weight for tabs
  },
  tabTextActive: {
    color: "#D62828", // Primary Red color for active tab text
    fontWeight: "bold", // Bold active text
  },

  // --- Make Request Form ---
  formContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom of the scroll view
  },
  formHeader: {
      fontSize: 24, // Larger header
      fontWeight: 'bold',
      color: '#003049', // Dark Blue
      marginBottom: 8,
      textAlign: 'center',
  },
  formSubheader: {
      fontSize: 15, // Slightly larger subheader
      color: '#555',
      marginBottom: 30, // More space below subheader
      textAlign: 'center',
      lineHeight: 21,
  },
  inputGroup: {
      marginBottom: 20, // Consistent spacing between form elements
  },
  label: {
      fontSize: 15,
      color: '#333', // Darker label text
      marginBottom: 8, // Space below label
      fontWeight: '600', // Semi-bold label
  },
  input: {
    backgroundColor: '#ffffff', // White input background
    borderWidth: 1,
    borderColor: "#ccc", // Standard border color
    borderRadius: 8,
    paddingHorizontal: 15, // Good horizontal padding
    paddingVertical: Platform.OS === 'ios' ? 14 : 12, // Platform-specific vertical padding
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100, // Ensure minimum height for notes
    textAlignVertical: "top", // Align text to the top in multiline
  },
  pickerContainer: { // Container to style the picker background/border
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden', // Important for border radius on Android
  },
  picker: {
    // Note: Direct styling of Picker items is limited and platform-dependent
    height: 55, // Increased height for better touch
    width: '100%',
    color: '#333',
    backgroundColor: 'transparent', // Picker itself should be transparent if container has color
  },
  pickerPlaceholder: { // Style specifically for the placeholder item if possible
      color: '#999', // Lighter color for placeholder text
      fontSize: 16,
  },
   pickerItem: { // Style for the actual selectable items
       fontSize: 16,
       color: '#333', // Ensure text color is set
   },
  submitButton: {
    backgroundColor: "#D62828", // Primary Red
    paddingVertical: 16, // Larger touch area
    borderRadius: 8,
    alignItems: "center",
    justifyContent: 'center', // Center content (indicator or text)
    marginTop: 25, // More space above button
    flexDirection: 'row', // Allow icon placement
    // Add shadow for depth
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitButtonDisabled: {
      backgroundColor: '#BDBDBD', // Grey background when disabled
      elevation: 0, // Remove shadow when disabled
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
  },

  // --- List Card Styles (Common for Nearby & Matches) ---
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10, // Slightly more rounded
    marginBottom: 15, // Space between cards
    padding: 15, // Internal padding
    // Consistent shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderWidth: 1, // Add a subtle border
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out elements
    alignItems: 'center',
    marginBottom: 12, // Space below header
    paddingBottom: 10, // Padding below header content
    borderBottomWidth: 1, // Separator line
    borderBottomColor: '#eee', // Light separator color
  },
  cardBody: {
      // No specific styles needed currently, acts as content container
  },
  cardText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 23, // Slightly increased line height
    marginBottom: 6, // Space between lines of info
  },
   cardLabel: { // Style for labels like "Name:", "Location:"
       fontWeight: '600', // Semi-bold label
       color: '#003049', // Dark Blue label color
       marginRight: 4, // Space after label
   },
  cardNote: { // Style for the optional note
    fontSize: 14,
    fontStyle: "italic",
    color: '#555',
    marginTop: 10, // Space above note
    paddingTop: 10, // Padding above note text
    borderTopWidth: 1, // Separator line above note
    borderTopColor: '#eee',
  },

  // --- Nearby Request Specific Styles ---
  cardBloodGroup: { // Style for the Blood Group text in header
    fontSize: 18,
    fontWeight: 'bold',
    // Color is applied by getUrgencyColor
  },
  cardUrgency: { // Style for the Urgency badge
    fontSize: 13, // Smaller font size for badge
    fontWeight: 'bold',
    paddingHorizontal: 10, // Horizontal padding
    paddingVertical: 4, // Vertical padding
    borderRadius: 15, // Pill shape
    color: '#ffffff', // White text
    overflow: 'hidden', // Clip background to border radius
    textTransform: 'uppercase', // Uppercase text
    letterSpacing: 0.5, // Slight letter spacing
  },
  // Urgency Background/Text Colors (used in getUrgencyColor)
  highUrgency: {
      backgroundColor: '#D62828', // Red
      color: '#ffffff',
  },
  mediumUrgency: {
      backgroundColor: '#F77F00', // Orange
      color: '#ffffff',
  },
  lowUrgency: {
      backgroundColor: '#8ac926', // Green
      color: '#ffffff',
  },

  // --- Potential Match Specific Styles ---
  matchCard: { // Subtle style differences for match cards
    borderColor: '#AEDFF7', // Light blue border
    backgroundColor: '#F0F9FF', // Very light blue background
  },
   matchesHeader: { // Style for the "Matching Rule: ..." text
    textAlign: "center",
    paddingVertical: 12, // More vertical padding
    fontSize: 14,
    fontStyle: "italic",
    color: "#444", // Slightly darker text
    marginBottom: 8, // Space below header
  },
  matchName: { // Style for the donor's name
    fontSize: 18, // Larger name
    fontWeight: "bold",
    color: '#003049', // Dark Blue
  },
  matchScore: { // Style for the match score
    fontSize: 13,
    color: '#00507A', // Medium Blue
    fontWeight: '600', // Semi-bold score
  },
  // Optional: Contact Button Style
  // contactButton: {
  //     flexDirection: 'row',
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //     backgroundColor: '#0077B6', // Primary Blue button
  //     paddingVertical: 10,
  //     paddingHorizontal: 15,
  //     borderRadius: 6,
  //     marginTop: 12, // Space above button
  //     elevation: 2,
  //     shadowColor: '#000',
  //     shadowOffset: { width: 0, height: 1 },
  //     shadowOpacity: 0.2,
  //     shadowRadius: 2,
  // },
  // contactButtonText: {
  //     color: '#ffffff',
  //     fontWeight: 'bold',
  //     fontSize: 14,
  // }
});

// Removed $SELECTION_PLACEHOLDER$ and fixed the error

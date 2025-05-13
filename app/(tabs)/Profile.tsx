// app/(tabs)/Profile.tsx - Protected Profile View (Improved UI & Error Navigation)

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { DatePickerModal } from "react-native-paper-dates";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/AuthContext";
import { MaterialIcons } from '@expo/vector-icons'; // Import icons

// Import the custom confirmation modal
import ConfirmationModal from "../../components/ConfirmationModal"; // Adjust path if needed

// API endpoint
const API_URL = "add yours url or local address"; // TODO: Change for production/deployment

// Picker options (Consider moving to a shared constants file)
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
const locationOptions = [
  "Chennai", "Delhi", "Mumbai", "Bangalore", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad",
];

// User profile shape
interface UserProfile {
  id: number | string;
  email: string;
  name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  bloodGroup: string | null;
  location: string | null;
}

// Date Helpers (Consider moving to a shared utils file)
const formatToYYYYMMDD = (date: Date | undefined | null): string => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const parseDateStringLocal = (s?: string | null): Date | null => {
    if (!s) return null;
    const parts = s.split("-").map(x => parseInt(x, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (dt.getUTCFullYear() !== parts[0] || dt.getUTCMonth() !== parts[1] - 1 || dt.getUTCDate() !== parts[2]) return null;
    return dt;
};

const formatDateForDisplay = (d?: string | Date | null) => {
    if (!d) return "Not Set";
    const dateObj = typeof d === "string" ? parseDateStringLocal(d) : d;
    if (!dateObj) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};


export default function ProfileScreen() {
  const router = useRouter();
  const { userId, signOut } = useAuth();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState<Date | undefined>(undefined);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form fields for editing
  const [name, setName] = useState("");
  const [dobObj, setDobObj] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");

  // Fetch profile data
  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      if (userId == null) {
          console.warn("ProfileScreen mounted without userId.");
          if(active) setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (!res.ok) {
            console.error("Fetch profile failed, status:", res.status);
            if (active) setCurrentUser(null);
            return;
        }
        const profile: UserProfile = await res.json();
        if (active) {
            setCurrentUser(profile);
            // Pre-fill edit form state
            setName(profile.name || "");
            setDobObj(parseDateStringLocal(profile.dob) || undefined);
            setGender(profile.gender || "");
            setPhone(profile.phone || "");
            setBloodGroup(profile.bloodGroup || "");
            setLocation(profile.location || "");
        }
      } catch (error) {
          console.error("Error fetching profile:", error);
           if (active) setCurrentUser(null);
      } finally {
           if (active) setIsLoading(false);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, [userId]);

  // Sync date picker state
  useEffect(() => { setDatePickerDate(dobObj); }, [dobObj]);

  // Reset form fields
  const resetEditForms = () => {
    if (!currentUser) return;
    setName(currentUser.name || "");
    setDobObj(parseDateStringLocal(currentUser.dob) || undefined);
    setGender(currentUser.gender || "");
    setPhone(currentUser.phone || "");
    setBloodGroup(currentUser.bloodGroup || "");
    setLocation(currentUser.location || "");
  };

  // Edit/Cancel handlers
  const handleEditProfile = () => { if (!currentUser) return; resetEditForms(); setIsEditing(true); };
  const handleCancelEdit = () => { setIsEditing(false); };

  // Update profile handler
  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    // Validation
    if (!name || dobObj === undefined || !gender || !phone || !bloodGroup || !location) { Alert.alert("Missing Info", "All profile fields are required."); return; }
    if (!/^\d{10}$/.test(phone)) { Alert.alert("Invalid Phone", "Phone number must be 10 digits."); return; }

    setIsLoading(true);
    try {
      const payload = { name, dob: formatToYYYYMMDD(dobObj), gender, phone, bloodGroup, location };
      const res = await fetch(`${API_URL}/users/${currentUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.message || `Update failed.`); }
      const updatedProfile = await res.json();
      setCurrentUser(updatedProfile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (err: any) { Alert.alert("Update Error", err.message || "An unexpected error occurred."); }
    finally { setIsLoading(false); }
  };

  // Logout handlers
  const handleLogout = () => { setShowLogoutModal(true); };
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try { await signOut(); router.replace("/Login"); }
    catch (error) { console.error("Logout failed:", error); Alert.alert("Logout Error", "Could not log out."); }
  };

  // Date Picker handlers
  const handleConfirmDate = useCallback(({ date }: { date: Date | undefined }) => { setShowDatePicker(false); if (date) setDobObj(date); setDatePickerDate(undefined); }, []);
  const handleDismissDate = useCallback(() => { setShowDatePicker(false); setDatePickerDate(undefined); }, []);
  const initialDatePickerDate = dobObj instanceof Date ? dobObj : new Date();

  // --- RENDER EDIT FIELDS ---
  const renderEditInputFields = () => {
     if (!currentUser) return null;
     return ( /* ... Keep the existing edit fields JSX structure ... */
       <>
          {/* Name Input */}
          <Text style={styles.label}>Name *</Text>
          <TextInput style={[styles.input, isLoading && styles.disabledInput]} value={name} onChangeText={setName} placeholder="Full Name" textContentType="name" autoComplete="name" editable={!isLoading} />
          {/* DOB Picker Button */}
          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity style={[styles.dateButton, isLoading && styles.disabledInput]} onPress={() => setShowDatePicker(true)} disabled={isLoading}>
            <Text style={dobObj ? styles.dateButtonTextFilled : styles.dateButtonTextPlaceholder}>{dobObj ? formatDateForDisplay(dobObj) : "Select Date"}</Text>
          </TouchableOpacity>
          {/* Gender Picker */}
          <Text style={styles.label}>Gender *</Text>
          <View style={[styles.pickerContainer, isLoading && styles.disabledInput]}>
            <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker} dropdownIconColor={isLoading ? "#ADB5BD" : "#495057"} enabled={!isLoading}>
              <Picker.Item label="-- Select Gender --" value="" enabled={gender === "" && !isLoading} style={styles.pickerPlaceholderText} />
              {genderOptions.map((g) => (<Picker.Item key={g} label={g} value={g} />))}
            </Picker>
          </View>
          {/* Phone Input */}
          <Text style={styles.label}>Phone *</Text>
          <TextInput style={[styles.input, isLoading && styles.disabledInput]} keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} placeholder="10-digit phone" textContentType="telephoneNumber" dataDetectorTypes="phoneNumber" autoComplete="tel" editable={!isLoading} />
          {/* Blood Group Picker */}
          <Text style={styles.label}>Blood Group *</Text>
          <View style={[styles.pickerContainer, isLoading && styles.disabledInput]}>
            <Picker selectedValue={bloodGroup} onValueChange={setBloodGroup} style={styles.picker} dropdownIconColor={isLoading ? "#ADB5BD" : "#495057"} enabled={!isLoading}>
              <Picker.Item label="-- Select Blood Group --" value="" enabled={bloodGroup === "" && !isLoading} style={styles.pickerPlaceholderText} />
              {bloodGroupOptions.map((b) => (<Picker.Item key={b} label={b} value={b} />))}
            </Picker>
          </View>
          {/* Location Picker */}
          <Text style={styles.label}>Location *</Text>
          <View style={[styles.pickerContainer, isLoading && styles.disabledInput]}>
            <Picker selectedValue={location} onValueChange={setLocation} style={styles.picker} dropdownIconColor={isLoading ? "#ADB5BD" : "#495057"} enabled={!isLoading}>
              <Picker.Item label="-- Select City --" value="" enabled={location === "" && !isLoading} style={styles.pickerPlaceholderText} />
              {locationOptions.map((l) => (<Picker.Item key={l} label={l} value={l} />))}
            </Picker>
          </View>
       </>
     );
  };

  // --- RENDER PROFILE DISPLAY ITEM --- (Helper for cleaner display)
  const renderProfileItem = (iconName: keyof typeof MaterialIcons.glyphMap | null, label: string, value: string | null | undefined) => (
      <View style={styles.infoRow}>
          {iconName && <MaterialIcons name={iconName} size={22} color="#495057" style={styles.infoIcon} />}
          <Text style={styles.infoLabel}>{label}:</Text>
          <Text style={styles.infoValue}>{value || "N/A"}</Text>
      </View>
  );


  // --- Main Render ---
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {/* Full screen overlay for initial profile loading */}
      {isLoading && !currentUser && (
        <View style={styles.loadingOverlayFullScreen}>
             <ActivityIndicator size="large" color="#0077B6" />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll}>
           {currentUser ? (
                 // --- RENDER PROFILE DETAILS OR EDIT FORM ---
                 <View style={styles.box}>
                   {/* Loading overlay for update action */}
                   {isLoading && isEditing && (
                       <View style={styles.loadingOverlay}>
                           <ActivityIndicator size="large" color="#0077B6" />
                       </View>
                   )}
                   <Text style={styles.title}>
                     {isEditing ? "Edit Profile" : "My Profile"}
                   </Text>

                   {isEditing ? (
                     // --- EDIT MODE ---
                     <>
                       {renderEditInputFields()}
                       <View style={styles.row}>
                         <TouchableOpacity style={[styles.button, styles.flex, styles.saveButton, isLoading && styles.disabledButton]} onPress={handleUpdateProfile} disabled={isLoading}>
                           <MaterialIcons name="save" size={18} color="#fff" style={styles.buttonIcon} />
                           <Text style={styles.buttonText}>Save Profile</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={[styles.button, styles.flex, styles.cancelButton, isLoading && styles.disabledButton]} onPress={handleCancelEdit} disabled={isLoading}>
                            <MaterialIcons name="cancel" size={18} color="#fff" style={styles.buttonIcon} />
                           <Text style={styles.buttonText}>Cancel</Text>
                         </TouchableOpacity>
                       </View>
                     </>
                   ) : (
                     // --- DISPLAY MODE (Improved UI) ---
                     <>
                       <View style={styles.infoContainer}>
                           {renderProfileItem("person-outline", "Name", currentUser.name)}
                           {renderProfileItem("email", "Email", currentUser.email)}
                           {renderProfileItem("cake", "DOB", formatDateForDisplay(currentUser.dob))}
                           {/* Choose appropriate icons */}
                           {renderProfileItem(currentUser.gender === 'Male' ? 'male' : currentUser.gender === 'Female' ? 'female' : 'wc', "Gender", currentUser.gender)}
                           {renderProfileItem("phone", "Phone", currentUser.phone)}
                           {renderProfileItem("bloodtype", "Blood Group", currentUser.bloodGroup)}
                           {renderProfileItem("location-city", "Location", currentUser.location)}
                       </View>
                      <View style={styles.row}>
                         <TouchableOpacity style={[styles.button, styles.flex, styles.editButton, isLoading && styles.disabledButton]} onPress={handleEditProfile} disabled={isLoading}>
                           <MaterialIcons name="edit" size={18} color="#fff" style={styles.buttonIcon} />
                           <Text style={styles.buttonText}>Edit Profile</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={[styles.button, styles.flex, styles.logoutButton, isLoading && styles.disabledButton]} onPress={handleLogout} disabled={isLoading}>
                           <MaterialIcons name="logout" size={18} color="#fff" style={styles.buttonIcon} />
                           <Text style={styles.buttonText}>Logout</Text>
                         </TouchableOpacity>
                       </View>
                     </>
                   )}
                 </View>
               ) : (
                 // --- RENDER ERROR STATE WITH LOGIN/SIGNUP BUTTONS ---
                 <View style={styles.centerContent}>
                    {!isLoading && ( // Only show error state if not loading
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={48} color="#DC3545" style={{ marginBottom: 15 }} />
                            <Text style={styles.errorText}>
                                Please login or sign up.
                            </Text>
                            <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={() => router.replace('/Login')}>
                                <MaterialIcons name="login" size={18} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Go to Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.signupButton]} onPress={() => router.replace('/Signup')}>
                                <MaterialIcons name="person-add-alt" size={18} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Go to Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                 </View>
               )}
      </ScrollView>

      {/* --- Modals --- */}
      <ConfirmationModal visible={showLogoutModal} title="Confirm Logout" message="Are you sure you want to logout?" onConfirm={confirmLogout} onCancel={() => { setShowLogoutModal(false); }} confirmText="Logout" cancelText="Cancel" />
      <DatePickerModal locale="en" mode="single" visible={showDatePicker} onDismiss={handleDismissDate} date={datePickerDate} onConfirm={handleConfirmDate} saveLabel="Confirm" validRange={{ endDate: new Date() }} />
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC", // Lighter background
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 15, // Slightly less padding
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 15, // More rounded corners
    padding: 20, // Adjusted padding
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, },
      android: { elevation: 6, },
      default: { boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)', }
    }),
    marginVertical: 15,
  },
  centerContent: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
     padding: 20,
  },
   loadingOverlay: { // For actions within the box
     ...StyleSheet.absoluteFillObject,
     backgroundColor: 'rgba(255, 255, 255, 0.85)',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 10,
     borderRadius: 15,
   },
   loadingOverlayFullScreen: { // For initial load
       ...StyleSheet.absoluteFillObject,
       backgroundColor: 'rgba(244, 247, 252, 0.9)', // Match container background
       justifyContent: 'center',
       alignItems: 'center',
       zIndex: 20,
   },
  title: {
    fontSize: 26, // Slightly larger title
    fontWeight: "700", // Bolder
    color: "#1A253C", // Darker blue/gray
    marginBottom: 25,
    textAlign: "center",
  },
  label: { // For Edit Mode
    fontSize: 14,
    marginTop: 18,
    marginBottom: 7,
    color: "#556078", // Softer gray
    fontWeight: "600",
  },
  input: { // For Edit Mode
    borderWidth: 1,
    borderColor: "#D9E1EC", // Lighter border
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 15 : 13,
    paddingHorizontal: 15,
    backgroundColor: "#F8F9FA",
    fontSize: 16,
    color: "#333C4D",
  },
   disabledInput: {
     backgroundColor: '#E9ECEF',
     borderColor: '#DEE2E6',
   },
  dateButton: { // For Edit Mode
     borderWidth: 1,
     borderColor: "#D9E1EC",
     borderRadius: 10,
     paddingVertical: Platform.OS === "ios" ? 15 : 13,
     paddingHorizontal: 15,
     backgroundColor: "#F8F9FA",
     justifyContent: 'center',
     minHeight: 50,
  },
   dateButtonTextFilled: { fontSize: 16, color: "#333C4D", },
   dateButtonTextPlaceholder: { fontSize: 16, color: "#8A94A6", }, // More subtle placeholder
  pickerContainer: { // For Edit Mode
    borderWidth: 1,
    borderColor: "#D9E1EC",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
  },
   picker: { height: 50, width: "100%", },
   pickerPlaceholderText: { color: "#8A94A6", },

  // --- Button Styles (Shared & Specific) ---
  button: {
    flexDirection: 'row', // Allow icon and text side-by-side
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 13, // Slightly less vertical padding
    paddingHorizontal: 15,
    borderRadius: 10,
    minHeight: 48,
    opacity: 1,
    marginBottom: 15, // Default margin for error buttons
    elevation: 2, // Subtle elevation
    shadowOffset: { width: 0, height: 2 }, // Subtle shadow
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600", // Semi-bold
    fontSize: 16,
    textAlign: 'center',
  },
  buttonIcon: {
      marginRight: 8, // Space between icon and text
  },
   disabledButton: {
     opacity: 0.5,
     elevation: 0, // Remove elevation when disabled
   },
  row: { // For button pairs
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30, // More space above button row
    gap: 15,
  },
  flex: { // To make buttons in a row share space
     flex: 1,
     marginBottom: 0, // Remove default margin for row items
  },
  // Specific Button Colors/Styles
  saveButton: { backgroundColor: "#28A745", shadowColor: "#28A745", }, // Green
  editButton: { backgroundColor: "#007BFF", shadowColor: "#007BFF", }, // Blue
  cancelButton: { backgroundColor: "#6C757D", shadowColor: "#6C757D", }, // Gray
  logoutButton: { backgroundColor: "#DC3545", shadowColor: "#DC3545", }, // Red
  loginButton: { backgroundColor: '#007BFF', shadowColor: "#007BFF", marginTop: 10, width: '100%' }, // Blue
  signupButton: { backgroundColor: '#17A2B8', shadowColor: "#17A2B8", width: '100%' }, // Teal/Info

  // --- Info Display Styles ---
  infoContainer: {
     marginBottom: 30, // Space below info block
     paddingHorizontal: 5, // Slight indent
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12, // Vertical spacing for each row
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF', // Light separator line
  },
  infoIcon: {
      marginRight: 15, // Space between icon and label
      width: 22, // Fixed width for alignment
      textAlign: 'center',
  },
  infoLabel: {
      fontSize: 15,
      color: "#556078", // Softer gray
      fontWeight: "600",
      marginRight: 8,
  },
  infoValue: {
      fontSize: 16,
      color: "#1A253C", // Darker value text
      flexShrink: 1, // Allow text to wrap if needed
      fontWeight: '500',
  },

  // --- Error State Styles ---
  errorContainer: {
      alignItems: 'center',
      width: '95%', // Limit width
      maxWidth: 400, // Max width on larger screens
      padding: 25,
      backgroundColor: '#fff',
      borderRadius: 15,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
  },
  errorText: {
      fontSize: 17, // Larger error text
      color: '#556078', // Use a less alarming color
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
  },
});

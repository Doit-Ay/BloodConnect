// app/Signup.tsx (Password Visibility)
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from "@react-native-picker/picker";
import { DatePickerModal } from "react-native-paper-dates";
import { useRouter } from 'expo-router';
import { useAuth } from '../src/AuthContext'; // Assuming AuthContext is in src/
import { MaterialIcons } from '@expo/vector-icons'; // Import icons

const API_URL = "https://bloodconnect-backend-g2iy.onrender.com"; // TODO: Change for production/deployment

// Picker options (Consider moving to shared constants)
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
const locationOptions = [
  "Chennai", "Delhi", "Mumbai", "Bangalore", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad",
];

// Date Helpers (Consider moving to shared utils)
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


export default function Signup() {
  const router = useRouter();
  const { setUserId } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dobObj, setDobObj] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [location, setLocation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState<Date | undefined>(undefined);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // State for confirm password visibility


    // Keep date picker state in sync with dobObj for initial value
    useEffect(() => {
      setDatePickerDate(dobObj);
    }, [dobObj]);


  const handleSignup = async () => {
    // Keep existing validation
    if (!email.trim() || !password || !confirmPassword || !name || dobObj === undefined || !gender || !phone || !bloodGroup || !location) { Alert.alert('Missing Info', 'All fields are required.'); return; }
    if (password !== confirmPassword) { Alert.alert('Password Mismatch', 'Passwords do not match.'); return; }
    if (!/^\d{10}$/.test(phone)) { Alert.alert('Invalid Phone', 'Phone number must be 10 digits.'); return; }

    setIsLoading(true);
    console.log("Attempting signup for:", email.trim().toLowerCase());
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dob: formatToYYYYMMDD(dobObj), gender, phone, bloodGroup, location, email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { const errorDetail = data.error || data.message || `Signup failed.`; throw new Error(errorDetail); }
      const newUserId = data.userId || data.id;
      if (!newUserId) { throw new Error("Signup successful, but user ID not returned."); }

       console.log("Signup successful. New User ID:", newUserId);
       await setUserId(newUserId);
       console.log("setUserId called after signup.");
       router.replace('/(tabs)'); // Explicit navigation
       console.log("Explicit navigation to '/(tabs)' triggered.");

    } catch (error: any) {
      console.error("Signup Error:", error);
      Alert.alert('Signup Failed', error.message || 'An unexpected error occurred.'); // Keep Alert for signup errors for now
    } finally {
      setIsLoading(false);
      console.log("handleSignup: setIsLoading(false) called.");
    }
  };

   // Date Picker Handlers (keep as is)
   const handleConfirmDate = useCallback(({ date }: { date: Date | undefined }) => { setShowDatePicker(false); if (date) setDobObj(date); setDatePickerDate(undefined); }, []);
   const handleDismissDate = useCallback(() => { setShowDatePicker(false); setDatePickerDate(undefined); }, []);
   const initialDatePickerDate = dobObj instanceof Date ? dobObj : new Date();


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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details to sign up.</Text>

          {/* --- Other Fields (Name, DOB, Gender, etc.) --- Keep as is */}
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
          {/* Email Input */}
           <Text style={styles.label}>Email *</Text>
            <TextInput style={[styles.input, isLoading && styles.disabledInput]} value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" autoComplete="email" editable={!isLoading} />

           {/* Password Input with Visibility Toggle */}
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.input, styles.passwordInput, isLoading && styles.disabledInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    secureTextEntry={!isPasswordVisible} // Toggle based on state
                    textContentType="newPassword" // Use newPassword for signup
                    autoComplete="new-password" // Use new-password for signup
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

           {/* Confirm Password Input with Visibility Toggle */}
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.input, styles.passwordInput, isLoading && styles.disabledInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    secureTextEntry={!isConfirmPasswordVisible} // Toggle based on state
                    textContentType="newPassword"
                    autoComplete="new-password"
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    disabled={isLoading}
                >
                    <MaterialIcons
                        name={isConfirmPasswordVisible ? 'visibility-off' : 'visibility'}
                        size={24}
                        color="#6C757D"
                    />
                </TouchableOpacity>
            </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Link to Login */}
          <TouchableOpacity onPress={() => router.replace('/Login')} disabled={isLoading}>
            <Text style={[styles.toggleText, isLoading && styles.disabledText]}>
              Already have an account? Login Here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal (keep as is) */}
      <DatePickerModal locale="en" mode="single" visible={showDatePicker} onDismiss={handleDismissDate} date={datePickerDate} onConfirm={handleConfirmDate} saveLabel="Confirm" validRange={{ endDate: new Date() }} />
    </KeyboardAvoidingView>
  );
}

// --- Styles --- (Add passwordContainer, passwordInput, eyeIcon styles)
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
    // Add margin bottom if needed, or rely on label's marginTop
    // marginBottom: 15,
  },
  passwordInput: { // Input field adjustments
    flex: 1, // Take up available space
    borderWidth: 0, // Remove individual border
    // Ensure padding is consistent with regular input, but add paddingRight for icon
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    paddingLeft: 12,
    paddingRight: 40, // Space for the icon
    backgroundColor: "transparent", // Ensure background doesn't overlay container border
  },
  eyeIcon: { // Icon positioning
    position: 'absolute',
    right: 0,
    height: '100%', // Make touch target fill height
    width: 40, // Fixed width touch target
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 10, // Alternative to fixed width/height
  },
   disabledInput: {
     backgroundColor: '#E9ECEF',
     borderColor: '#DEE2E6',
   },
  dateButton: {
     borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8,
     paddingVertical: Platform.OS === "ios" ? 12 : 10, paddingHorizontal: 12,
     backgroundColor: "#F8F9FA", justifyContent: 'center',
     minHeight: Platform.OS === 'ios' ? 45 : 50,
  },
   dateButtonTextFilled: { fontSize: 16, color: "#495057", },
   dateButtonTextPlaceholder: { fontSize: 16, color: "#6C757D", },
  pickerContainer: {
    borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8,
    overflow: "hidden", backgroundColor: "#F8F9FA", justifyContent: 'center',
  },
   picker: { height: Platform.OS === 'ios' ? 45 : 50, width: "100%", },
   pickerPlaceholderText: { color: "#6C757D", },
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

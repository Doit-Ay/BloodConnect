import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { Button } from "react-native-paper"; // Assuming react-native-paper is installed
import { DatePickerModal } from "react-native-paper-dates"; // Assuming react-native-paper-dates is installed
import { Dropdown } from "react-native-element-dropdown"; // Assuming react-native-element-dropdown is installed
import { Picker } from "@react-native-picker/picker"; // Import Picker for the form
import { useAuth } from "../../src/AuthContext"; // Adjust path if needed
// Optional: If using icons
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Constants ---
// IMPORTANT: Replace with your actual API URL
const API_URL = "https://bloodconnect-backend-g2iy.onrender.com"; // Or your deployed API endpoint
const cities = [ // Example locations, customize
  "All Locations", // Add an option to view all
  "Chennai",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
];
// Filter out "All Locations" for the creation/edit dropdown
const cityOptionsForForm = cities.filter(city => city !== "All Locations");
const defaultLocation = "All Locations"; // Default filter to showing all

// --- Interfaces ---
interface Camp {
  id: string; // Assuming ID is string from backend JSON
  title: string;
  description: string;
  location: string; // City/Area (from dropdown)
  address: string; // Specific Venue/Street Address (new field)
  date: string; // Keep as YYYY-MM-DD string
  imageUrl: string;
  creatorId: string | null; // Can be null if creator info isn't always available
  createdAt: string; // ISO string format
}

interface DropdownItem {
  label: string;
  value: string;
}

// --- Helper Functions ---
/**
 * Formats a Date object into a 'YYYY-MM-DD' string based on local date components.
 * @param date The Date object to format.
 * @returns The formatted date string or an empty string if date is invalid.
 */
const formatToYYYYMMDD = (date: Date | undefined | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return ''; // Return empty for invalid or null dates
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are 0-indexed, padStart adds leading zero if needed
    const day = date.getDate().toString().padStart(2, '0'); // padStart adds leading zero if needed
    return `${year}-${month}-${day}`;
};

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object.
 * IMPORTANT: This assumes the string represents a local date.
 * Avoids timezone issues inherent in new Date('YYYY-MM-DD').
 * @param dateString The date string in 'YYYY-MM-DD' format.
 * @returns The Date object or null if the string is invalid.
 */
const parseYYYYMMDD = (dateString: string | undefined | null): Date | null => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return null;
    }
    const parts = dateString.split('-');
    // Note: Month is 0-indexed in Date constructor (parts[1] - 1)
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    // Basic validation: Check if the constructed date parts match the input string parts
    // This helps catch invalid dates like '2023-02-30' which Date might interpret differently
    if (date.getFullYear() !== parseInt(parts[0], 10) ||
        date.getMonth() !== parseInt(parts[1], 10) - 1 ||
        date.getDate() !== parseInt(parts[2], 10)) {
        return null; // Invalid date components
    }
    return date;
};


// --- Component ---
const CampsScreen = () => {
  const { userId } = useAuth(); // Get current user ID from context

  // State variables
  const [selectedLocation, setSelectedLocation] = useState<string>(defaultLocation); // For filtering
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [camps, setCamps] = useState<Camp[]>([]); // List of all camps fetched
  const [filteredCamps, setFilteredCamps] = useState<Camp[]>([]); // Camps filtered by location and search
  const [loading, setLoading] = useState(true); // Loading indicator state
  const [isOrganizing, setIsOrganizing] = useState(false); // Toggle for organize form view
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state

  // State for inline editing
  const [editingCampId, setEditingCampId] = useState<string | null>(null);
  // Add 'address' to the editing state type and initialize
  const [editingCampData, setEditingCampData] = useState<Omit<Camp, 'id' | 'creatorId' | 'createdAt'>>({
      title: '', description: '', location: '', address: '', date: '', imageUrl: ''
  });

  // State for the "Organize Camp" form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCampLocation, setNewCampLocation] = useState(""); // City from Dropdown
  const [newCampAddress, setNewCampAddress] = useState(""); // Specific Address from TextInput
  const [newCampDateObj, setNewCampDateObj] = useState<Date | undefined>(undefined); // Store Date object
  const [newImageUrl, setNewImageUrl] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmittingCamp, setIsSubmittingCamp] = useState(false); // Loading state for form submission

  // --- Data Fetching ---
  const fetchCamps = useCallback(async () => {
    if (!refreshing) { setLoading(true); } // Show loading only if not refreshing
    try {
      const response = await fetch(`${API_URL}/camps`);
      if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
      const data: Camp[] = await response.json();
      // Sort camps by date descending (most recent first)
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCamps(data); // Store all fetched camps
    } catch (error) {
      console.error("Failed to fetch camps:", error);
      Alert.alert("Error", "Failed to fetch camps. Please check connection.");
      setCamps([]); // Clear camps on error
    } finally {
      setLoading(false); // Hide loading indicator
      setRefreshing(false); // End pull-to-refresh indicator
    }
  }, [refreshing]); // Dependency: refreshing state

  // Initial fetch on component mount
  useEffect(() => { fetchCamps(); }, [fetchCamps]);

  // --- Filtering Logic ---
  // Filter camps whenever the source list, location filter, or search query changes
  useEffect(() => {
    let result = camps;
    // 1. Filter by Location
    if (selectedLocation !== "All Locations") {
      result = result.filter(camp => camp.location?.toLowerCase() === selectedLocation.toLowerCase());
    }
    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(camp =>
        camp.title?.toLowerCase().includes(lowerCaseQuery) ||
        camp.description?.toLowerCase().includes(lowerCaseQuery) ||
        camp.location?.toLowerCase().includes(lowerCaseQuery) ||
        camp.address?.toLowerCase().includes(lowerCaseQuery) // Include address field in search
      );
    }
    setFilteredCamps(result); // Update the displayed list
  }, [camps, selectedLocation, searchQuery]); // Dependencies

  // --- Handlers ---

  // Handle pull-to-refresh action
  const onRefresh = useCallback(() => { setRefreshing(true); }, []); // fetchCamps runs due to 'refreshing' dependency change

  // Handle confirming a date selection from the modal
  const handleConfirmDate = useCallback(({ date }: { date: Date | undefined }) => {
    setShowDatePicker(false); // Close the date picker modal
    if (date) {
        if (editingCampId) { // If editing an existing camp
            // Update the editing data state with the formatted date string
            setEditingCampData(prev => ({ ...prev, date: formatToYYYYMMDD(date) }));
        } else { // If creating a new camp
            // Update the state holding the Date object for the new camp form
            setNewCampDateObj(date);
        }
    }
  }, [editingCampId]); // Dependency: editingCampId

  // Format date (string or Date object) for user-friendly display
  const formatDateForDisplay = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return "N/A"; // Handle null/undefined input
    try {
        // Parse string or use Date object directly
        const dateObj = typeof dateInput === 'string' ? parseYYYYMMDD(dateInput) : dateInput;
        if (!dateObj) return "Invalid Date"; // Handle parsing failure
        // Format the date (e.g., "April 28, 2025")
        return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", e);
        // Fallback display
        return typeof dateInput === 'string' ? dateInput : 'Invalid Date';
    }
  };

  // Initiate the editing process for a specific camp
  const handleStartEdit = (camp: Camp) => {
    setEditingCampId(camp.id); // Set the ID of the camp being edited
    // Pre-fill the editing form state with the camp's current data
    setEditingCampData({
      title: camp.title,
      description: camp.description,
      location: camp.location, // City
      address: camp.address, // Specific Address
      date: camp.date, // Store as YYYY-MM-DD string
      imageUrl: camp.imageUrl,
    });
    setIsOrganizing(false); // Ensure the "Organize Camp" form is hidden
  };

  // Cancel the editing process
  const handleCancelEdit = () => {
    setEditingCampId(null); // Clear the editing ID
    // Reset the editing form data state
    setEditingCampData({ title: '', description: '', location: '', address: '', date: '', imageUrl: '' });
  };

  // Save the updated camp details
  const handleSaveUpdate = async () => {
    if (!editingCampId || !editingCampData) return; // Exit if no camp is being edited

    // Validate required fields including the new address field
    if (!parseYYYYMMDD(editingCampData.date)) { Alert.alert("Invalid Date", "Please select a valid date."); return; }
    if (!editingCampData.title?.trim() || !editingCampData.description?.trim() || !editingCampData.location?.trim() || !editingCampData.address?.trim() || !editingCampData.imageUrl?.trim()) {
      Alert.alert("Missing Information", "Please ensure all fields are filled."); return;
    }

    setIsSubmittingCamp(true); // Show loading indicator
    try {
      // Send PUT request to update the camp
      const response = await fetch(`${API_URL}/camps/${editingCampId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ // Send all editable fields
            title: editingCampData.title.trim(),
            description: editingCampData.description.trim(),
            location: editingCampData.location.trim(), // City
            address: editingCampData.address.trim(), // Specific Address
            date: editingCampData.date.trim(), // YYYY-MM-DD string
            imageUrl: editingCampData.imageUrl.trim(),
        }),
      });
      if (!response.ok) { throw new Error('Update failed'); } // Check for network/server errors
      Alert.alert("Success", "Camp updated successfully!");
      handleCancelEdit(); // Exit edit mode
      fetchCamps(); // Refresh the list
    } catch (error: any) {
      Alert.alert("Update Failed", `Could not update camp. ${error.message || ''}`);
    } finally {
        setIsSubmittingCamp(false); // Hide loading indicator
    }
  };

  // Delete a camp after confirmation
  const handleDeleteCamp = async (campId: string) => {
    // Show confirmation dialog
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this camp? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" }, // Cancel button
        {
          text: "Delete", // Delete button
          style: "destructive",
          onPress: async () => { // Action on pressing Delete
            try {
              // Send DELETE request
              const response = await fetch(`${API_URL}/camps/${campId}`, { method: "DELETE" });
              if (!response.ok) { throw new Error('Delete failed'); } // Check for errors
              Alert.alert("Success", "Camp deleted successfully!");
              fetchCamps(); // Refresh the list
            } catch (error: any) {
              Alert.alert("Deletion Failed", error.message || 'Could not delete camp.');
            }
          },
        },
      ]
    );
  };

  // Submit the new camp form
  const handleSubmitNewCamp = async () => {
    // Format the selected date object to YYYY-MM-DD string
    const formattedDate = formatToYYYYMMDD(newCampDateObj);

    // Validate all required fields, including the new address field
    if (!newTitle.trim() || !newDescription.trim() || !newCampLocation || !newCampAddress.trim() || !formattedDate || !newImageUrl.trim()) {
      Alert.alert("Missing Information", "Please fill all required fields (*)."); return;
    }
    // Ensure user is logged in before allowing submission
    if (!userId) {
        Alert.alert("Login Required", "Please log in to organize a camp."); return;
    }

    setIsSubmittingCamp(true); // Show loading indicator
    try {
      // Send POST request to create the new camp
      const response = await fetch(`${API_URL}/camps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          location: newCampLocation, // City from dropdown
          address: newCampAddress.trim(), // Specific address from input
          date: formattedDate, // Formatted date string
          imageUrl: newImageUrl.trim(),
          creatorId: userId, // Associate camp with the logged-in user
          createdAt: new Date().toISOString(), // Timestamp
        }),
      });
      if (!response.ok) { throw new Error('Failed to create camp'); } // Check for errors
      Alert.alert("Success", "Camp organized successfully!");
      // Reset form fields and switch back to list view
      setNewTitle(""); setNewDescription(""); setNewCampLocation(""); setNewCampAddress(""); setNewCampDateObj(undefined); setNewImageUrl("");
      setIsOrganizing(false); // Hide the form
      fetchCamps(); // Refresh the list
    } catch (error: any) {
      Alert.alert("Submission Failed", `Could not organize camp. ${error.message || ''}`);
    } finally {
        setIsSubmittingCamp(false); // Hide loading indicator
    }
  };


  // --- Render Functions ---

  // Render function for each camp item in the FlatList
  const renderCampItem = ({ item }: { item: Camp }) => {
    // Check if the current logged-in user is the creator of this camp
    const isCreator = item.creatorId?.toString() === userId?.toString();
    // Check if this specific camp is currently being edited
    const isEditingThis = editingCampId === item.id;

    return (
      <View style={styles.card}>
        {/* Camp Image */}
        <Image
            source={{ uri: item.imageUrl || 'https://placehold.co/600x300/E63946/white?text=Camp+Image' }}
            style={styles.cardImage}
            resizeMode="cover"
            // Optional: Add error handling for image loading
            // onError={(e) => console.log("Error loading camp image:", e.nativeEvent.error)}
        />
        {/* Container for card content (details or edit form) */}
        <View style={styles.cardContent}>
          {isEditingThis ? (
            // --- Edit Form View ---
            <View>
                <Text style={styles.editHeader}>Edit Camp Details</Text>
                {/* Title Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Camp Title *</Text>
                    <TextInput style={styles.input} value={editingCampData.title} onChangeText={(text) => setEditingCampData(prev => ({ ...prev, title: text }))} placeholder="Camp Title" placeholderTextColor="#aaa"/>
                </View>
                {/* Description Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description *</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={editingCampData.description} onChangeText={(text) => setEditingCampData(prev => ({ ...prev, description: text }))} placeholder="Description" placeholderTextColor="#aaa" multiline/>
                </View>
                {/* Location (City) Dropdown */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location (City) *</Text>
                     <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={editingCampData.location}
                            onValueChange={(itemValue) => setEditingCampData(prev => ({ ...prev, location: itemValue }))}
                            style={styles.picker}
                            dropdownIconColor="#003049"
                        >
                            <Picker.Item label="-- Select City --" value="" style={styles.pickerPlaceholder} />
                            {cityOptionsForForm.map((city) => ( // Use filtered city list
                                <Picker.Item key={city} label={city} value={city} style={styles.pickerItem} />
                            ))}
                        </Picker>
                    </View>
                </View>
                {/* Address Input */}
                 <View style={styles.inputGroup}>
                    <Text style={styles.label}>Venue/Address Details *</Text>
                    <TextInput style={styles.input} value={editingCampData.address} onChangeText={(text) => setEditingCampData(prev => ({ ...prev, address: text }))} placeholder="e.g., Community Hall, 123 Main St" placeholderTextColor="#aaa"/>
                </View>
                {/* Date Picker Button */}
                <View style={styles.inputGroup}>
                     <Text style={styles.label}>Date *</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>
                            {/* Display formatted date from the YYYY-MM-DD string */}
                            {editingCampData.date ? ` Date: ${formatDateForDisplay(editingCampData.date)}` : " Select Camp Date"}
                        </Text>
                    </TouchableOpacity>
                </View>
                {/* Image URL Input */}
                 <View style={styles.inputGroup}>
                    <Text style={styles.label}>Image URL *</Text>
                    <TextInput style={styles.input} value={editingCampData.imageUrl} onChangeText={(text) => setEditingCampData(prev => ({ ...prev, imageUrl: text }))} placeholder="Image URL" placeholderTextColor="#aaa" keyboardType="url" autoCapitalize="none"/>
                 </View>
                 {/* Save/Cancel Buttons */}
                <View style={styles.editActions}>
                    <Button mode="contained" onPress={handleSaveUpdate} style={[styles.actionButton, styles.saveButton]} labelStyle={styles.actionButtonText} disabled={isSubmittingCamp} loading={isSubmittingCamp}>Save Changes</Button>
                    <Button mode="outlined" onPress={handleCancelEdit} style={[styles.actionButton, styles.cancelButton]} labelStyle={styles.cancelButtonText} disabled={isSubmittingCamp}>Cancel</Button>
                </View>
            </View>
          ) : (
            // --- Camp Details View ---
            <>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {/* Display Location (City) */}
              <View style={styles.infoRow}>
                  {/* <Icon name="map-marker-outline" size={16} color="#555" style={styles.infoIcon} /> */}
                  <Text style={styles.cardInfo}><Text style={styles.infoLabel}>City:</Text> {item.location}</Text>
              </View>
              {/* Display Specific Address */}
              <View style={styles.infoRow}>
                   {/* <Icon name="office-building-marker-outline" size={16} color="#555" style={styles.infoIcon} /> */}
                  <Text style={styles.cardInfo}><Text style={styles.infoLabel}>Venue:</Text> {item.address}</Text>
              </View>
              {/* Display Formatted Date */}
               <View style={styles.infoRow}>
                  {/* <Icon name="calendar-range" size={16} color="#555" style={styles.infoIcon} /> */}
                  <Text style={styles.cardInfo}><Text style={styles.infoLabel}>Date:</Text> {formatDateForDisplay(item.date)}</Text>
              </View>
              {/* Display Description */}
              <Text style={styles.cardDescription}>{item.description}</Text>
              {/* Show Edit/Delete Buttons only if the user is the creator */}
              {isCreator && (
                <View style={styles.creatorActions}>
                  {/* Edit Button */}
                  <TouchableOpacity onPress={() => handleStartEdit(item)} style={[styles.creatorButton, styles.editButton]}>
                      {/* <Icon name="pencil-outline" size={18} color="#0077B6" /> */}
                      <Text style={[styles.creatorButtonText, styles.editText]}>Edit</Text>
                  </TouchableOpacity>
                  {/* Delete Button */}
                  <TouchableOpacity onPress={() => handleDeleteCamp(item.id)} style={[styles.creatorButton, styles.deleteButton]}>
                      {/* <Icon name="delete-outline" size={18} color="#D62828" /> */}
                      <Text style={[styles.creatorButtonText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };


  // --- Main Render ---
  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.container}>
         {/* Header Section */}
         <View style={styles.headerContainer}>
             <Text style={styles.headerTitle}>Blood Donation Camps</Text>
             {/* Filter Controls */}
             <View style={styles.filterControls}>
                 {/* Location Filter Dropdown */}
                 <View style={styles.dropdownWrapper}>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.dropdownPlaceholder}
                        selectedTextStyle={styles.dropdownSelectedText}
                        inputSearchStyle={styles.dropdownInputSearch}
                        iconStyle={styles.dropdownIcon}
                        containerStyle={styles.dropdownContainer}
                        itemTextStyle={styles.dropdownItemText}
                        data={cities.map(city => ({ label: city, value: city }))} // Use 'cities' for filtering options
                        search maxHeight={300} labelField="label" valueField="value"
                        placeholder='Filter by City' searchPlaceholder="Search city..."
                        value={selectedLocation} onChange={(item: { value: React.SetStateAction<string>; }) => { setSelectedLocation(item.value); }}
                    />
                 </View>
                 {/* Search Text Input */}
                 <View style={styles.searchWrapper}>
                    <TextInput
                        style={styles.searchInput} placeholder="Search title, city, venue..." // Updated placeholder
                        placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                 </View>
             </View>
             {/* Organize Camp Button (Show only when not organizing) */}
             {!isOrganizing && (
                 <TouchableOpacity
                    style={[styles.organizeButton, !userId && styles.disabledButton]} // Apply disabled style if not logged in
                    onPress={() => {
                        // Check if user is logged in before allowing access to form
                        if (!userId) {
                            Alert.alert("Login Required", "Please log in via the Profile tab to organize a camp.");
                        } else {
                            setIsOrganizing(true); // Show the form
                            handleCancelEdit(); // Ensure edit mode is off if user was editing before
                        }
                    }}
                    disabled={!userId} // Disable the button itself if not logged in
                 >
                    {/* Optional Icon */}
                    {/* <Icon name="plus-circle-outline" size={20} color={!userId ? '#aaa' : "#fff"} style={{marginRight: 8}} /> */}
                    <Text style={[styles.organizeButtonText, !userId && styles.disabledButtonText]}>
                        {/* Change button text based on login status */}
                        {userId ? "Organize a New Camp" : "Login to Organize"}
                    </Text>
                 </TouchableOpacity>
             )}
         </View>

        {/* Content Area: Switches between Form and List */}
        {isOrganizing ? (
          // --- Organize Camp Form View ---
          <ScrollView contentContainerStyle={styles.formScrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.formHeader}>Organize a New Camp</Text>
            <Text style={styles.formSubheader}>Provide details about the upcoming donation camp.</Text>
            {/* Title Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Camp Title *</Text>
                <TextInput style={styles.input} placeholder="e.g., Annual Blood Drive" placeholderTextColor="#aaa" value={newTitle} onChangeText={setNewTitle} />
            </View>
            {/* Description Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Details about the event, timings, requirements..." placeholderTextColor="#aaa" value={newDescription} onChangeText={setNewDescription} multiline />
            </View>
            {/* Location (City) Dropdown */}
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Location (City) *</Text>
                 <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={newCampLocation}
                        onValueChange={(itemValue) => setNewCampLocation(itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#003049"
                    >
                        <Picker.Item label="-- Select City --" value="" style={styles.pickerPlaceholder} />
                        {/* Use filtered city list for options */}
                        {cityOptionsForForm.map((city) => (
                            <Picker.Item key={city} label={city} value={city} style={styles.pickerItem} />
                        ))}
                    </Picker>
                </View>
            </View>
            {/* Address Input */}
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Venue/Address Details *</Text>
                <TextInput style={styles.input} placeholder="e.g., Community Hall, 123 Main St" placeholderTextColor="#aaa" value={newCampAddress} onChangeText={setNewCampAddress} />
            </View>
            {/* Date Picker Button */}
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Date *</Text>
                 <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    {/* Optional Icon */}
                    {/* <Icon name="calendar" size={20} color="#003049" style={{marginRight: 10}}/> */}
                    <Text style={styles.dateButtonText}>
                        {/* Display formatted date from the Date object */}
                        {newCampDateObj ? formatDateForDisplay(newCampDateObj) : "Select Camp Date"}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Image URL Input */}
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Image URL *</Text>
                <TextInput style={styles.input} placeholder="https://example.com/image.jpg" placeholderTextColor="#aaa" value={newImageUrl} onChangeText={setNewImageUrl} keyboardType="url" autoCapitalize="none"/>
            </View>
            {/* Submit/Cancel Buttons */}
            <TouchableOpacity style={[styles.submitButton, isSubmittingCamp && styles.submitButtonDisabled]} onPress={handleSubmitNewCamp} disabled={isSubmittingCamp}>
                 {isSubmittingCamp ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Camp</Text>}
            </TouchableOpacity>
             <TouchableOpacity style={[styles.cancelFormButton]} onPress={() => setIsOrganizing(false)} disabled={isSubmittingCamp}>
                 <Text style={styles.cancelFormButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          // --- Camps List View ---
          loading ? ( // Show loading indicator while fetching
            <View style={styles.centerMessageContainer}><ActivityIndicator size="large" color="#D62828" /></View>
          ) : ( // Show list once loaded
            <FlatList
              data={filteredCamps} // Display the filtered list
              renderItem={renderCampItem} // Function to render each camp card
              keyExtractor={(item) => item.id.toString()} // Unique key for list items
              contentContainerStyle={styles.listContentContainer} // Padding for the list
              showsVerticalScrollIndicator={false} // Hide scrollbar
              // Component shown when the list is empty
              ListEmptyComponent={
                <View style={styles.centerMessageContainer}>
                    {/* Optional Icon */}
                    {/* <Icon name="calendar-remove-outline" size={40} color="#6c757d" style={{marginBottom: 15}}/> */}
                    <Text style={styles.centerMessageText}>
                        {/* Dynamic empty message based on filters */}
                        {searchQuery ? `No camps found matching "${searchQuery}" in ${selectedLocation}.` : `No camps found in ${selectedLocation}.`}
                    </Text>
                    {/* Button to clear location filter if active */}
                    {selectedLocation !== "All Locations" && (
                        <Button mode="text" onPress={() => setSelectedLocation("All Locations")} style={{marginTop: 10}}>
                            Show All Locations
                        </Button>
                    )}
                </View>
              }
              // Enable pull-to-refresh functionality
              refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D62828"]} tintColor={"#D62828"}/> }
            />
          )
        )}

        {/* Date Picker Modal (used for both new and editing) */}
        <DatePickerModal
          locale="en-GB" // Adjust locale (e.g., 'en-US') if needed
          mode="single" // Select single date
          visible={showDatePicker} // Control visibility with state
          onDismiss={() => setShowDatePicker(false)} // Action when dismissing modal
          // Set initial date based on whether editing or creating
          date={editingCampId ? parseYYYYMMDD(editingCampData.date) ?? new Date() : newCampDateObj ?? new Date()}
          onConfirm={handleConfirmDate} // Callback when date is confirmed
          saveLabel="Confirm" // Customize confirm button text
          // Optional: Prevent selecting dates in the past
          validRange={{ startDate: new Date() }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

// --- Styles ---
// Includes styles for Picker container and items
const styles = StyleSheet.create({
 // --- Containers ---
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerContainer: { padding: 15, paddingTop: Platform.OS === 'ios' ? 20 : 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#003049', textAlign: 'center', marginBottom: 15 },
  filterControls: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  dropdownWrapper: { flex: 1, marginRight: 10 },
  searchWrapper: { flex: 1 },
  listContentContainer: { padding: 15, paddingBottom: 30 },
  formScrollContainer: { padding: 20, paddingBottom: 40 },
  // --- Centered Messages ---
  centerMessageContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, marginTop: 50 },
  centerMessageText: { fontSize: 16, color: "#6c757d", textAlign: "center", lineHeight: 24 },
  // --- Dropdown Styles ---
  dropdown: { height: 50, backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ced4da' },
  dropdownPlaceholder: { fontSize: 15, color: '#6c757d' },
  dropdownSelectedText: { fontSize: 15, color: '#003049' },
  dropdownIcon: { width: 20, height: 20 },
  dropdownContainer: { borderRadius: 8, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  dropdownItemText: { fontSize: 15, color: '#343a40', padding: 12 },
  dropdownInputSearch: { height: 40, fontSize: 15, borderRadius: 6, borderColor: '#ced4da', paddingHorizontal: 10 },
  // --- Search Input ---
  searchInput: { height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, fontSize: 15, borderWidth: 1, borderColor: '#ced4da', color: '#343a40' },
  // --- Buttons ---
   organizeButton: { backgroundColor: "#0077B6", paddingVertical: 12, borderRadius: 8, alignItems: "center", justifyContent: 'center', flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
   organizeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
   disabledButton: { backgroundColor: '#adb5bd' }, // Style for disabled organize button
   disabledButtonText: { color: '#e9ecef' },
   submitButton: { backgroundColor: "#2a9d8f", paddingVertical: 15, borderRadius: 8, alignItems: "center", justifyContent: 'center', marginTop: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
   submitButtonDisabled: { backgroundColor: '#adb5bd', elevation: 0 },
   submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
   cancelFormButton: { backgroundColor: "transparent", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: '#6c757d' },
   cancelFormButtonText: { color: "#6c757d", fontSize: 16, fontWeight: "500" },
   actionButton: { flex: 1, marginHorizontal: 5, marginTop: 10 },
   actionButtonText: { fontWeight: 'bold', fontSize: 14 },
   saveButton: { backgroundColor: '#2a9d8f' },
   cancelButton: { borderColor: '#6c757d' },
   cancelButtonText: { color: '#6c757d', fontWeight: 'bold', fontSize: 14 },
   creatorButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1 },
   creatorButtonText: { marginLeft: 5, fontSize: 14, fontWeight: '500' },
   editButton: { borderColor: '#0077B6' },
   editText: { color: '#0077B6' },
   deleteButton: { borderColor: '#D62828' },
   deleteText: { color: '#D62828' },
  // --- Form Styles ---
  formHeader: { fontSize: 22, fontWeight: 'bold', color: '#003049', marginBottom: 8, textAlign: 'center' },
  formSubheader: { fontSize: 14, color: '#6c757d', marginBottom: 25, textAlign: 'center' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 15, color: '#495057', marginBottom: 7, fontWeight: '600' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: "#ced4da", borderRadius: 8, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 16, color: '#343a40' },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  pickerContainer: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, overflow: 'hidden' }, // Added Picker container
  picker: { height: 55, width: '100%', color: '#333', backgroundColor: 'transparent' }, // Styles for Picker itself
  pickerPlaceholder: { color: '#999', fontSize: 16 },
  pickerItem: { fontSize: 16, color: '#333' },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: "#ced4da", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 15, minHeight: 53 },
  dateButtonText: { fontSize: 16, color: '#495057' },
  editHeader: { fontSize: 18, fontWeight: 'bold', color: '#003049', marginBottom: 15, textAlign: 'center' },
  editActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  // --- Camp Card Styles ---
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  cardImage: { width: "100%", height: 180, backgroundColor: '#e9ecef' },
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#E63946", marginBottom: 8 },
  cardDescription: { fontSize: 15, color: "#495057", lineHeight: 22, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoIcon: { marginRight: 6 },
  cardInfo: { fontSize: 14, color: "#343a40" },
  infoLabel: { fontWeight: '600' },
  creatorActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee', gap: 10 },
});

export default CampsScreen;

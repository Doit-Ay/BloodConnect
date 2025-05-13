// components/ConfirmationModal.tsx
import React from 'react';
import { Modal, View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';

interface ConfirmationModalProps {
  visible: boolean; // State to control modal visibility
  title: string; // Title of the confirmation
  message: string; // Message of the confirmation
  onConfirm: () => void; // Function to call when confirmed
  onCancel: () => void; // Function to call when cancelled
  confirmText?: string; // Text for the confirm button (default: "Confirm")
  cancelText?: string; // Text for the cancel button (default: "Cancel")
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  return (
    <Modal
      transparent={true} // Allows background content to be seen
      animationType="fade" // Fade in/out animation
      visible={visible}
      onRequestClose={onCancel} // Handle hardware back button on Android
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent dark background
  },
  alertBox: {
    width: '80%', // Make the modal responsive
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 10, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out the buttons
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100, // Give buttons a minimum width
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc', // Grey color for cancel
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#DC3545', // Red color for destructive action (logout)
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ConfirmationModal;

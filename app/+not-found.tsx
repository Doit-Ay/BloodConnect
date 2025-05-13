import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from "react-native";
import { useNavigation } from "expo-router";
import { useEffect, useRef } from "react";

export default function NotFoundScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Error Image */}
      <Image source={{ uri: "https://img.freepik.com/premium-vector/exclamation-icon-vector-design-style-template_1048910-178.jpg" }} style={styles.image} />

      <Text style={styles.title}>Oops! Page Not Found</Text>
      <Text style={styles.subtitle}>The page you are looking for doesn’t exist.</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("(tabs)" as never)}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  image: {
    width: 250,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E63946",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#E63946",
    padding: 15,
    width: "80%",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

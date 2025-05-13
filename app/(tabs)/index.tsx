// app/(tabs)/index.tsx (Carousel Removed & Enhanced UI)

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  // FlatList removed
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';

// const { width: screenWidth } = Dimensions.get('window'); // No longer needed for carousel

// --- Removed Carousel Data ---

// --- Component ---
function Home() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  // Staggered animation values for cards (Adjust count if needed, assuming 4 cards now)
  const cardCount = 4; // Number of cards to animate
  const cardAnims = useRef(Array(cardCount).fill(null).map(() => new Animated.Value(0))).current; // Opacity for cards
  const cardSlideAnims = useRef(Array(cardCount).fill(null).map(() => new Animated.Value(20))).current; // Slide for cards

  // --- Removed Carousel State and Refs ---
  // const [activeIndex, setActiveIndex] = useState(0);
  // const flatListRef = useRef<FlatList>(null);
  // const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start animations on component mount
  useEffect(() => {
    const initialAnimation = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]);

    // Staggered animations for cards
    const cardAnimations = cardAnims.map((anim, index) =>
        Animated.sequence([
            Animated.delay(300 + index * 150), // Stagger delay starts after initial animation might finish
            Animated.parallel([
                 Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
                 Animated.timing(cardSlideAnims[index], { toValue: 0, duration: 400, useNativeDriver: true })
            ])
        ])
    );

    // Run initial animation, then stagger card animations
    Animated.sequence([
        initialAnimation,
        Animated.stagger(150, cardAnimations) // Stagger the start of each card animation
    ]).start();

  }, [fadeAnim, slideUpAnim, cardAnims, cardSlideAnims]); // Dependencies remain

  // --- Removed Carousel Logic ---

  // --- Navigation Handlers ---
  const handleNavigateToCamps = () => { router.push("/Camps"); };
  const handleNavigateToRequest = () => { router.push("/RequestBlood"); };
  const handleNavigateToExplore = () => { router.push("/Explore"); };


  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Apply fade animation to the entire container */}
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

          {/* --- Header Section (Animated) --- */}
          <Animated.View style={[styles.headerSection, { transform: [{ translateY: slideUpAnim }] }]}>
              <Image
                source={{ uri: "https://static.vecteezy.com/system/resources/previews/008/801/896/large_2x/blood-icon-blood-drop-design-illustration-red-blood-icon-simple-sign-free-vector.jpg" }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>BloodConnect</Text>
              <Text style={styles.subtitle}>
                Connecting Donors, Saving Lives. Be a Hero Today.
              </Text>
          </Animated.View>

          {/* --- Removed Image Carousel Section --- */}

          {/* --- Main Action Buttons (Animated) --- */}
          <Animated.View style={[styles.actionRow, { transform: [{ translateY: slideUpAnim }] }]}>
            <TouchableOpacity style={[styles.actionButton, styles.requestButton]} onPress={handleNavigateToRequest} activeOpacity={0.7}>
              <MaterialIcons name="bloodtype" size={22} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Request Blood</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.campsButton]} onPress={handleNavigateToCamps} activeOpacity={0.7}>
              <MaterialIcons name="location-pin" size={22} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Find Camps</Text>
            </TouchableOpacity>
          </Animated.View>

           {/* --- Quick Info / Learn More Card (Stagger Animated - Index 0) --- */}
           <Animated.View style={{ opacity: cardAnims[0], transform: [{ translateY: cardSlideAnims[0] }], width: '100%' }}>
             <TouchableOpacity style={styles.card} onPress={handleNavigateToExplore} activeOpacity={0.8}>
               <View style={styles.cardHeaderRow}>
                    <MaterialIcons name="explore" size={24} color="#0077B6" style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>Learn & Explore</Text>
               </View>
                 <Text style={styles.cardText}>
                   Discover the importance of blood donation, check eligibility requirements, and learn how the process works. Your contribution matters!
                 </Text>
                 <Image source={{ uri: "https://obi.org/site/assets/files/10125/blood_donation_generic_feature_image-1.jpg" }} style={styles.cardImage} resizeMode="cover" />
                 <View style={styles.cardLinkContainer}>
                    <Text style={styles.cardLinkText}>Tap to Explore</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#0077B6" />
                 </View>
             </TouchableOpacity>
            </Animated.View>

          {/* --- Quick Facts Card (Stagger Animated - Index 1) --- */}
          <Animated.View style={{ opacity: cardAnims[1], transform: [{ translateY: cardSlideAnims[1] }], width: '100%' }}>
             <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <MaterialIcons name="lightbulb" size={24} color="#FCBF49" style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>Did You Know?</Text>
                </View>
                <View style={styles.factItem}><MaterialIcons name="chevron-right" size={18} color="#556078" style={styles.factIcon} /><Text style={styles.factText}>Someone needs blood approximately every <Text style={styles.boldText}>2 seconds</Text>.</Text></View>
                 <View style={styles.factItem}><MaterialIcons name="chevron-right" size={18} color="#556078" style={styles.factIcon} /><Text style={styles.factText}>Only about <Text style={styles.boldText}>3%</Text> of eligible people donate blood yearly.</Text></View>
                 <View style={styles.factItem}><MaterialIcons name="chevron-right" size={18} color="#556078" style={styles.factIcon} /><Text style={styles.factText}>Your body replaces the donated plasma in about <Text style={styles.boldText}>24 hours</Text>.</Text></View>
                 <View style={styles.factItem}><MaterialIcons name="chevron-right" size={18} color="#556078" style={styles.factIcon} /><Text style={styles.factText}>O-negative blood is the <Text style={styles.boldText}>universal red cell donor</Text>.</Text></View>
            </View>
           </Animated.View>


          {/* --- Impact Stats Card (Stagger Animated - Index 2) --- */}
          <Animated.View style={{ opacity: cardAnims[2], transform: [{ translateY: cardSlideAnims[2] }], width: '100%' }}>
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <MaterialIcons name="show-chart" size={24} color="#2a9d8f" style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>Donation Impact</Text>
                </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}><MaterialIcons name="favorite" size={30} color="#E63946" /><Text style={styles.statNumber}>3</Text><Text style={styles.statLabel}>Lives Saved</Text><Text style={styles.statSubLabel}>per donation</Text></View>
                <View style={styles.statBox}><MaterialIcons name="group" size={30} color="#0077B6" /><Text style={styles.statNumber}>8M+</Text><Text style={styles.statLabel}>Units Needed</Text><Text style={styles.statSubLabel}>yearly in India</Text></View>
                <View style={styles.statBox}><MaterialIcons name="timer" size={30} color="#F77F00" /><Text style={styles.statNumber}>~10 min</Text><Text style={styles.statLabel}>Donation Time</Text><Text style={styles.statSubLabel}>(the actual draw)</Text></View>
              </View>
            </View>
          </Animated.View>

          {/* --- Testimonial Card (Stagger Animated - Index 3) --- */}
           <Animated.View style={{ opacity: cardAnims[3], transform: [{ translateY: cardSlideAnims[3] }], width: '100%' }}>
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <MaterialIcons name="comment" size={24} color="#6a0dad" style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>Voices of Impact</Text>
                </View>
              <View style={styles.testimonialItem}><MaterialIcons name="format-quote" size={20} color="#ccc" style={styles.quoteIconStart} /><Text style={styles.testimonialText}>Donating blood was simple and quick. Knowing I helped someone makes it incredibly rewarding.</Text><MaterialIcons name="format-quote" size={20} color="#ccc" style={styles.quoteIconEnd} /><Text style={styles.testimonialAuthor}>— Priya S., First-time Donor</Text></View>
              <View style={styles.testimonialItem}><MaterialIcons name="format-quote" size={20} color="#ccc" style={styles.quoteIconStart} /><Text style={styles.testimonialText}>My daughter needed an urgent transfusion. Thanks to generous donors, she's healthy today. Forever grateful!</Text><MaterialIcons name="format-quote" size={20} color="#ccc" style={styles.quoteIconEnd} /><Text style={styles.testimonialAuthor}>— Amit V., Recipient's Parent</Text></View>
            </View>
           </Animated.View>

          {/* Footer Text */}
          <Text style={styles.footerText}>Join the community. Save lives.</Text>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
// (Styles remain largely the same, but removed carousel-specific styles)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: 50,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
  },
  headerSection: {
      alignItems: 'center',
      marginBottom: 30, // Adjusted margin after removing carousel
      width: '100%',
  },
  logo: { width: 90, height: 90, marginBottom: 10, },
  title: { fontSize: 30, fontWeight: "700", color: "#1A253C", marginBottom: 8, textAlign: 'center', },
  subtitle: { fontSize: 16, color: "#556078", textAlign: "center", paddingHorizontal: 20, lineHeight: 23, },
  // --- Removed Carousel Styles ---
  actionRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 30, paddingHorizontal: 5, gap: 15, },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: "center", justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 12, borderRadius: 10, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, },
  requestButton: { backgroundColor: "#D62828", shadowColor: "#D62828", },
  campsButton: { backgroundColor: "#0077B6", shadowColor: "#0077B6", },
  actionButtonText: { color: "#fff", fontSize: 15, fontWeight: "600", textAlign: 'center', },
  buttonIcon: { marginRight: 8, },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 18, width: "100%", marginBottom: 20, elevation: 2, shadowColor: "#999", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 4, borderWidth: 1, borderColor: '#E9ECEF', },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F3F5', },
  cardIcon: { marginRight: 10, },
  cardTitle: { fontSize: 19, fontWeight: "600", color: "#003049", },
  cardText: { fontSize: 15, color: "#495057", lineHeight: 23, marginBottom: 15, },
  cardImage: { width: "100%", height: 150, borderRadius: 8, marginBottom: 15, backgroundColor: '#e9ecef', },
  cardLinkContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 5, },
  cardLinkText: { fontSize: 14, color: '#0077B6', fontWeight: '600', marginRight: 4, },
  factItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, },
  factIcon: { marginRight: 8, marginTop: 3, color: '#0077B6', },
  factText: { flex: 1, fontSize: 15, color: '#495057', lineHeight: 22, },
  boldText: { fontWeight: 'bold', color: '#1A253C', },
  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: 'center', marginTop: 15, },
  statBox: { alignItems: "center", flex: 1, paddingHorizontal: 5, },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#D62828", marginBottom: 3, marginTop: 5, },
  statLabel: { fontSize: 13, color: "#343a40", fontWeight: '600', textAlign: 'center', },
  statSubLabel: { fontSize: 11, color: "#6c757d", textAlign: 'center', marginTop: 2, },
  testimonialItem: { marginBottom: 18, paddingTop: 5, paddingLeft: 10, },
  quoteIconStart: { position: 'absolute', left: -5, top: 0, opacity: 0.6, },
  quoteIconEnd: { alignSelf: 'flex-end', opacity: 0.6, marginTop: -5, marginRight: 10, },
  testimonialText: { fontSize: 15, color: "#495057", fontStyle: "italic", lineHeight: 22, textAlign: 'center', paddingHorizontal: 10, },
  testimonialAuthor: { fontSize: 13, color: "#6c757d", textAlign: "center", fontWeight: '500', marginTop: 8, },
  footerText: { fontSize: 14, color: "#6c757d", textAlign: "center", marginTop: 25, marginBottom: 15, },
});

export default Home;

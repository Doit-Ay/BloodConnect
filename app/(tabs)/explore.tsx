// app/(tabs)/Explore.tsx (Fixed Conditional Scrolling & Expanded FAQ)
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
  Keyboard,
  Linking,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Alert,
  findNodeHandle,
  NativeSyntheticEvent, // Import event type
  NativeScrollEvent,  // Import event type
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Data & Types ---

interface MessageType {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'typing';
  actions?: ActionButton[];
}

interface ActionButton {
  text: string;
  type: 'navigate' | 'link';
  payload: string; 
}

interface FaqItem {
    keywords: string[];
    answer: string;
    actions?: ActionButton[];
}


const faqData: FaqItem[] = [
  // --- Basic Concepts ---
  { keywords: ["what is blood", "define blood", "blood purpose", "function of blood"], answer: "Blood is a vital fluid circulating in our bodies. It carries oxygen and nutrients to all parts of the body, takes away waste products, helps fight infections, and regulates body temperature. It's made of plasma, red blood cells, white blood cells, and platelets.", },
  { keywords: ["blood components", "parts of blood", "plasma", "red cells", "white cells", "platelets"], answer: "Blood has four main parts: Plasma (the liquid part, carries cells/proteins), Red Blood Cells (carry oxygen), White Blood Cells (fight infection), and Platelets (help blood clot).", },
  { keywords: ["why donate", "importance", "need for blood", "save lives", "impact"], answer: "Donated blood is essential for treating patients with injuries, surgeries, cancer, anemia, childbirth complications, and many other conditions. There's no substitute for human blood, so volunteer donors are crucial! One donation can help save up to three lives.", },
  { keywords: ["blood volume", "how much blood", "body blood", "total blood"], answer: "The average adult has about 4.5 to 5.5 liters (around 8-10 pints) of blood. A standard whole blood donation is about 470ml (roughly 1 pint), which your body easily replenishes.", },

  // --- Navigation Actions ---
  { keywords: ["find blood", "need blood", "request blood", "search blood", "emergency", "urgent need", "help find donor"], answer: 'You can use the "Request Blood" feature in the app. For urgent needs, contacting the hospital\'s blood bank directly is often the fastest route.', actions: [{ text: "Go to Request Blood", type: 'navigate', payload: '/RequestBlood' }] },
  { keywords: ["find camp", "donation camp", "where donate", "location", "center", "blood drive", "nearest center"], answer: 'Check the "Camps" section to find upcoming donation drives and centers near you.', actions: [{ text: "Find Camps", type: 'navigate', payload: '/Camps' }] },
  { keywords: ["update profile", "change details", "my info", "edit profile"], answer: "You can update your personal details like phone number, location, etc., in the 'Profile' section of the app.", actions: [{ text: "Go to Profile", type: 'navigate', payload: '/Profile' }] },

  // Link Action
   { keywords: ["prepare", "before donating", "what to do", "preparation", "get ready", "eat before", "drink before", "tips before"], answer: "Great question! Key things: Eat a healthy, iron-rich meal (avoid fatty foods) a few hours before. Drink plenty of water starting the day before. Get good sleep. Bring your photo ID. Avoid alcohol.", actions: [{ text: "WHO Prep Guide", type: 'link', payload: 'https://www.who.int/campaigns/world-blood-donor-day/2018/who-can-give-blood' }] },
  // Basic Eligibility
  { keywords: ["eligible", "eligibility", "can i donate", "requirements", "criteria", "qualify", "am i eligible"], answer: "General eligibility: 18-65 years old, weigh 50kg+, good health. Recent travel, medical conditions, meds, tattoos can affect this. Ask about specifics!", },
  { keywords: ["age", "old", "young", "minimum age", "maximum age", "how old", "age limit", "16", "17", "65+"], answer: "Standard age is 18-65. Some places allow 16/17 with consent. Regular donors might donate past 65 with doctor's okay. Check local policy.", },
  { keywords: ["weight", "heavy", "light", "weigh", "kg", "lbs", "pounds", "kilograms", "minimum weight", "underweight", "overweight"], answer: "Minimum 50 kg (110 lbs) usually required for whole blood donation. This ensures your safety and that enough blood is collected. There isn't typically an upper weight limit, but overall health is key.", },
  { keywords: ["health", "healthy", "good health", "feeling well", "sick", "cold", "flu", "infection", "fever", "sore throat", "stomach bug"], answer: "Feeling well is essential! Don't donate if unwell (cold, flu, fever, etc.). Wait until fully recovered (usually a few days after symptoms resolve).", },
  // Specific Conditions / Advanced Eligibility
  { keywords: ["covid", "corona", "coronavirus", "after covid", "had covid", "positive test", "vaccine", "covid vaccine"], answer: "After COVID-19 illness, be fully recovered & symptom-free. Wait period varies (often 10-28 days). COVID vaccination generally doesn't require a waiting period if you feel well. Check local guidelines.", },
  { keywords: ["medication", "medicine", "pills", "drugs", "taking", "prescription", "antibiotics", "aspirin", "ibuprofen", "advil", "painkiller", "blood thinner", "accutane", "antidepressant", "ssri", "beta blocker", "statin"], answer: "Many meds okay (birth control, allergy, vitamins, Tylenol, most BP/cholesterol/thyroid meds, most antidepressants). Antibiotics need wait (usually finish course + 24-48hrs symptom-free). Blood thinners (Warfarin, etc.), Accutane, some biologics often mean deferral. *Always* tell staff everything.", },
  { keywords: ["diabetes", "diabetic", "sugar", "insulin", "type 1", "type 2"], answer: "Often yes, if well-controlled (diet, meds, or insulin) & you feel well. Check local center policies, especially regarding insulin.", },
  { keywords: ["blood pressure", "hypertension", "bp", "high blood pressure", "bp meds"], answer: "Okay if controlled & reading on day is acceptable (e.g., typically below 180 systolic and 100 diastolic).", },
  { keywords: ["tattoo", "piercing", "body art", "ink", "needle", "new tattoo", "ear piercing", "acupuncture"], answer: "Wait times vary. Licensed facility w/ sterile needles: maybe 3 months or none in some regions. Elsewhere/unsure: typically 6-12 months. This includes tattoos, piercings, and sometimes acupuncture. Ask the center.", },
  { keywords: ["anemia", "iron", "hemoglobin", "low iron", "hb level", "iron deficiency"], answer: "They'll check hemoglobin (iron). If too low, you'll be deferred for safety. Eat iron-rich foods (red meat, spinach, lentils). Ask staff about supplements if needed, especially if you donate frequently.", },
  { keywords: ["pregnant", "pregnancy", "nursing", "breastfeeding", "gave birth", "postpartum"], answer: "Pregnancy prevents donation. Wait at least 6 weeks after childbirth, maybe longer if breastfeeding (policies vary). Check local guidelines." },
  { keywords: ["travel", "abroad", "outside country", "malaria", "zika", "visited", "trip", "vacation", "europe", "africa", "asia", "uk", "mad cow"], answer: "Travel matters! Visiting areas with risks (malaria, vCJD/mad cow risk in parts of Europe/UK, Zika) can cause deferral (from months to years). Be ready to tell staff about foreign travel in past 1-3 years." },
  { keywords: ["surgery", "operation", "dental work", "extraction", "root canal", "biopsy"], answer: "Minor surgery/dental: short wait (e.g., 24hrs for cleaning, 1 week for extraction). Major surgery: wait till fully healed & cleared by doctor (can be months). Inform staff." },
  { keywords: ["cancer", "leukemia", "lymphoma", "remission", "chemo", "radiation"], answer: "Most blood cancers (leukemia, lymphoma) are permanent deferrals. Other cancers often require being cancer-free for a period (e.g., 1-5 years) after treatment completion. Policies vary significantly; check with the donation center." },
  { keywords: ["hiv", "aids", "hepatitis", "hep b", "hep c", "std", "sti"], answer: "HIV (AIDS virus) and Hepatitis B/C infections are permanent deferrals. Other STIs might require treatment completion and a waiting period." },
  { keywords: ["deferral", "deferred", "why deferred", "cant donate today", "temporary deferral", "permanent deferral"], answer: "Deferral means you cannot donate today, either temporarily (e.g., low iron, recent cold, travel) or permanently (e.g., certain health conditions). It's for your safety or the recipient's. Ask the staff for the specific reason and when you might be eligible again."},
  { keywords: ["alcohol", "drink", "beer", "wine", "drunk"], answer: "It's best to avoid alcohol before donating as it can dehydrate you. Avoid alcohol immediately after donating too, as its effects can be stronger. Wait until later in the day."},
  { keywords: ["smoking", "vaping", "smoke", "cigarette"], answer: "Smoking itself doesn't usually disqualify you, but it's generally advised not to smoke right before or after donating as it can affect blood pressure and dizziness."},
  // Donation Process / Advanced
  { keywords: ["process", "steps", "what happens", "procedure", "donation steps", "expect"], answer: "Usual flow: 1. Register (ID). 2. Health Screen (Q&A, checks: temp, pulse, BP, iron). 3. Donation (~10 mins). 4. Refreshments (15 mins). Plan ~60 mins total!", },
  { keywords: ["how often", "frequency", "donate again", "interval", "how soon", "next donation", "wait time"], answer: "Whole blood: usually 56 days (8 weeks). Platelets: can be every 7 days (up to 24 times/year). Double Red Cells: 112 days (16 weeks). Plasma: often every 28 days.", },
  { keywords: ["after donating", "post donation", "care", "aftercare", "feel after", "what to do after", "recovery", "iron supplement", "exercise after", "lift after"], answer: "After: Enjoy snacks! Drink extra fluids (water, juice). Avoid heavy lifting or intense exercise for the rest of the day. Keep the bandage on for a few hours. Sit/lie down if dizzy. Consider iron-rich foods or supplements if you donate frequently.", },
  { keywords: ["time", "how long", "duration", "takes long", "appointment length"], answer: "Plan ~1 hour total for whole blood. Actual blood draw is quick: 8-12 minutes. Apheresis (platelets/plasma/double red) takes longer, maybe 1.5-2.5 hours.", },
  { keywords: ["safe", "safety", "risk", "dangerous", "hurt", "pain", "side effects", "feel faint", "dizzy", "bruise", "vasovagal"], answer: "Very safe! Sterile, single-use gear. Quick pinch. Most feel fine, maybe tired. Mild, temporary dizziness (vasovagal reaction) or bruising can occur. Serious issues very rare.", },
  { keywords: ["plasma", "platelets", "red cells", "types of donation", "apheresis", "donate platelets", "donate plasma", "double red"], answer: "Besides 'whole blood', you can donate specific parts via apheresis: Platelets (clotting, cancer patients), Plasma (treatments, clotting factors), Double Red Cells (boosts red cell supply efficiently). Uses a special machine, takes longer.", },
  { keywords: ["apheresis explained", "apheresis process", "how apheresis works"], answer: "Apheresis uses a machine to draw blood, separate out specific components (like platelets or plasma), and return the rest to your body. It allows for donating specific needed components more frequently than whole blood. It takes longer (1.5-2.5 hrs)."},
  { keywords: ["autologous donation", "donate for myself", "self donation"], answer: "Autologous donation is when you donate blood for your own scheduled surgery. It needs to be arranged well in advance with your doctor and the hospital/blood center."},
  { keywords: ["directed donation", "donate for specific person", "donate for family", "donate for friend"], answer: "Directed donation is donating for a specific patient (often family/friend). It requires compatible blood types and specific arrangements with the hospital/blood center. It's not always possible or recommended over donating to the general supply."},
  // Blood Science / Advanced
  { keywords: ["blood types", "compatibility", "who can receive", "match", "blood group", "rh factor", "a+", "b-", "ab+", "o-", "antigens", "antibodies"], answer: "Matching types (A, B, AB, O & Rh +/- based on antigens) is vital. Your plasma contains antibodies against antigens you *don't* have. O- universal red cell donor. AB+ universal red cell recipient. See chart!", },
  { keywords: ["o negative", "o-", "universal donor"], answer: "O-negative red cells lack A, B, and RhD antigens, so they can be given to almost anyone in emergencies. Your donation is especially needed!", },
  { keywords: ["ab positive", "ab+", "universal recipient"], answer: "AB+ red cells have A, B, and RhD antigens. People with AB+ blood lack anti-A and anti-B antibodies, so they can receive red cells from any ABO type (Rh must match). AB plasma is universal plasma donor.", },
  { keywords: ["rh factor", "rh positive", "rh negative", "what is rh"], answer: "The Rh factor is another antigen (protein) on red blood cells. If you have it, you're Rh positive (like A+, O+). If you don't, you're Rh negative (like B-, AB-). Rh negative people can only receive Rh negative blood."},
  { keywords: ["rare blood", "rare type", "subtype", "kell", "duffy"], answer: "Beyond ABO/Rh, there are many other blood group systems (Kell, Duffy, Kidd etc.). Some combinations are rare in certain populations. If you have a rare type, your donation can be critical for specific patients." },
  { keywords: ["blood testing", "test blood", "screen blood", "diseases tested"], answer: "Donated blood is rigorously tested for various infectious diseases like HIV, Hepatitis B & C, Syphilis, West Nile Virus, and others to ensure recipient safety."},
  { keywords: ["blood storage", "how long blood lasts", "shelf life"], answer: "Whole blood/Red cells typically last about 42 days refrigerated. Platelets only last 5-7 days at room temperature. Plasma can be frozen and lasts much longer (up to a year)."},
  // Myths
  { keywords: ["myth", "misconception", "rumor", "gain weight", "lose weight", "weak", "get sick", "takes too long", "have enough blood"], answer: "Common myths: Donation doesn't make you gain/lose weight, weaken you long-term, or make you sick (sterile process!). It takes about an hour total. There's *always* a need for blood!" },
  // General
  { keywords: ["benefits", "advantage", "good for me", "why donate", "reason donate", "purpose", "donation good"], answer: "Amazing way to save lives! Plus, free mini-health check (BP, iron). Fosters community spirit & sense of contribution!", },
  { keywords: ["hello", "hi", "hey", "greetings", "help", "info", "question", "bot", "chatbot"], answer: "Hello there! I'm the donation helper bot. Ask me about eligibility, the process, blood types, or finding help through the app.", },
  { keywords: ["thanks", "thank you", "ok", "great", "cool", "got it", "awesome", "perfect"], answer: "You're very welcome! Happy to assist. Let me know if anything else comes up.", },
  { keywords: ["bye", "goodbye", "that's all", "no more questions", "end chat", "quit"], answer: "Okay, goodbye for now! Thanks for stopping by and considering blood donation!", },
  // --- End of FAQ Data ---
];

// Suggested questions for quick replies
const suggestedQuestions = [
    "Am I eligible?", // Shorter
    "Donation process?", // Shorter
    "Find a camp?", // Shorter
    "How often?", // Shorter
    "Is it safe?",
    "What is apheresis?", // More specific
];

// --- Bot Logic ---
const getBotResponse = (userInput: string): { text: string; actions?: ActionButton[] } => {
  const lowerInput = ` ${userInput.toLowerCase().trim().replace(/[?.,!]/g, '')} `;
  if (lowerInput.trim().length === 0) return { text: "Please type a question." };

  let bestMatch = { score: 0, answer: "", actions: undefined as ActionButton[] | undefined };

  for (const faq of faqData) {
    let currentScore = 0;
    const matchedKeywords = new Set<string>();
    for (const keyword of faq.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i'); // Match whole word more reliably
      if (regex.test(lowerInput)) { // Prioritize regex word boundary match
        currentScore += 1.5; // Slightly higher weight for regex match
        if (!matchedKeywords.has(keyword)) { currentScore += 2; matchedKeywords.add(keyword); }
        if (keyword.length > 4) currentScore += 1;
      } else if (lowerInput.includes(` ${keyword} `)) { // Fallback to includes check
          currentScore += 1;
          if (!matchedKeywords.has(keyword)) { currentScore += 2; matchedKeywords.add(keyword); }
          if (keyword.length > 4) currentScore += 1;
      }
    }
    // Bonus for more keywords matched
    if (matchedKeywords.size > 1) {
        currentScore += matchedKeywords.size * 0.5;
    }

    if (currentScore > bestMatch.score) {
      bestMatch = { score: currentScore, answer: faq.answer, actions: faq.actions };
    }
  }

  // Slightly adjusted threshold, might need tuning based on faqData size/quality
  if (bestMatch.score > 3.5) {
    return { text: bestMatch.answer, actions: bestMatch.actions };
  }

  // Fallback responses
  if (lowerInput.includes('thank')) return { text: "You're welcome!" };
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) return { text: "Hello! How can I help?" };

  return { text: "Hmm, I'm not sure about that specific question. Could you try rephrasing it, perhaps using keywords like 'eligibility', 'process', 'safety', 'platelets', or 'medication'? You can also check the info cards above." };
};


// --- ExploreScreen Component ---
const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageType[]>([
    { id: '0', text: "Hi! Ask me about blood donation eligibility, process, or how to find help.", sender: "bot" },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const flatListRef = useRef<FlatList<MessageType>>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatSectionRef = useRef<View>(null);
  const [isScrolledNearTop, setIsScrolledNearTop] = useState(true); // State to track scroll position

  // Scroll chat list to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender !== 'typing') {
        scrollToBottomChatList();
    }
  }, [messages]);

  // Function to add bot typing indicator
  const showTypingIndicator = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => prev[prev.length - 1]?.id !== 'typing' ? [...prev, { id: 'typing', text: '', sender: 'typing' }] : prev);
    scrollToBottomChatList();
  };

  // Scroll the main ScrollView down to the chat section IF user is near the top
  const scrollToChatSectionIfNeeded = () => {
    // Only scroll if the user is considered near the top
    if (isScrolledNearTop && chatSectionRef.current && scrollViewRef.current) {
        const scrollNode = findNodeHandle(scrollViewRef.current);
        if (scrollNode) {
            chatSectionRef.current.measureLayout(
                scrollNode,
                (x, y) => {
                    console.log(`User near top, scrolling ScrollView to y: ${y}`);
                    scrollViewRef.current?.scrollTo({ y: y - 10, animated: true });
                },
                () => { console.error("Failed to measure chat section layout"); }
            );
        } else {
             console.warn("Could not find node handle for ScrollView");
        }
    } else {
         console.log("User not near top or refs not ready, skipping main scroll.");
    }
  }

  // Handle sending user message
  const handleSend = (messageToSend?: string) => {
    const userMessage = (messageToSend || inputText).trim();
    if (!userMessage) return;

    Keyboard.dismiss();
    setInputText("");

    const userMessageId = Date.now().toString() + '-user';
    const newUserMessage: MessageType = { id: userMessageId, text: userMessage, sender: "user" };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prevMessages => [...prevMessages, newUserMessage]);

    // Scroll main view IF NEEDED and chat list immediately
    requestAnimationFrame(() => {
        scrollToChatSectionIfNeeded(); // Conditional scroll
        scrollToBottomChatList();
    });

    setTimeout(() => { showTypingIndicator(); }, 150);

    setTimeout(() => {
      const botResponse = getBotResponse(userMessage);
      const botMessageId = Date.now().toString() + '-bot';
      const newBotMessage: MessageType = { id: botMessageId, text: botResponse.text, sender: "bot", actions: botResponse.actions };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prevMessages => [ ...prevMessages.filter(msg => msg.id !== 'typing'), newBotMessage ]);
      // useEffect handles chat list scroll for bot message
    }, 900 + Math.random() * 600);
  };

  // Scroll helper for the CHAT LIST (FlatList)
  const scrollToBottomChatList = useCallback(() => {
     setTimeout(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
     }, 100);
  }, []);

  // Handle button actions within messages
  const handleActionPress = (action: ActionButton) => {
      console.log("Action pressed:", action);
      if (action.type === 'navigate') {
          try { router.push(action.payload as any); }
          catch (e) { console.error("Navigation Error:", e); Alert.alert("Navigation Error", "Could not navigate."); }
      } else if (action.type === 'link') {
          Linking.openURL(action.payload).catch(err => { console.error("Failed to open URL:", err); Alert.alert("Error", "Could not open link."); });
      }
  };

  // --- Handler for main ScrollView scrolling ---
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      // Define a threshold (e.g., 100 pixels) to determine if user is "near the top"
      const threshold = 100;
      setIsScrolledNearTop(scrollY < threshold);
      // console.log("Scroll Y:", scrollY, "Is Near Top:", scrollY < threshold); // Optional: Debug scroll position
  }, []); // Empty dependency array as it doesn't depend on component state/props directly

  // Render chat messages
  const renderMessage = ({ item }: ListRenderItemInfo<MessageType>) => {
    if (item.sender === 'typing') {
        return ( <View style={[styles.messageBubble, styles.botMessage, styles.typingBubble]}><ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 5 }}/><Text style={styles.typingText}>Typing...</Text></View> );
    }
    return (
        <View style={[ styles.messageBubble, item.sender === "user" ? styles.userMessage : styles.botMessage ]}>
            <Text style={styles.messageText}>{item.text}</Text>
            {item.actions && item.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                    {item.actions.map((action, index) => (
                        <TouchableOpacity key={index} style={styles.actionButton} onPress={() => handleActionPress(action)}>
                            <Text style={styles.actionButtonText}>{action.text}</Text>
                            <MaterialIcons name={action.type === 'link' ? 'open-in-new' : 'arrow-forward'} size={16} color="#fff" style={{ marginLeft: 5 }}/>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
  };

  // Render suggested question buttons
  const renderSuggestedQuestion = (question: string) => ( <TouchableOpacity key={question} style={styles.suggestionButton} onPress={() => handleSend(question)}><Text style={styles.suggestionButtonText}>{question}</Text></TouchableOpacity> );

  // --- Info Card Component ---
  const InfoCard: React.FC<{ title: string; children: React.ReactNode; imageUrl?: string; iconName?: keyof typeof MaterialIcons.glyphMap }> = ({ title, children, imageUrl, iconName }) => (
    <View style={styles.card}>
        <View style={styles.cardHeaderContainer}>
            {iconName && <MaterialIcons name={iconName} size={24} color="#D62828" style={styles.cardIcon} />}
            <Text style={styles.cardHeader}>{title}</Text>
        </View>
        <View style={styles.cardContent}>
            {children}
            {imageUrl && ( <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" onError={(e) => console.log("Error loading image:", e.nativeEvent.error)} /> )}
        </View>
    </View>
  );

  // --- Main Return ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingContainer} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <ScrollView
        ref={scrollViewRef} // Assign ref
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll} // Add onScroll handler
        scrollEventThrottle={100} // Throttle scroll events (adjust as needed)
      >
        <Text style={styles.mainHeader}>Explore Blood Donation</Text>
        {/* --- Info Cards --- */}
        <InfoCard title="What is Blood Donation?" iconName="bloodtype" imageUrl="https://images.hindustantimes.com/img/2022/06/22/550x309/blood-donation-gd071f3ded_1920_1655893247578_1655893271863.png">
            <Text style={styles.cardText}>A simple, safe way to give blood and help those in need. Crucial for surgeries, emergencies, and treating various conditions.</Text>
        </InfoCard>
        <InfoCard title="Who Can Donate & How?" iconName="health-and-safety" imageUrl="https://drsajjas.com/wp-content/uploads/2023/06/iStock-690302872.jpeg">
            <Text style={styles.cardText}>Generally, adults 18-65, over 50kg, and healthy. Process: register, health check, donate (~10 mins), rest.</Text>
        </InfoCard>
        <InfoCard title="Why Your Donation Matters" iconName="volunteer-activism" imageUrl="https://www.sbmf.org/wp-content/uploads/2024/01/20240110_SBM_NationalBloodDonorMonth-1.png">
            <Text style={styles.cardText}>One donation can help save up to three lives! Support your community and get a free mini-health screening.</Text>
        </InfoCard>
        {/* --- Compatibility Card --- */}
        <InfoCard title="Blood Type Compatibility" iconName="sync-alt">
             <Text style={styles.cardText}>Matching types is vital. O- is universal red cell donor, AB+ universal recipient.</Text>
             <View style={styles.table}>
                 <View style={[styles.tableRow, styles.tableHeader]}><Text style={[styles.tableCell, styles.headerCell]}>Donor</Text><Text style={[styles.tableCell, styles.headerCell]}>Can Donate To</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>O−</Text><Text style={styles.tableCell}>All Types</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>O+</Text><Text style={styles.tableCell}>O+, A+, B+, AB+</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>A−</Text><Text style={styles.tableCell}>A−, A+, AB−, AB+</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>A+</Text><Text style={styles.tableCell}>A+, AB+</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>B−</Text><Text style={styles.tableCell}>B−, B+, AB−, AB+</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>B+</Text><Text style={styles.tableCell}>B+, AB+</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>AB−</Text><Text style={styles.tableCell}>AB−, AB+</Text></View>
                 <View style={styles.tableRow}><Text style={styles.tableCell}>AB+</Text><Text style={styles.tableCell}>AB+</Text></View>
             </View>
        </InfoCard>
         {/* --- Useful Links Card --- */}
        <InfoCard title="Useful Resources" iconName="link">
            <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability').catch(err => console.error("Link Error", err))}><MaterialIcons name="public" size={18} color="#0077B6" style={styles.linkIcon} /><Text style={styles.linkText}>WHO Blood Safety Facts</Text></TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://www.redcrossblood.org/donate-blood/how-to-donate/eligibility-requirements.html').catch(err => console.error("Link Error", err))}><MaterialIcons name="checklist" size={18} color="#0077B6" style={styles.linkIcon} /><Text style={styles.linkText}>Red Cross Eligibility (Example)</Text></TouchableOpacity>
             <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://www.eraktkosh.in/BLDAHIMS/bloodbank/transactions/bbpublicindex.html').catch(err => console.error("Link Error", err))}><MaterialIcons name="search" size={18} color="#0077B6" style={styles.linkIcon} /><Text style={styles.linkText}>eRaktKosh Blood Bank Search (India)</Text></TouchableOpacity>
        </InfoCard>
        {/* --- Chatbot Section --- */}
        <View ref={chatSectionRef} style={styles.chatSection}>
          <Text style={styles.chatHeader}><MaterialIcons name="support-agent" size={24} color="#003049" /> Ask Our Helper Bot</Text>
          <View style={styles.chatContainer}>
             <FlatList<MessageType> ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} style={styles.chatArea} contentContainerStyle={{ paddingBottom: 10 }} removeClippedSubviews={Platform.OS === 'android'} initialNumToRender={10} maxToRenderPerBatch={5} windowSize={10} />
          </View>
          <View style={styles.suggestionsContainer}>{suggestedQuestions.map(renderSuggestedQuestion)}</View>
        </View>
        <Text style={styles.footer}>Ready to make a difference?</Text>
      </ScrollView>
      {/* Input area */}
      <View style={styles.inputArea}>
        <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Ask a question..." placeholderTextColor="#8A94A6" onSubmitEditing={() => handleSend()} blurOnSubmit={false} />
        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()} activeOpacity={0.7} disabled={!inputText.trim()}><MaterialIcons name="send" size={22} color="#fff" /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F4F7FC', },
  scrollContainer: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 120, },
  mainHeader: { fontSize: 28, fontWeight: "bold", color: "#D62828", marginBottom: 25, textAlign: "center", },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  cardHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, },
  cardIcon: { marginRight: 10, },
  cardHeader: { fontSize: 20, fontWeight: "600", color: "#003049", flexShrink: 1, },
  cardContent: { /* No specific styles needed */ },
  cardText: { fontSize: 16, color: "#333C4D", lineHeight: 24, marginBottom: 10, },
  cardImage: { width: "100%", height: 160, borderRadius: 8, marginTop: 10, backgroundColor: '#eee', },
  table: { borderWidth: 1, borderColor: "#E9ECEF", borderRadius: 8, overflow: 'hidden', marginTop: 15, },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F4F7FC", backgroundColor: '#fff', },
  tableHeader: { backgroundColor: "#003049", borderBottomColor: "#003049", },
  tableCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 5, fontSize: 14, textAlign: "center", color: "#333C4D", },
  headerCell: { color: "#fff", fontWeight: "bold", fontSize: 14, },
  linkButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, },
  linkIcon: { marginRight: 10, },
  linkText: { fontSize: 16, color: '#0077B6', textDecorationLine: 'underline', },
  chatSection: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  chatHeader: { fontSize: 20, fontWeight: "600", color: "#003049", marginBottom: 15, textAlign: 'center', },
  chatContainer: { height: 350, borderWidth: 1, borderColor: "#E0E6ED", borderRadius: 8, backgroundColor: '#F8F9FA', overflow: 'hidden', marginBottom: 10, },
  chatArea: { flex: 1, padding: 12, },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 18, marginBottom: 10, maxWidth: "85%", },
  userMessage: { backgroundColor: "#D62828", alignSelf: "flex-end", borderBottomRightRadius: 4, },
  botMessage: { backgroundColor: "#0077B6", alignSelf: "flex-start", borderBottomLeftRadius: 4, },
  messageText: { fontSize: 15, lineHeight: 22, color: '#ffffff', },
  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, },
  typingText: { color: '#ffffff', fontStyle: 'italic', fontSize: 14, },
  actionsContainer: { marginTop: 10, borderTopColor: 'rgba(255,255,255,0.3)', borderTopWidth: 1, paddingTop: 8, },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, paddingVertical: 8, paddingHorizontal: 12, marginTop: 5, alignSelf: 'flex-start', },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '500', },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 5, },
  suggestionButton: { backgroundColor: '#E9ECEF', borderRadius: 15, paddingVertical: 8, paddingHorizontal: 12, margin: 4, },
  suggestionButtonText: { color: '#0077B6', fontSize: 13, fontWeight: '500', },
  inputArea: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#D9E1EC", backgroundColor: "#ffffff", alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 15 : 8, },
  input: { flex: 1, borderWidth: 1, borderColor: "#D9E1EC", borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 16, backgroundColor: '#F8F9FA', marginRight: 8, },
  sendButton: { backgroundColor: "#D62828", borderRadius: 20, padding: 10, justifyContent: 'center', alignItems: 'center', minWidth: 40, minHeight: 40, },
  footer: { fontSize: 14, fontStyle: "italic", textAlign: "center", color: "#6C757D", marginTop: 15, marginBottom: 20, },
});

export default ExploreScreen;

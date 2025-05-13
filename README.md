# BloodConnect: AI-Powered Blood Donation Network

**Tagline:** Where Every Drop Meets a Need.

---

## 🚩 About The Project

BloodConnect is an innovative mobile application designed to revolutionize the blood donation ecosystem. Inspired by the challenges observed in coordinating urgent blood needs within communities like SRM University, this platform aims to bridge the gap between blood donors, recipients, and vital information. By integrating Artificial Intelligence, BloodConnect makes the process of finding and donating blood more efficient, accessible, and ultimately, life-saving.

Our goal is to transform a fragmented, often manual system into a centralized, intelligent, and user-friendly platform, ensuring faster responses to blood requests and making more informed connections.

---

## ✨ Key Features

* **User Authentication & Profiles:** Secure registration, login, and personalized user profiles for donors and requesters.
* **Request Blood:** Users can easily submit urgent blood requests with details like blood group, location, and urgency.
* **Find Camps:** Discover nearby blood donation camps and events with relevant details.
* **Explore & Learn (AI Chatbot):** An informational section featuring an AI-powered chatbot to answer FAQs about blood donation eligibility, the process, safety, and more, 24/7.
* **AI-Powered Donor Matching:** The backend intelligently suggests potential donors for blood requests based on:
    * Blood type compatibility.
    * Location proximity.
    * Urgency of the request.
* **Donation Tracking (Conceptual):** System designed to record donation details, linking them to users, camps, or fulfilled requests.

---

## 🛠️ Built With

This project leverages a modern technology stack to deliver its features:

* **Frontend (Mobile App):**
    * React Native
    * Expo (Managed Workflow & Development Tools)
    * Expo Router (File-based navigation)
    * `@react-navigation/bottom-tabs` (Tab navigation)
    * `@expo/vector-icons` (Icons)
    * `expo-linear-gradient` (UI Styling)
    * `@react-native-async-storage/async-storage` (Client-side session persistence)
* **Backend API:**
    * Node.js
    * Express.js
* **Database:**
    * MySQL (Configured for `freesqldatabase.com` as primary, with local MySQL as a fallback option during development)
* **Key Backend Libraries:**
    * `mysql2/promise` (MySQL driver)
    * `bcrypt` (Password hashing)
    * `cors` (Cross-Origin Resource Sharing)
    * `dotenv` (Environment variable management)
* **AI Concepts Applied:**
    * **Knowledge Representation:** Structured FAQ data for the chatbot.
    * **Basic Natural Language Processing (NLP):** Keyword matching, regular expressions, and scoring heuristics for chatbot query understanding.
    * **Heuristic Search:** Scoring and ranking algorithm for donor matching.
    * **Rule-Based Systems:** Filtering and decision logic in donor matching.
* **Development Tools:**
    * Visual Studio Code
    * Git & GitHub
    * Postman (for API testing, if used)
    * MySQL Workbench (for database management, if used)
    * Canva (for poster/presentation design)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (LTS version recommended)
* NPM or Yarn
* Expo CLI: `npm install -g expo-cli`
* A MySQL instance (local or cloud-based like `freesqldatabase.com`)
* Git

### Frontend (Expo App) Setup

1.  **Clone the repository:**
    ```bash
    git clone [your-github-repository-url]
    cd [your-project-directory]
    ```
2.  **Install NPM packages:**
    ```bash
    npm install
    # OR
    # yarn install
    ```
3.  **Configure API URL:**
    * In the frontend code (likely in a config file or where API calls are made), ensure the `API_URL` constant points to your running backend server.
    * If running the backend locally:
        * For Android Emulator: `http://10.0.2.2:PORT` (e.g., `http://10.0.2.2:3000`)
        * For iOS Simulator/Physical device on same network: `http://YOUR_COMPUTER_LOCAL_IP:PORT`
    * If backend is deployed: Use the deployed URL (e.g., `https://your-backend.onrender.com`)

4.  **Start the Expo development server:**
    ```bash
    npx expo start
    ```
    Follow the instructions in the terminal to open the app in Expo Go (on your phone) or in an Android/iOS emulator/simulator.

### Backend (`server.js`) Setup

1.  **Navigate to your backend directory** (if it's separate from the frontend). If `server.js` is in the root, you can skip this.
2.  **Install NPM packages:**
    ```bash
    npm install
    # OR
    # yarn install
    ```
3.  **Set up environment variables:**
    * Create a `.env` file in the directory where `server.js` is located.
    * Add your database credentials and other configurations as shown in the `server.js` setup (e.g., `DB_HOST_FREESQL`, `DB_USER_FREESQL`, `DB_PASSWORD_FREESQL`, `DB_NAME_FREESQL`, and optionally your local DB credentials).
        ```plaintext
        # .env example
        DB_HOST_FREESQL=your_freesql_host
        DB_USER_FREESQL=your_freesql_user
        DB_PASSWORD_FREESQL=your_freesql_password
        DB_NAME_FREESQL=your_freesql_dbname
        DB_PORT_FREESQL=3306

        DB_HOST_LOCAL=localhost
        DB_USER_LOCAL=root
        DB_PASSWORD_LOCAL=your_local_db_password
        DB_NAME_LOCAL=blooddonation
        DB_PORT_LOCAL=3306

        PORT=3000
        ```
4.  **Ensure your Database is Set Up:**
    * Make sure your chosen MySQL database (FreeSQLDatabase or local) is running and accessible.
    * Execute the SQL schema (the `CREATE TABLE` statements) provided in your project to set up the necessary tables.
5.  **Start the backend server:**
    ```bash
    node server.js
    ```
    The server should log that it's connected to the database and running on the specified port.

---

## 💡 Challenges & Learnings

* **Database Design:** Iteratively refining the MySQL schema for 3NF while ensuring query performance was a key learning.
* **AI Logic:** Developing effective keyword matching for the chatbot and a fair heuristic for donor matching required careful tuning.
* **Asynchronous Operations:** Managing API calls and state updates in React Native.
* **Environment Configuration:** Setting up database connections for different environments (local, cloud).

---

## 🔮 Future Scope

* Real-time notifications for urgent requests and matched donors.
* Advanced NLP for the chatbot for more conversational interactions.
* Machine Learning for predicting donation likelihood or demand.
* Integration with mapping services for camp directions.
* Enhanced user roles and admin dashboard.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/your-username/your-repo-name/issues). *(Replace with your actual GitHub repo URL)*

---

## 📝 License

This project can be under the MIT License or any other open-source license you prefer.
*(Choose a license and add it here, e.g., Distributed under the MIT License. See `LICENSE.txt` for more information.)*

---

## 🙏 Acknowledgements

* SRM University (for the inspiration and learning environment)
* Expo Team
* React Native Community
* Node.js Community
* (Any specific libraries or resources you found particularly helpful)


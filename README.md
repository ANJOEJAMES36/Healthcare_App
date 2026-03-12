# Health Care IoT Dashboard 🏥

A comprehensive, real-time health monitoring system designed for patients, doctors, and bystanders. The platform ingests live vital data from IoT devices (ESP32) and distributes it securely across a modern Web Dashboard and a mobile application.

![Dark Mode Dashboard](https://img.shields.io/badge/UI-Dark%20Mode-blue)
![Real--time](https://img.shields.io/badge/Updates-Real--time-green)
![Status](https://img.shields.io/badge/Status-Active-success)
![Auth](https://img.shields.io/badge/Auth-JWT%20Secured-orange)
![Mobile](https://img.shields.io/badge/Mobile-React%20Native-purple)

---

## 🌟 Key Features

### 🔐 Multi-Role Authentication & Access
- **Doctor Portal**: Secure login to monitor multiple patients and view their live dashboards simultaneously.
- **Patient Portal**: Secure access to personal health history and real-time metrics.
- **Bystander / Emergency Access (Mobile)**: Scan a patient's QR code to instantly access their live vitals without needing an account.
- **Security**: JWT-based session security and Bcrypt password hashing.

### 📊 Real-Time Monitoring & Graphing
- **Vital Metrics**: Tracks 🌡️ Temperature, ❤️ Heart Rate, 💧 SpO2, and 🩺 Blood Pressure.
- **Live Updates**: Data flows seamlessly from the IoT device to the database and frontend via MQTT and Socket.io.
- **Interactive Charts**: Select from 7 different time ranges (10min to 24hr) to analyze historical trends.
- **Offline Resilience**: Graphs hold their values and safely mark connection status as "Offline" instead of erasing data during temporary network drops.

### ⚠️ Intelligent Warnings
- **Color-Coded Alerts**: Green (normal), Yellow (warning), Red (danger) visualizations based on the live data stream.
- **Custom Thresholds**: Configure high/low danger thresholds for each health metric dynamically based on patient needs.

### 🌙 Modern Cross-Platform UI
- **Web App**: Built with React and Vite for a sleek glassmorphism design that is highly responsive.
- **Mobile App**: Built with React Native (Expo) for both iOS and Android. Features hardware native integrations like the Camera for QR code scanning.

---

## 🏗️ System Architecture

1. **Edge Node**: ESP32 sensors generate live vital data and publish JSON payloads.
2. **Message Broker**: HiveMQ Cloud acts as the MQTT broker absorbing the high-frequency data stream.
3. **Backend Server (Node.js)**: Subscribes to MQTT topics, persists data to MongoDB, and broadcasts changes to web/mobile clients over WebSockets.
4. **Frontends (React & React Native)**: Consume secure REST APIs for historical data and WebSockets for sub-second live updates.

```text
ESP32 → HiveMQ Cloud → Node.js (Auth/Data) → MongoDB Atlas
                                    ↓ (Socket.io)
            ┌───────────────────────┴───────────────────────┐
            ↓                                               ↓
    React Web Dashboard                          React Native Mobile App
  (Patient/Doctor Views)                  (Patient/Doctor/Bystander Views)
```

---

## 💻 Important Files & Code Explanation

Understanding the core files of this repository will help you navigate the system effortlessly.

### 🏢 Backend (`/server`)

- **`server/index.js` (Main Entry Point)**
  - This is the core of the backend server.
  - **Responsibilities:**
    - Initializes the **Express** HTTP server and **Socket.io** WebSocket server.
    - Connects to the **MongoDB Database**.
    - Mounts REST API routes (`/api/auth`, `/api/data`).
    - Configures Socket.io connection logic: when a user connects, it identifies them from query parameters, joins them to a private Socket room (e.g., `room: user1`), and automatically sends them their 50 most recent historical records.
    - Gracefully handles server shutdowns (SIGTERM, SIGINT).

- **`server/mqtt/mqttClient.js` (IoT Ingestion)**
  - Acts as the bridge between the hardware edge devices and the web/mobile platforms.
  - **Responsibilities:**
    - Connects to the **HiveMQ MQTT Broker** using secure credentials.
    - Subscribes to the designated IoT topic (e.g., `esp32/health/data`).
    - **Message Event Handler:** Intercepts incoming JSON payloads from the ESP32. It validates the user ID and data requirements, saves the valid data directly into MongoDB via `DataModel`, and then instantly broadcasts the plain data via `io.to(userId).emit('mqtt-message')` straight to the connected web/mobile clients in real time.

- **`server/routes/authRoutes.js` & `dataRoutes.js` (REST APIs)**
  - `authRoutes.js`: Handles POST requests for login and user registration. Issues JWT (JSON Web Tokens) for authenticated clients.
  - `dataRoutes.js`: Handles GET requests to provide historical data points to the clients allowing chart data backfilling by selected time offsets.

### 💻 Web App (`/client`)

- **`client/src/App.jsx` (Frontend Entry Router)**
  - Sets up the React routing architecture.
  - Uses a `<ProtectedRoute />` wrapper that checks the `AuthContext` to ensure the user holds a valid JWT token.
  - Automatically redirects users to the correct dashboard based on their role (`doctor` vs `user`).

- **`client/src/context/AuthContext.jsx` (Global State)**
  - A React Context API wrapper providing globally accessible state variables like `user`, `token`, and functions `login()` and `logout()`. Persists sessions using `localStorage`.

- **`client/src/hooks/useSocket.js` (Real-time Custom Hook)**
  - A critical React Hook abstracting real-time communication.
  - It connects to the backend Socket.io server passing the user's ID to join their specific data room.
  - Listens for `initial-data` (on mount) and `mqtt-message` (live updates), managing state arrays that power the frontend charts.
  - Features reconnect logic and error handling to ensure seamless connectivity.

### 📱 Mobile App (`/mobile`)

- **`mobile/App.js` (Mobile Entry & Navigation)**
  - The root file wrapping the React Native app.
  - Built with `@react-navigation/native-stack`, creating a native routing hierarchy for 5 primary screens: `Login`, `Scanner`, `UserDashboard`, `DoctorDashboard`, and `BystanderDashboard`.
  - Hides native headers in favor of custom-styled immersive darker themes (`#0f0f1e`).

- **`mobile/src/screens/...` (The View Controllers)**
  - **`ScannerScreen.js`**: Interacts with the native `expo-camera` to scan QR codes.
  - **`BystanderDashboard.js`**: Accepts a user ID (e.g., from the QR code scanner) and connects to a temporary socket stream, rendering live metric charts identically to authenticated paths without requiring permanent login.

---

## 🚀 Quick Start Guide

### 1. Default Credentials
| Role | Username | Password |
|------|----------|----------|
| **Doctor** | `doctor` | `1234` |
| **User 1** | `user1` | `12345678` |
| **User 2** | `user2` | `12345678` |

---

### 2. Environment Setup

#### Server Configuration
```bash
cd server
cp .env.example .env  # Add your MongoDB URI and JWT secrets
npm install
npm run dev
```

#### Web Client Configuration
```bash
cd client
cp .env.example .env  # Configure the API URL
npm install
npm run dev
```

#### Mobile App Configuration
```bash
cd mobile
npm install
npm start
# Use the Expo Go app on your phone to scan the QR code and launch the app
```

---

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License
This project is freely available under the **MIT License**.

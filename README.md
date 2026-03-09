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

```
ESP32 → HiveMQ Cloud → Node.js (Auth/Data) → MongoDB Atlas
                                    ↓ (Socket.io)
            ┌───────────────────────┴───────────────────────┐
            ↓                                               ↓
    React Web Dashboard                          React Native Mobile App
  (Patient/Doctor Views)                  (Patient/Doctor/Bystander Views)
```

---

## 🛠️ Tech Stack

### Backend (`/server`)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas (Mongoose OMD)
- **Real-Time**: Socket.io & MQTT.js
- **Security**: jsonwebtoken, bcryptjs, cors, dotenv

### Web Frontend (`/client`)
- **Framework**: React 18, Vite
- **Routing**: React Router DOM
- **Visualization**: Recharts for dynamic time-series graphing
- **Real-Time**: socket.io-client
- **Utils**: qrcode.react (QR generation)

### Mobile App (`/mobile`)
- **Framework**: React Native & Expo
- **Navigation**: React Navigation (Native Stack)
- **Visualization**: react-native-chart-kit
- **Native Modules**: expo-camera (QR Scanning), AsyncStorage
- **Real-Time**: socket.io-client, axios

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

## 📁 Project Structure

```text
Project_EC/
├── server/                 # Node.js backend infrastructure
│   ├── config/             # Database and threshold configs
│   ├── models/             # Mongoose schemas (User, Doctor, Data)
│   ├── mqtt/               # MQTT client for HiveMQ ingestion
│   ├── routes/             # Express API routers
│   └── utils/              # Database seeders and formatters
│
├── client/                 # React Web Application
│   ├── src/
│   │   ├── components/     # Reusable UI components (MetricCard, ChartCard)
│   │   ├── context/        # React Context for Global Auth State
│   │   ├── hooks/          # Custom hooks (useSocket, useHealthData)
│   │   ├── pages/          # Full page views (Login, Dashboards)
│   │   └── utils/          # Data formatting and styling utilities
│   └── vite.config.js      # Build config
│
└── mobile/                 # React Native Mobile App
    ├── src/
    │   ├── components/     # Native UI elements
    │   ├── navigation/     # AppRouter configurations
    │   ├── screens/        # LoginTracker, Patient Dashboard, QR Scanner
    │   └── services/       # Axios API and Socket managers
    ├── App.js              # Native entrypoint
    └── app.json            # Expo config
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

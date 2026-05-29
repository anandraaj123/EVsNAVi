EVsNAVI ⚡
Smart EV Charging Station Navigation App

EVsNAVI is a full-stack EV charging station navigation mobile application built to help electric vehicle users easily locate nearby compatible charging stations, navigate efficiently, and reduce range anxiety using intelligent charger filtering and real-time station discovery.

🚀 Features
🔍 Discover nearby EV charging stations in real time
⚡ Filter charging stations based on EV compatibility
🔌 Support for AC/DC charging and connector types
🗺️ Interactive map integration with live location tracking
🔐 Secure Firebase Authentication system
☁️ Cloud-hosted backend deployment on Render
📱 Standalone Android production build support
🌐 REST API integration for charging station data
🛠️ Tech Stack
- Frontend
- React Native
- Expo
- TypeScript
- Backend
- Node.js
- Express.js
- Maps & Navigation
- MapLibre
- OpenStreetMap
- Authentication & Cloud
- Firebase Authentication
- Firebase Services
- APIs
- Open Charge Map API
- Deployment
- Render
- Gradle Android Build Tools
- Git
- GitHub
📱 Application Screens
- Splash Screen
- Login / Signup Screen
- Home Map Screen
- Charging Station Details Screen
- Navigation Screen
- User Profile Screen
⚙️ System Architecture
Mobile App (React Native)
            ↓
Cloud Backend (Render)
            ↓
Firebase Authentication
            ↓
Open Charge Map API
            ↓
MapLibre + OpenStreetMap
🔋 Core Functionalities
EV Charger Compatibility Filtering

The application filters charging stations based on:

Connector Type
Charging Speed
AC/DC Charging
Vehicle Compatibility
Real-Time Charging Station Discovery

Users can:

locate nearby charging stations
view charger details
check compatibility
navigate directly to stations
Secure Authentication

Implemented using Firebase Authentication:

User Registration
Login System
Persistent User Sessions
☁️ Backend Deployment

The backend is deployed on Render to provide:

24/7 cloud availability
scalable API handling
real-time data communication
secure production architecture
📂 Project Structure
EVsNAVI/
│
├── frontend/
│   ├── src/
│   ├── android/
│   ├── assets/
│   └── components/
│
├── backend/
│   ├── src/
│   ├── routes/
│   ├── services/
│   └── config/
│
└── README.md
🔧 Installation
Clone Repository
git clone https://github.com/anandraaj123/EVsNAVI.git
Frontend Setup
cd frontend
npm install
npx expo start
Backend Setup
cd backend
npm install
npm run dev
📦 Production APK Build

Generate standalone Android APK:

cd frontend/android
.\gradlew assembleRelease

Generated APK location:

frontend/android/app/build/outputs/apk/release/app-release.apk
🔐 Environment Variables

Create a .env file inside backend directory:

PORT=3000

OCM_API_KEY=your_open_charge_map_api_key
ORS_API_KEY=your_open_route_service_api_key

FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
🌍 APIs Used
Open Charge Map API

Used for:

charging station discovery
connector details
station metadata
Firebase

Used for:

authentication
user management
cloud services
📈 Future Improvements
AI-based charger recommendation system
Battery-aware smart routing
Real-time charger occupancy detection
EV charging analytics dashboard
Charging history tracking
Push notification alerts
🎯 Project Goal

The goal of EVsNAVI is to:

reduce EV range anxiety
simplify charger discovery
improve charging compatibility detection
provide a seamless EV charging experience
👨‍💻 Developed By

Anand Raj
B.Tech CSE Student
Galgotias University

📄 License

This project is licensed under the MIT License.

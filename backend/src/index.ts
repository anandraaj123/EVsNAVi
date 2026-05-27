import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';

// Load environment variables
dotenv.config();

// Firebase Web SDK Configuration from env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App for the server proxy session
export const firebaseApp = initializeApp(firebaseConfig);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Import Routers
import authRouter from './routes/auth';
import stationsRouter from './routes/stations';
import routeRouter from './routes/route';

// Routes Mount
app.use('/api/auth', authRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/route', routeRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'EVsNAVI Backend API Proxy is running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[EVsNAVI-Server] Backend is running on port ${PORT}`);
});

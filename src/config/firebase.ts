import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsx56yD1PEZ0m2sQQ4AcCCtRHqxvqvF4c",
  authDomain: "evsnavi.firebaseapp.com",
  projectId: "evsnavi",
  storageBucket: "evsnavi.firebasestorage.app",
  messagingSenderId: "1058366331409",
  appId: "1:1058366331409:web:43d98fe1bb15425994afb0",
  measurementId: "G-L3Y1VETSY1"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export let auth: any;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

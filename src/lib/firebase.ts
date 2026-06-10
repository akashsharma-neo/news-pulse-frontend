import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";
import { Auth, getAuth } from "firebase/auth";

function firebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  const config: FirebaseOptions = { apiKey, authDomain, projectId, appId };
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();
  if (storageBucket) config.storageBucket = storageBucket;
  if (messagingSenderId) config.messagingSenderId = messagingSenderId;
  if (measurementId) config.measurementId = measurementId;
  return config;
}

export function isFirebaseConfigured(): boolean {
  return firebaseConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = firebaseConfig();
  if (!config) return null;
  if (getApps().length > 0) return getApp();
  return initializeApp(config);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

let analyticsInstance: Analytics | null = null;

/** Browser-only; no-op on server or when measurementId is unset. */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  const app = getFirebaseApp();
  if (!app || !process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim()) return null;
  if (!(await isSupported())) return null;
  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

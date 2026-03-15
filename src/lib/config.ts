/**
 * =====================================================
 *  SETU SATHI — Backend Configuration
 * =====================================================
 *
 * This file is the SINGLE place to configure all backend
 * connections. When adding a backend, fill in the relevant
 * section below and set USE_BACKEND = true.
 *
 * The app is configured for backend-first usage.
 * =====================================================
 */

// ─── Master Switch ───────────────────────────────────
// Set to true when a real backend is connected.
export const USE_BACKEND = true;

// ─── Auth Session Behavior ──────────────────────────
// When true, app signs out any persisted Firebase session on startup
// so users always land on Login first.
export const FORCE_LOGIN_ON_APP_START = false;

// ─── API Server ──────────────────────────────────────
// Base URL for your REST / GraphQL backend
export const API_BASE_URL = 'http://localhost:8000';
export const API_TIMEOUT = 15000; // ms

// ─── API Keys ────────────────────────────────────────
export const API_KEYS = {
  // Primary API key for authenticating requests
  apiKey: 'YOUR_API_KEY',

  // Secret key (only if needed server-side; avoid shipping in prod builds)
  apiSecret: 'YOUR_API_SECRET',
};

// ─── Firebase ────────────────────────────────────────
// Used for authentication, Firestore, push notifications, etc.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDHCG5KraNqTBzUuykobMYRCliMren01xA",
  authDomain: "setu-sathi.firebaseapp.com",
  projectId: "setu-sathi",
  storageBucket: "setu-sathi.firebasestorage.app",
  messagingSenderId: "1041706582326",
  appId: "1:1041706582326:web:0ba85bd31d71b1c634b397",
  measurementId: "G-LF39881MEM"
};

// ─── Database ────────────────────────────────────────
// If using a direct database connection (Supabase, MongoDB, etc.)
export const DATABASE_CONFIG = {
  provider: 'none', // 'supabase' | 'mongodb' | 'postgresql' | 'none'
  url: 'YOUR_DATABASE_URL',
  anonKey: 'YOUR_ANON_KEY', // Supabase anon key
  serviceRoleKey: '', // Only for server-side use
};

// ─── Storage / File Uploads ──────────────────────────
// For patient photos, documents, etc.
export const STORAGE_CONFIG = {
  provider: 'none', // 'firebase' | 's3' | 'cloudinary' | 'none'
  bucket: 'YOUR_BUCKET_NAME',
  region: 'YOUR_REGION',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  cloudinaryCloudName: '', // if using Cloudinary
  cloudinaryUploadPreset: '',
};

// ─── Push Notifications ──────────────────────────────
export const NOTIFICATION_CONFIG = {
  provider: 'none', // 'expo' | 'firebase' | 'onesignal' | 'none'
  oneSignalAppId: 'YOUR_ONESIGNAL_APP_ID',
  expoProjectId: 'YOUR_EXPO_PROJECT_ID',
};

// ─── SMS / OTP ───────────────────────────────────────
export const SMS_CONFIG = {
  provider: 'none', // 'twilio' | 'msg91' | 'none'
  twilioAccountSid: 'YOUR_TWILIO_SID',
  twilioAuthToken: 'YOUR_TWILIO_TOKEN',
  twilioPhoneNumber: '+1XXXXXXXXXX',
  msg91AuthKey: 'YOUR_MSG91_KEY',
  msg91TemplateId: 'YOUR_TEMPLATE_ID',
};


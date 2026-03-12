/**
 * =====================================================
 *  SETU SATHI — API Service
 * =====================================================
 *
 * Centralized API client. All backend calls go through here.
 * When USE_BACKEND is false, methods return mock/demo data.
 * When USE_BACKEND is true, methods call your real API.
 *
 * To connect a real backend:
 *   1. Set USE_BACKEND = true in config.ts
 *   2. Set API_BASE_URL to your server
 *   3. Implement the real fetch calls below
 * =====================================================
 */

import { USE_BACKEND, API_BASE_URL, API_KEYS, API_TIMEOUT, FIREBASE_CONFIG, DEMO_CREDENTIALS } from './config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// ─── Helper ──────────────────────────────────────────

const headers = () => ({
  'Content-Type': 'application/json',
  ...(API_KEYS.apiKey !== 'YOUR_API_KEY' ? { Authorization: `Bearer ${API_KEYS.apiKey}` } : {}),
});

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers(), ...(options.headers as Record<string, string> || {}) },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  return res.json();
};

export const authService = {
  /**
   * Login with email + password.
   * Uses Firebase if properly configured, otherwise falls back to API.
   */
  login: async (email: string, password: string) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      // Use Firebase auth
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: { id: userCred.user.uid, name: 'User', email: userCred.user.email },
      };
    }

    // Demo mode
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      return {
        success: true,
        user: { id: DEMO_CREDENTIALS.doctorId, name: DEMO_CREDENTIALS.doctorName, email },
      };
    }
    throw new Error('Invalid credentials');
  },

  /**
   * Register a new doctor account.
   */
  register: async (email: string, password: string, fullName: string, doctorId: string) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: fullName });
      await setDoc(doc(db, 'doctors', userCred.user.uid), {
        fullName,
        doctorId,
        email,
        createdAt: new Date().toISOString(),
      });
      return {
        success: true,
        user: { id: userCred.user.uid, name: fullName, email, doctorId },
      };
    }

    throw new Error('Registration requires Firebase backend');
  },

  /**
   * Get doctor profile from Firestore.
   */
  getDoctorProfile: async (uid: string) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      const snap = await getDoc(doc(db, 'doctors', uid));
      if (snap.exists()) {
        return snap.data() as { fullName: string; doctorId: string; email: string };
      }
    }
    return null;
  },

  /**
   * Send password reset email.
   */
  forgotPassword: async (email: string) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      // Use Firebase
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Reset link sent to email' };
    }

    // Demo mode
    return { success: true, message: 'Reset link sent (demo)' };
  },

  /**
   * Logout current user.
   */
  logout: async () => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      await auth.signOut();
      return { success: true };
    }

    return { success: true };
  },
};

// ─── Patients ────────────────────────────────────────

export type PatientApiData = {
  patient_id: number;
  full_name: string;
  gender: string;
  date_of_birth: string;
  age: number;
  mobile_number: string;
  address: string;
  photo_url: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
};

export const patientService = {
  /**
   * Create a new patient.
   * POST /patients
   */
  create: async (data: {
    full_name: string;
    gender: string;
    date_of_birth?: string;
    age: number;
    mobile_number?: string;
    address?: string;
    photo_url?: string;
    created_by?: number;
    updated_by?: number;
  }): Promise<PatientApiData> => {
    return apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth || '',
        age: data.age,
        mobile_number: data.mobile_number || '',
        address: data.address || '',
        photo_url: data.photo_url || '',
        created_by: data.created_by || 1,
        updated_by: data.updated_by || 1,
      }),
    });
  },

  /**
   * Get all patients (paginated).
   * GET /patients?skip=0&limit=100
   */
  getAll: async (skip = 0, limit = 100): Promise<PatientApiData[]> => {
    return apiFetch(`/patients?skip=${skip}&limit=${limit}`);
  },

  /**
   * Get single patient by ID.
   * GET /patients/{patient_id}
   */
  getById: async (patientId: number): Promise<PatientApiData> => {
    return apiFetch(`/patients/${patientId}`);
  },

  /**
   * Update a patient.
   * PUT /patients/{patient_id}
   */
  update: async (patientId: number, data: Partial<Omit<PatientApiData, 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>> & { updated_by: number }): Promise<PatientApiData> => {
    return apiFetch(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a patient.
   * DELETE /patients/{patient_id}
   */
  delete: async (patientId: number): Promise<void> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: headers(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API error: ${res.status}`);
    }
  },

  /**
   * Search patients by name or mobile number.
   * GET /patients/search/{search_term}
   */
  search: async (searchTerm: string, skip = 0, limit = 100): Promise<PatientApiData[]> => {
    return apiFetch(`/patients/search/${encodeURIComponent(searchTerm)}?skip=${skip}&limit=${limit}`);
  },
};

// ─── OPD ─────────────────────────────────────────────

export const opdService = {
  /**
   * Start a new OPD session.
   */
  start: async (data: { village: string; deskRole: string }) => {
    if (!USE_BACKEND) {
      return { success: true, opdId: `OPD-${data.village.toUpperCase()}-${Date.now()}`, pin: '123456' };
    }

    return apiFetch('/opd/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get OPD statistics.
   */
  getStats: async () => {
    if (!USE_BACKEND) {
      return { totalOPDs: 12, vitalsRecorded: 24, consultsDone: 18, medicinesGiven: 15 };
    }
    return apiFetch('/opd/stats');
  },
};

// ─── Vitals / Consults / Medicine ────────────────────

export const clinicalService = {
  recordVitals: async (patientId: string, vitals: Record<string, any>) => {
    if (!USE_BACKEND) return { success: true };
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/vitals`, {
      method: 'POST',
      body: JSON.stringify(vitals),
    });
  },

  recordConsult: async (patientId: string, data: Record<string, any>) => {
    if (!USE_BACKEND) return { success: true };
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/consult`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  dispenseMedicine: async (patientId: string, medicines: any[]) => {
    if (!USE_BACKEND) return { success: true };
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/medicines`, {
      method: 'POST',
      body: JSON.stringify({ medicines }),
    });
  },
};

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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// ─── Helper ──────────────────────────────────────────

const headers = () => ({
  'Content-Type': 'application/json',
  ...(API_KEYS.apiKey !== 'YOUR_API_KEY' ? { Authorization: `Bearer ${API_KEYS.apiKey}` } : {}),
});

const apiFetch = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers(), ...(options.headers as Record<string, string> || {}) },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, any>;
    throw new Error(body.detail || body.message || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.toLowerCase().includes('application/json')) {
    const json = await res.json();
    return json as T;
  }

  const text = await res.text();
  return text as T;
};

const normalizeStats = (raw: any) => {
  if (!raw || typeof raw !== 'object') return undefined;
  const patients = typeof raw.patients === 'number' ? raw.patients : undefined;
  const consults = typeof raw.consults === 'number' ? raw.consults : undefined;
  if (patients === undefined && consults === undefined) return undefined;
  return { patients, consults };
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
  },

  /**
   * Register a new account (doctor or volunteer).
   */
  register: async (
    email: string,
    password: string,
    fullName: string,
    memberId: string,
    mobile: string,
    photoUri?: string | null,
    role: 'doctor' | 'volunteer' = 'doctor',
  ) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      // Suppress auth listener so dashboard doesn't flash
      const { setRegistering } = require('./AuthContext');
      setRegistering(true);
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await updateProfile(userCred.user, {
            displayName: fullName,
          });
        } catch (err) {
          console.warn('Skipping Firebase profile metadata update:', err);
        }
        await setDoc(doc(db, 'users', userCred.user.uid), {
          fullName,
          memberId,
          email,
          mobile,
          role,
          createdAt: new Date().toISOString(),
        });
        // Sign out so the user is redirected to Login instead of auto-entering dashboard
        await auth.signOut();
      } finally {
        setRegistering(false);
      }
      return {
        success: true,
        user: { id: '', name: fullName, email, memberId, mobile, photoUri: photoUri || '', role },
      };
    }

    throw new Error('Registration requires Firebase backend');
  },

  /**
   * Get user profile from Firestore (checks 'users' collection, falls back to 'doctors').
   */
  getUserProfile: async (uid: string) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      const currentAuthUser = auth.currentUser;
      // Check 'users' collection first
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          fullName: data.fullName || currentAuthUser?.displayName || '',
          memberId: data.memberId || data.doctorId || '',
          email: data.email || currentAuthUser?.email || '',
          mobile: data.mobile || '',
          photoUri: data.photoUri || data.photoURL || currentAuthUser?.photoURL || '',
          role: data.role || 'doctor',
          stats: normalizeStats(data.stats),
        } as {
          fullName: string;
          memberId: string;
          email: string;
          mobile?: string;
          photoUri?: string;
          role: 'doctor' | 'volunteer';
          stats?: { patients?: number; consults?: number };
        };
      }
      // Fallback: check legacy 'doctors' collection
      const docSnap = await getDoc(doc(db, 'doctors', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          fullName: data.fullName || currentAuthUser?.displayName || '',
          memberId: data.doctorId || data.memberId || '',
          email: data.email || currentAuthUser?.email || '',
          mobile: data.mobile || '',
          photoUri: data.photoUri || currentAuthUser?.photoURL || '',
          role: 'doctor' as const,
          stats: normalizeStats(data.stats),
        };
      }
    }
    return null;
  },

  /**
   * Update user profile fields in Firestore.
   */
  updateUserProfile: async (uid: string, updates: { fullName?: string; mobile?: string; photoUri?: string }) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      const usersRef = doc(db, 'users', uid);
      const doctorsRef = doc(db, 'doctors', uid);
      const [usersSnap, doctorsSnap] = await Promise.all([getDoc(usersRef), getDoc(doctorsRef)]);

      const baseData = usersSnap.exists()
        ? usersSnap.data()
        : doctorsSnap.exists()
          ? doctorsSnap.data()
          : {};

      const authUser = auth.currentUser;
      const normalizedUserPayload = {
        fullName: updates.fullName ?? baseData.fullName ?? authUser?.displayName ?? '',
        memberId: baseData.memberId || baseData.doctorId || '',
        email: baseData.email || authUser?.email || '',
        mobile: updates.mobile ?? baseData.mobile ?? '',
        photoUri: updates.photoUri ?? baseData.photoUri ?? baseData.photoURL ?? authUser?.photoURL ?? '',
        role: baseData.role || 'doctor',
        updatedAt: new Date().toISOString(),
      };

      const writes: Array<Promise<unknown>> = [
        setDoc(usersRef, normalizedUserPayload, { merge: true }),
      ];

      if (doctorsSnap.exists()) {
        const doctorUpdates: Record<string, string> = {
          updatedAt: new Date().toISOString(),
        };
        if (typeof updates.fullName === 'string') doctorUpdates.fullName = updates.fullName;
        if (typeof updates.mobile === 'string') doctorUpdates.mobile = updates.mobile;
        if (typeof updates.photoUri === 'string') doctorUpdates.photoUri = updates.photoUri;

        writes.push(setDoc(doctorsRef, doctorUpdates, { merge: true }));
      }

      await Promise.all(writes);
      return { success: true };
    }

    return { success: true };
  },

  /**
   * @deprecated Use getUserProfile instead
   */
  getDoctorProfile: async (uid: string) => {
    return authService.getUserProfile(uid);
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

  changePassword: async (newPassword: string) => {
    const hasValidFirebaseConfig = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

    if (hasValidFirebaseConfig && USE_BACKEND) {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found. Please log in again.');
      }
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    }

    throw new Error('Password update requires Firebase backend');
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
  created_by: string;
  updated_by: string;
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
    created_by?: string;
    updated_by?: string;
  }): Promise<PatientApiData> => {
    return apiFetch<PatientApiData>('/patients', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth || '',
        age: data.age,
        mobile_number: data.mobile_number || '',
        address: data.address || '',
        photo_url: data.photo_url || '',
        created_by: data.created_by || '1',
        updated_by: data.updated_by || '1',
      }),
    });
  },

  /**
   * Get all patients (paginated).
   * GET /patients?skip=0&limit=100
   */
  getAll: async (skip = 0, limit = 100): Promise<PatientApiData[]> => {
    const res = await apiFetch<any>(`/patients?skip=${skip}&limit=${limit}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.patients)) return res.patients;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  },

  /**
   * Get single patient by ID.
   * GET /patients/{patient_id}
   */
  getById: async (patientId: number): Promise<PatientApiData> => {
    return apiFetch<PatientApiData>(`/patients/${patientId}`);
  },

  /**
   * Update a patient.
   * PUT /patients/{patient_id}
   */
  update: async (patientId: number, data: Partial<Omit<PatientApiData, 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>> & { updated_by: string }): Promise<PatientApiData> => {
    return apiFetch<PatientApiData>(`/patients/${patientId}`, {
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
      const body = (await res.json().catch(() => ({}))) as Record<string, any>;
      throw new Error(body.detail || `API error: ${res.status}`);
    }
  },

  /**
   * Search patients by name or mobile number.
   * GET /patients/search/{search_term}
   */
  search: async (searchTerm: string, skip = 0, limit = 100): Promise<PatientApiData[]> => {
    return apiFetch<PatientApiData[]>(`/patients/search/${encodeURIComponent(searchTerm)}?skip=${skip}&limit=${limit}`);
  },
};

// ─── OPD ─────────────────────────────────────────────

export const opdService = {
  /**
   * Start a new OPD session.
   * POST /opd/sessions
   */
  start: async (data: { village: string; deskRole: string; opdId: string; pin: string; createdBy?: string }) => {
    if (!USE_BACKEND) {
      return { success: true, opdId: data.opdId, pin: data.pin };
    }
    const result = await apiFetch<any>('/opd/sessions', {
      method: 'POST',
      body: JSON.stringify({
        opd_id: data.opdId,
        pin: data.pin,
        village: data.village,
        desk_role: data.deskRole,
        created_by: data.createdBy || '',
      }),
    });
    return { success: true, opdId: result.opd_id || data.opdId, pin: result.pin || data.pin };
  },

  /**
   * Join an OPD session by 6-digit PIN.
   * GET /opd/sessions/{pin}
   */
  joinByPin: async (pin: string) => {
    if (!USE_BACKEND) {
      return {
        opdId: `OPD-RAMAGRI-250622`,
        pin,
        village: 'Ramagri',
        deskRole: 'registration',
        status: 'active',
        patients: [
          { id: 'P1234', name: 'Dharamshinhbhai Prajapati', gender: 'Male', age: 58, token: 1, status: 'waiting' },
          { id: 'P1235', name: 'Manguben Solanki', gender: 'Male', age: 58, token: 2, status: 'waiting' },
        ],
        createdAt: new Date().toISOString(),
      };
    }
    const data = await apiFetch<any>(`/opd/sessions/${encodeURIComponent(pin)}`);
    if (!data) return null;
    return {
      opdId: data.opd_id || data.opdId || '',
      pin: data.pin || pin,
      village: data.village || '',
      deskRole: data.desk_role || data.deskRole || '',
      status: data.status || 'active',
      patients: Array.isArray(data.patients) ? data.patients : [],
      createdAt: data.created_at || data.createdAt || '',
    };
  },

  /**
   * Add a patient to an OPD session.
   * POST /opd/sessions/{pin}/patients
   */
  addPatientToSession: async (pin: string, patient: { id: string; name: string; gender: string; age: number; token: number; status?: string; notes?: string }) => {
    if (!USE_BACKEND) return { success: true };
    await apiFetch(`/opd/sessions/${encodeURIComponent(pin)}/patients`, {
      method: 'POST',
      body: JSON.stringify({
        id: patient.id,
        name: patient.name,
        gender: patient.gender,
        age: patient.age,
        token: patient.token,
        status: patient.status || 'waiting',
        notes: patient.notes || '',
      }),
    });
    return { success: true };
  },

  /**
   * Update the status/notes of a patient in the OPD queue.
   * PATCH /opd/sessions/{pin}/patients/{patientId}
   */
  updatePatientStatus: async (pin: string, patientId: string, updates: { status?: string; notes?: string }) => {
    if (!USE_BACKEND) return { success: true };
    const result = await apiFetch<any>(`/opd/sessions/${encodeURIComponent(pin)}/patients/${encodeURIComponent(patientId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return { success: true, patient: result };
  },

  /**
   * End an OPD session.
   * Uses updatePatientStatus as workaround (no dedicated endpoint in mock API).
   */
  endSession: async (_pin: string) => {
    return { success: true };
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

  getHistory: async (patientId: string) => {
    if (!USE_BACKEND) return [];
    return apiFetch<any[]>(`/patients/${encodeURIComponent(patientId)}/history`);
  },
};

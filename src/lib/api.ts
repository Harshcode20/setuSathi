/**
 * =====================================================
 *  SETU SATHI — API Service
 * =====================================================
 *
 * Centralized API client. All backend calls go through here.
 * Backend must be enabled for app features.
 *
 * To connect a real backend:
 *   1. Set USE_BACKEND = true in config.ts
 *   2. Set API_BASE_URL to your server
 *   3. Implement the real fetch calls below
 * =====================================================
 */

import { USE_BACKEND, API_BASE_URL, API_KEYS, API_TIMEOUT } from './config';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

// ─── Helper ──────────────────────────────────────────

let authToken: string | null = null;

const headers = () => ({
  'Content-Type': 'application/json',
  ...(authToken
    ? { Authorization: `Bearer ${authToken}` }
    : API_KEYS.apiKey !== 'YOUR_API_KEY'
      ? { Authorization: `Bearer ${API_KEYS.apiKey}` }
      : {}),
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const backendUnavailableMessage = () =>
  `Unable to connect to backend at ${API_BASE_URL}. Make sure the backend server is running and reachable from this app.`;

const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${API_TIMEOUT}ms while contacting backend.`);
    }
    throw new Error(backendUnavailableMessage());
  } finally {
    clearTimeout(timeout);
  }
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers(), ...(options.headers as Record<string, string> || {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `API error: ${res.status}`);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.toLowerCase().includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  return text as unknown;
};

type BackendAuthUser = {
  id: number;
  full_name: string;
  member_id: string;
  email: string;
  mobile?: string;
  photo_url?: string;
  role: 'doctor' | 'volunteer';
};

type BackendAuthLoginResponse = {
  success: boolean;
  access_token: string;
  user: BackendAuthUser;
};

const exchangeFirebaseTokenForSession = async (idToken: string): Promise<BackendAuthLoginResponse> => {
  return await apiFetch('/auth/firebase-login', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  }) as BackendAuthLoginResponse;
};

const applyBackendSession = (result: BackendAuthLoginResponse) => {
  setAuthToken(result.access_token);

  const sessionUser = {
    uid: String(result.user.id),
    email: result.user.email,
    displayName: result.user.full_name,
  };

  const mappedProfile = {
    fullName: result.user.full_name,
    memberId: result.user.member_id,
    email: result.user.email,
    mobile: result.user.mobile || '',
    photoUri: result.user.photo_url || '',
    role: result.user.role,
  } as const;

  const { setAuthSession } = require('./AuthContext');
  setAuthSession(sessionUser, mappedProfile);

  return sessionUser;
};

export const authService = {
  /**
   * Login with Firebase email/password (email or member ID input), then create backend session.
   */
  login: async (identifier: string, password: string) => {
    if (USE_BACKEND) {
      const normalizedIdentifier = identifier.trim();
      let normalizedEmail = normalizedIdentifier.toLowerCase();

      if (!normalizedIdentifier.includes('@')) {
        const resolved = await apiFetch('/auth/resolve-login-identifier', {
          method: 'POST',
          body: JSON.stringify({ identifier: normalizedIdentifier }),
        }) as {
          success: boolean;
          email: string;
        };

        normalizedEmail = String(resolved.email || '').trim().toLowerCase();
      }

      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        throw new Error('Invalid login identifier. Use your email or member ID.');
      }

      const firebaseCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const idToken = await firebaseCredential.user.getIdToken();

      try {
        const result = await exchangeFirebaseTokenForSession(idToken);
        const sessionUser = applyBackendSession(result);

        return {
          success: true,
          user: {
            id: sessionUser.uid,
            name: sessionUser.displayName,
            email: sessionUser.email,
          },
        };
      } catch (err) {
        await signOut(auth).catch(() => {});
        throw err;
      }
    }

    throw new Error('Backend is disabled. Enable backend to login.');
  },

  /**
   * Restore backend session from an already-authenticated Firebase user.
   */
  resumeSession: async () => {
    if (!USE_BACKEND) {
      throw new Error('Backend is disabled. Enable backend to restore session.');
    }

    if (!auth.currentUser) {
      throw new Error('No active Firebase session found.');
    }

    const idToken = await auth.currentUser.getIdToken();
    const result = await exchangeFirebaseTokenForSession(idToken);
    const sessionUser = applyBackendSession(result);

    return {
      success: true,
      user: {
        id: sessionUser.uid,
        name: sessionUser.displayName,
        email: sessionUser.email,
      },
    };
  },

  /**
   * Register Firebase credentials first, then save profile in Postgres.
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
    if (USE_BACKEND) {
      const normalizedEmail = email.trim().toLowerCase();
      const firebaseCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      try {
        const result = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            member_id: memberId,
            email: normalizedEmail,
            mobile,
            password,
            role,
            photo_url: photoUri || null,
          }),
        }) as {
          success: boolean;
          user: {
            id: number;
            full_name: string;
            member_id: string;
            email: string;
            mobile?: string;
            photo_url?: string;
            role: 'doctor' | 'volunteer';
          };
        };

        await signOut(auth).catch(() => {});
        setAuthToken(null);
        const { clearAuthSession } = require('./AuthContext');
        clearAuthSession();

        return {
          success: result.success,
          user: {
            id: String(result.user.id),
            name: result.user.full_name,
            email: result.user.email,
            memberId: result.user.member_id,
            mobile: result.user.mobile || '',
            photoUri: result.user.photo_url || '',
            role: result.user.role,
          },
        };
      } catch (err) {
        try {
          if (auth.currentUser?.uid === firebaseCredential.user.uid) {
            await deleteUser(firebaseCredential.user);
          }
        } catch {
        }
        await signOut(auth).catch(() => {});
        throw err;
      }
    }

    throw new Error('Registration is available only when backend is enabled');
  },

  /**
   * Get current user profile from backend.
   */
  getUserProfile: async (_uid: string) => {
    if (!USE_BACKEND || !authToken) {
      return null;
    }

    const data = await apiFetch('/users/me') as {
      id: number;
      full_name: string;
      member_id: string;
      email: string;
      mobile?: string;
      photo_url?: string;
      role: 'doctor' | 'volunteer';
    };

    return {
      fullName: data.full_name,
      memberId: data.member_id,
      email: data.email,
      mobile: data.mobile || '',
      photoUri: data.photo_url || '',
      role: data.role,
    } as { fullName: string; memberId: string; email: string; mobile?: string; photoUri?: string; role: 'doctor' | 'volunteer' };
  },

  /**
   * Update current user profile fields in backend.
   */
  updateUserProfile: async (_uid: string, updates: { fullName?: string; mobile?: string; photoUri?: string }) => {
    if (!USE_BACKEND || !authToken) {
      throw new Error('Please login again to update profile.');
    }

    await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        ...(typeof updates.fullName === 'string' ? { full_name: updates.fullName } : {}),
        ...(typeof updates.mobile === 'string' ? { mobile: updates.mobile } : {}),
        ...(typeof updates.photoUri === 'string' ? { photo_url: updates.photoUri } : {}),
      }),
    });

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
    if (USE_BACKEND) {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { success: true };
    }

    throw new Error('Backend is disabled. Enable backend to reset password.');
  },

  /**
   * Logout current user.
   */
  logout: async () => {
    await signOut(auth).catch(() => {});
    setAuthToken(null);
    const { clearAuthSession } = require('./AuthContext');
    clearAuthSession();
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
   * Create a new patient, or reuse an existing patient when backend detects duplicate.
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
  }): Promise<{ patient: PatientApiData; reusedExisting: boolean }> => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: headers(),
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

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || body.message || `API error: ${res.status}`);
    }

    const patient = await res.json() as PatientApiData;
    return {
      patient,
      reusedExisting: res.status === 200,
    };
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
    const res = await fetchWithTimeout(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: headers(),
    });
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

export type QueueStatus = 'waiting_vitals' | 'waiting_doctor' | 'consult_done' | 'completed';

export const opdService = {
  /**
   * Start a new OPD session.
   * Returns the opdId and 6-digit pin.
   */
  start: async (data: { village: string; deskRole: string; opdId: string; pin: string; createdBy?: string }) => {
    if (USE_BACKEND) {
      const result = await apiFetch('/opd/sessions', {
        method: 'POST',
        body: JSON.stringify({
          opd_id: data.opdId,
          pin: data.pin,
          village: data.village,
          desk_role: data.deskRole,
          created_by: data.createdBy || null,
        }),
      }) as {
        success: boolean;
        opd_id: string;
        pin: string;
      };

      return {
        success: result.success,
        opdId: result.opd_id,
        pin: result.pin,
      };
    }

    throw new Error('Backend is disabled. Enable backend to start OPD session.');
  },

  /**
   * Join an OPD session by 6-digit PIN.
   * Returns the OPD session data if found.
   */
  joinByPin: async (pin: string) => {
    if (USE_BACKEND) {
      try {
        const result = await apiFetch(`/opd/sessions/${encodeURIComponent(pin)}`) as {
          opd_id: string;
          pin: string;
          village: string;
          desk_role: string;
          status: string;
          patients: Array<{
            id: string;
            name: string;
            gender: string;
            age: number;
            token: number;
            queue_status?: QueueStatus;
            complaints?: string[];
            registration_notes?: string | null;
          }>;
          created_at: string;
        };

        return {
          opdId: result.opd_id,
          pin: result.pin,
          village: result.village,
          deskRole: result.desk_role,
          status: result.status,
          patients: (result.patients || []).map((patient) => ({
            id: patient.id,
            name: patient.name,
            gender: patient.gender,
            age: patient.age,
            token: patient.token,
            queueStatus: patient.queue_status || 'waiting_vitals',
            complaints: Array.isArray(patient.complaints) ? patient.complaints : [],
            registrationNotes: patient.registration_notes || '',
          })),
          createdAt: result.created_at,
        } as {
          opdId: string;
          pin: string;
          village: string;
          deskRole: string;
          status: string;
          patients: Array<{
            id: string;
            name: string;
            gender: string;
            age: number;
            token: number;
            queueStatus?: QueueStatus;
            complaints?: string[];
            registrationNotes?: string;
          }>;
          createdAt: string;
        };
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('404') || msg.includes('not found')) {
          return null;
        }
        throw err;
      }
    }

    throw new Error('Backend is disabled. Enable backend to join OPD session.');
  },

  /**
   * Add a patient to an OPD session.
   */
  addPatientToSession: async (pin: string, patient: {
    id: string;
    name: string;
    gender: string;
    age: number;
    token: number;
    complaints?: string[];
    registrationNotes?: string;
  }) => {
    if (USE_BACKEND) {
      await apiFetch(`/opd/sessions/${encodeURIComponent(pin)}/patients`, {
        method: 'POST',
        body: JSON.stringify({
          id: patient.id,
          name: patient.name,
          gender: patient.gender,
          age: patient.age,
          token: patient.token,
          complaints: patient.complaints || [],
          registration_notes: patient.registrationNotes || null,
        }),
      });
      return { success: true };
    }
    throw new Error('Backend is disabled. Enable backend to add patient to OPD session.');
  },

  updatePatientQueueStatus: async (pin: string, token: number, status: QueueStatus) => {
    if (USE_BACKEND) {
      await apiFetch(`/opd/sessions/${encodeURIComponent(pin)}/patients/${token}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return { success: true };
    }
    throw new Error('Backend is disabled. Enable backend to update patient queue status.');
  },

  /**
   * Get OPD statistics.
   */
  getStats: async () => {
    if (!USE_BACKEND) {
      throw new Error('Backend is disabled. Enable backend to load OPD stats.');
    }
    return apiFetch('/opd/stats');
  },
};

// ─── Vitals / Consults / Medicine ────────────────────

export const clinicalService = {
  recordVitals: async (patientId: string, vitals: Record<string, any>) => {
    if (!USE_BACKEND) throw new Error('Backend is disabled. Enable backend to record vitals.');
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/vitals`, {
      method: 'POST',
      body: JSON.stringify(vitals),
    });
  },

  recordConsult: async (patientId: string, data: Record<string, any>) => {
    if (!USE_BACKEND) throw new Error('Backend is disabled. Enable backend to record consult.');
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/consult`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  dispenseMedicine: async (patientId: string, medicines: any[]) => {
    if (!USE_BACKEND) throw new Error('Backend is disabled. Enable backend to dispense medicines.');
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/medicines`, {
      method: 'POST',
      body: JSON.stringify({ medicines }),
    });
  },

  getPatientHistory: async (patientId: string) => {
    if (!USE_BACKEND) throw new Error('Backend is disabled. Enable backend to load patient history.');
    return apiFetch(`/patients/${encodeURIComponent(patientId)}/history`);
  },
};

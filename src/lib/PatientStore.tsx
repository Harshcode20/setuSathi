import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { patientService, PatientApiData } from './api';
import { USE_BACKEND } from './config';

export interface Patient {
  id: string;
  patientId: number;
  name: string;
  gender: string;
  age: number;
  dob?: string;
  mobile?: string;
  address?: string;
  village?: string;
  photoUri?: string;
  lastVisit: string;
  registeredAt: string;
}

type AddPatientResult = {
  patient: Patient;
  reusedExisting: boolean;
};

interface PatientStoreValue {
  patients: Patient[];
  loading: boolean;
  addPatient: (p: Omit<Patient, 'id' | 'patientId' | 'registeredAt'>) => Promise<AddPatientResult>;
  refreshPatients: () => Promise<void>;
  searchPatients: (term: string) => Promise<Patient[]>;
  getPatientById: (patientId: number) => Promise<Patient | null>;
  updatePatient: (patientId: number, updates: Partial<Omit<Patient, 'id' | 'patientId' | 'registeredAt'>>) => Promise<Patient>;
  deletePatient: (patientId: number) => Promise<void>;
}

const mapApiToPatient = (p: PatientApiData): Patient => ({
  id: `P${p.patient_id}`,
  patientId: p.patient_id,
  name: p.full_name,
  gender: p.gender,
  age: p.age,
  dob: p.date_of_birth || undefined,
  mobile: p.mobile_number || undefined,
  address: p.address || undefined,
  photoUri: p.photo_url || undefined,
  lastVisit: p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
  registeredAt: p.created_at ? p.created_at.split('T')[0] : '',
});

const normalizeDateForApi = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const ddmmyyyyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }

  return value;
};

const defaultPatients: Patient[] = [];

const useRealApi = USE_BACKEND;

const PatientContext = createContext<PatientStoreValue>({
  patients: defaultPatients,
  loading: false,
  addPatient: async () => {
    throw new Error('Patient store is not initialized');
  },
  refreshPatients: async () => {},
  searchPatients: async () => [],
  getPatientById: async () => null,
  updatePatient: async () => {
    throw new Error('Patient store is not initialized');
  },
  deletePatient: async () => {},
});

export const usePatientStore = () => useContext(PatientContext);

export const PatientProvider = ({ children }: { children: React.ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(useRealApi);

  const refreshPatients = useCallback(async () => {
    if (!useRealApi) return;
    setLoading(true);
    try {
      const data = await patientService.getAll();
      setPatients(data.map(mapApiToPatient));
    } catch (err) {
      console.warn('Failed to fetch patients:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (useRealApi) {
      refreshPatients();
    }
  }, [refreshPatients]);

  const addPatient = async (data: Omit<Patient, 'id' | 'patientId' | 'registeredAt'>): Promise<AddPatientResult> => {
    if (useRealApi) {
      const result = await patientService.create({
        full_name: data.name,
        gender: data.gender,
        age: data.age,
        date_of_birth: normalizeDateForApi(data.dob),
        mobile_number: data.mobile,
        address: data.address,
        photo_url: data.photoUri,
      });
      const newPatient = mapApiToPatient(result.patient);
      setPatients((prev) => {
        const existingIndex = prev.findIndex((patient) => patient.patientId === newPatient.patientId);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = newPatient;
          return next;
        }
        return [newPatient, ...prev];
      });
      return {
        patient: newPatient,
        reusedExisting: result.reusedExisting,
      };
    }

    throw new Error('Backend is disabled. Enable backend to add patient.');
  };

  const searchPatients = useCallback(async (term: string): Promise<Patient[]> => {
    if (!useRealApi || !term.trim()) return [];
    try {
      const data = await patientService.search(term.trim());
      return data.map(mapApiToPatient);
    } catch {
      return [];
    }
  }, []);

  const getPatientById = useCallback(async (patientId: number): Promise<Patient | null> => {
    if (!useRealApi) {
      return null;
    }

    try {
      const data = await patientService.getById(patientId);
      return mapApiToPatient(data);
    } catch {
      return null;
    }
  }, [patients]);

  const updatePatient = useCallback(async (
    patientId: number,
    updates: Partial<Omit<Patient, 'id' | 'patientId' | 'registeredAt'>>,
  ): Promise<Patient> => {
    if (useRealApi) {
      const payload: {
        full_name?: string;
        gender?: string;
        date_of_birth?: string;
        age?: number;
        mobile_number?: string;
        address?: string;
        photo_url?: string;
        updated_by: number;
      } = {
        updated_by: 1,
      };

      if (typeof updates.name === 'string') payload.full_name = updates.name;
      if (typeof updates.gender === 'string') payload.gender = updates.gender;
      if (typeof updates.dob === 'string') payload.date_of_birth = normalizeDateForApi(updates.dob);
      if (typeof updates.age === 'number') payload.age = updates.age;
      if (typeof updates.mobile === 'string') payload.mobile_number = updates.mobile;
      if (typeof updates.address === 'string') payload.address = updates.address;
      if (typeof updates.photoUri === 'string') payload.photo_url = updates.photoUri;

      const updated = mapApiToPatient(await patientService.update(patientId, payload));
      setPatients((prev) => prev.map((p) => (p.patientId === patientId ? updated : p)));
      return updated;
    }

    throw new Error('Backend is disabled. Enable backend to update patient.');
  }, [patients]);

  const deletePatient = async (patientId: number): Promise<void> => {
    if (useRealApi) {
      await patientService.delete(patientId);
      setPatients((prev) => prev.filter((p) => p.patientId !== patientId));
      return;
    }

    throw new Error('Backend is disabled. Enable backend to delete patient.');
  };

  return (
    <PatientContext.Provider value={{ patients, loading, addPatient, refreshPatients, searchPatients, getPatientById, updatePatient, deletePatient }}>
      {children}
    </PatientContext.Provider>
  );
};

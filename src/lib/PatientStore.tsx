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

interface PatientStoreValue {
  patients: Patient[];
  loading: boolean;
  addPatient: (p: Omit<Patient, 'id' | 'patientId' | 'registeredAt'>) => Promise<Patient>;
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

const defaultPatients: Patient[] = [
  { id: 'P1001', patientId: 1001, name: 'Kaminiben Sarvaiya', gender: 'Female', age: 58, village: 'Ramagri', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1002', patientId: 1002, name: 'Kamlesh Patel', gender: 'Female', age: 45, village: 'Gediya', lastVisit: '07 Mar 2026', registeredAt: '2026-03-07' },
  { id: 'P1003', patientId: 1003, name: 'Dharamshinhbhai Prajapati', gender: 'Male', age: 58, village: 'Ramagri', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1004', patientId: 1004, name: 'Manguben Solanki', gender: 'Female', age: 62, village: 'Karela', lastVisit: '06 Mar 2026', registeredAt: '2026-03-06' },
  { id: 'P1005', patientId: 1005, name: 'Ramilaben Thakor', gender: 'Female', age: 50, village: 'Limbad', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1006', patientId: 1006, name: 'Ramesh Solanki', gender: 'Male', age: 45, village: 'Kherva', lastVisit: '05 Mar 2026', registeredAt: '2026-03-05' },
  { id: 'P1007', patientId: 1007, name: 'Bhavna Desai', gender: 'Female', age: 32, village: 'Modhwana', lastVisit: '04 Mar 2026', registeredAt: '2026-03-04' },
  { id: 'P1008', patientId: 1008, name: 'Sureshbhai Patel', gender: 'Male', age: 67, village: 'Ingrodi', lastVisit: '03 Mar 2026', registeredAt: '2026-03-03' },
  { id: 'P1009', patientId: 1009, name: 'Jyotiben Makwana', gender: 'Female', age: 41, village: 'Gediya', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1010', patientId: 1010, name: 'Amrutbhai Thakor', gender: 'Male', age: 55, village: 'Ramagri', lastVisit: '07 Mar 2026', registeredAt: '2026-03-07' },
];

const useRealApi = USE_BACKEND;

const PatientContext = createContext<PatientStoreValue>({
  patients: defaultPatients,
  loading: false,
  addPatient: async () => defaultPatients[0],
  refreshPatients: async () => {},
  searchPatients: async () => [],
  getPatientById: async () => null,
  updatePatient: async () => defaultPatients[0],
  deletePatient: async () => {},
});

export const usePatientStore = () => useContext(PatientContext);

export const PatientProvider = ({ children }: { children: React.ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(useRealApi ? [] : defaultPatients);
  const [loading, setLoading] = useState(useRealApi);
  let nextId = patients.length + 1;

  const refreshPatients = useCallback(async () => {
    if (!useRealApi) return;
    setLoading(true);
    try {
      const data = await patientService.getAll();
      setPatients(data.map(mapApiToPatient));
    } catch (err) {
      console.warn('Failed to fetch patients, using demo data:', err);
      setPatients(defaultPatients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (useRealApi) {
      refreshPatients();
    }
  }, [refreshPatients]);

  const addPatient = async (data: Omit<Patient, 'id' | 'patientId' | 'registeredAt'>): Promise<Patient> => {
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
      const newPatient = mapApiToPatient(result);
      setPatients((prev) => [newPatient, ...prev]);
      return newPatient;
    }

    // Demo/offline mode
    nextId++;
    const today = new Date();
    const newPatient: Patient = {
      ...data,
      id: `P${(1000 + nextId).toString()}`,
      patientId: 1000 + nextId,
      registeredAt: today.toISOString().split('T')[0],
    };
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
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
      return patients.find((p) => p.patientId === patientId) || null;
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

    const existing = patients.find((p) => p.patientId === patientId);
    if (!existing) throw new Error('Patient not found');

    const updated = { ...existing, ...updates };
    setPatients((prev) => prev.map((p) => (p.patientId === patientId ? updated : p)));
    return updated;
  }, [patients]);

  const deletePatient = async (patientId: number): Promise<void> => {
    if (useRealApi) {
      await patientService.delete(patientId);
    }
    setPatients((prev) => prev.filter((p) => p.patientId !== patientId));
  };

  return (
    <PatientContext.Provider value={{ patients, loading, addPatient, refreshPatients, searchPatients, getPatientById, updatePatient, deletePatient }}>
      {children}
    </PatientContext.Provider>
  );
};

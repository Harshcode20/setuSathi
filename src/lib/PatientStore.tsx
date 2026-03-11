import React, { createContext, useContext, useState } from 'react';

export interface Patient {
  id: string;
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
  addPatient: (p: Omit<Patient, 'id' | 'registeredAt'>) => Patient;
}

const defaultPatients: Patient[] = [
  { id: 'P1001', name: 'Kaminiben Sarvaiya', gender: 'Female', age: 58, village: 'Ramagri', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1002', name: 'Kamlesh Patel', gender: 'Female', age: 45, village: 'Gediya', lastVisit: '07 Mar 2026', registeredAt: '2026-03-07' },
  { id: 'P1003', name: 'Dharamshinhbhai Prajapati', gender: 'Male', age: 58, village: 'Ramagri', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1004', name: 'Manguben Solanki', gender: 'Female', age: 62, village: 'Karela', lastVisit: '06 Mar 2026', registeredAt: '2026-03-06' },
  { id: 'P1005', name: 'Ramilaben Thakor', gender: 'Female', age: 50, village: 'Limbad', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1006', name: 'Ramesh Solanki', gender: 'Male', age: 45, village: 'Kherva', lastVisit: '05 Mar 2026', registeredAt: '2026-03-05' },
  { id: 'P1007', name: 'Bhavna Desai', gender: 'Female', age: 32, village: 'Modhwana', lastVisit: '04 Mar 2026', registeredAt: '2026-03-04' },
  { id: 'P1008', name: 'Sureshbhai Patel', gender: 'Male', age: 67, village: 'Ingrodi', lastVisit: '03 Mar 2026', registeredAt: '2026-03-03' },
  { id: 'P1009', name: 'Jyotiben Makwana', gender: 'Female', age: 41, village: 'Gediya', lastVisit: '08 Mar 2026', registeredAt: '2026-03-08' },
  { id: 'P1010', name: 'Amrutbhai Thakor', gender: 'Male', age: 55, village: 'Ramagri', lastVisit: '07 Mar 2026', registeredAt: '2026-03-07' },
];

const PatientContext = createContext<PatientStoreValue>({
  patients: defaultPatients,
  addPatient: () => defaultPatients[0],
});

export const usePatientStore = () => useContext(PatientContext);

export const PatientProvider = ({ children }: { children: React.ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(defaultPatients);
  let nextId = patients.length + 1;

  const addPatient = (data: Omit<Patient, 'id' | 'registeredAt'>): Patient => {
    nextId++;
    const today = new Date();
    const newPatient: Patient = {
      ...data,
      id: `P${(1000 + nextId).toString()}`,
      registeredAt: today.toISOString().split('T')[0],
    };
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  return (
    <PatientContext.Provider value={{ patients, addPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

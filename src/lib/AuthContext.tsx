import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { authService } from './api';

type DoctorProfile = {
  fullName: string;
  doctorId: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  doctorProfile: DoctorProfile | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, doctorProfile: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await authService.getDoctorProfile(firebaseUser.uid);
        setDoctorProfile(profile);
      } else {
        setDoctorProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, doctorProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { authService } from './api';
import { FORCE_LOGIN_ON_APP_START } from './config';

type UserProfile = {
  fullName: string;
  memberId: string;
  email: string;
  mobile?: string;
  photoUri?: string;
  role: 'doctor' | 'volunteer';
  stats?: {
    patients?: number;
    consults?: number;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  refreshUserProfile: () => Promise<void>;
  /** @deprecated Use userProfile instead */
  doctorProfile: UserProfile | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userProfile: null, refreshUserProfile: async () => {}, doctorProfile: null });

export const useAuth = () => useContext(AuthContext);

// Flag to suppress auth listener during registration
let _isRegistering = false;
export const setRegistering = (v: boolean) => { _isRegistering = v; };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const refreshUserProfile = async () => {
    if (!auth.currentUser) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await authService.getUserProfile(auth.currentUser.uid);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      if (FORCE_LOGIN_ON_APP_START) {
        try {
          await auth.signOut();
        } catch (err) {
          console.warn('Failed to clear persisted auth session:', err);
        }
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        // Skip auth state changes while registration is in progress
        if (_isRegistering) return;
        setUser(firebaseUser);
        if (firebaseUser) {
          try {
            const profile = await authService.getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (err) {
            console.warn('Failed to fetch user profile:', err);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, refreshUserProfile, doctorProfile: userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

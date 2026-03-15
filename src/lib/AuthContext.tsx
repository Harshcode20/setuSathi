import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from './api';
import { FORCE_LOGIN_ON_APP_START } from './config';
import { auth } from './firebase';

type UserProfile = {
  fullName: string;
  memberId: string;
  email: string;
  mobile?: string;
  photoUri?: string;
  role: 'doctor' | 'volunteer';
};

type AppUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  userProfile: UserProfile | null;
  refreshUserProfile: () => Promise<void>;
  /** @deprecated Use userProfile instead */
  doctorProfile: UserProfile | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userProfile: null, refreshUserProfile: async () => {}, doctorProfile: null });

export const useAuth = () => useContext(AuthContext);

let setUserStateRef: ((user: AppUser | null) => void) | null = null;
let setUserProfileStateRef: ((profile: UserProfile | null) => void) | null = null;

export const setAuthSession = (user: AppUser | null, profile?: UserProfile | null) => {
  if (setUserStateRef) {
    setUserStateRef(user);
  }

  if (profile !== undefined && setUserProfileStateRef) {
    setUserProfileStateRef(profile);
  }
};

export const clearAuthSession = () => {
  setAuthSession(null, null);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const refreshUserProfile = async () => {
    if (!user?.uid) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await authService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      setUserStateRef = setUser;
      setUserProfileStateRef = setUserProfile;

      if (FORCE_LOGIN_ON_APP_START) {
        try {
          await authService.logout();
        } catch (err) {
          console.warn('Failed to clear persisted auth session:', err);
        }

        if (mounted) {
          setLoading(false);
        }
        return;
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!mounted) return;

        if (!firebaseUser) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        try {
          await authService.resumeSession();
        } catch (err) {
          console.warn('Failed to restore auth session:', err);
          try {
            await authService.logout();
          } catch {
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      });
    };

    initAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      setUserStateRef = null;
      setUserProfileStateRef = null;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, refreshUserProfile, doctorProfile: userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

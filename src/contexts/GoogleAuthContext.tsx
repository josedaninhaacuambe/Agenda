import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

const KEY = 'agenda_google_user';

function loadUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GoogleUser) : null;
  } catch {
    return null;
  }
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  signIn: (u: GoogleUser) => void;
  signOut: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(loadUser);

  const signIn = useCallback((u: GoogleUser) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  return ctx;
}

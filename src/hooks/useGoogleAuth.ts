import { useState, useCallback } from 'react';

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

export function useGoogleAuth() {
  const [user, setUser] = useState<GoogleUser | null>(loadUser);

  const signIn = useCallback((u: GoogleUser) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return { user, isAuthenticated: !!user, signIn, signOut };
}

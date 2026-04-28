import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  email: string;
  name?: string;
  loginAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password?: string, remember?: boolean) => Promise<void>;
  loginWithProvider: (provider: "google" | "microsoft") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "cuvoto_auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: AuthUser, remember: boolean) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(u));
    // clear the other store
    (remember ? sessionStorage : localStorage).removeItem(STORAGE_KEY);
  };

  const login = async (email: string, _password?: string, remember = true) => {
    // Local-only auth — accepts any credentials for testing.
    const u: AuthUser = {
      email,
      name: email.split("@")[0],
      loginAt: new Date().toISOString(),
    };
    persist(u, remember);
    setUser(u);
  };

  const loginWithProvider = async (provider: "google" | "microsoft") => {
    const u: AuthUser = {
      email: `user@${provider}.com`,
      name: `${provider[0].toUpperCase()}${provider.slice(1)} User`,
      loginAt: new Date().toISOString(),
    };
    persist(u, true);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

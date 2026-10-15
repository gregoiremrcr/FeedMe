"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, LoginInput, RegisterInput, User } from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  initializationError: string | null;
  login: (data: LoginInput) => Promise<void>;
  register: (data: Omit<RegisterInput, "confirm">) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

 
  useEffect(() => {
    let cancelled = false;
    authApi.me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setInitializationError(error instanceof Error ? error.message : "La session n’a pas pu être vérifiée.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginInput) => setUser(await authApi.login(data)), []);
  const register = useCallback(
    async (data: Omit<RegisterInput, "confirm">) => setUser(await authApi.register(data)),
    []
  );
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, initializationError, login, register, logout }),
    [user, loading, initializationError, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}

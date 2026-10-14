"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, LoginInput, RegisterInput, User } from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: Omit<RegisterInput, "confirm">) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    let cancelled = false;
    authApi.me().then((u) => {
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
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
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
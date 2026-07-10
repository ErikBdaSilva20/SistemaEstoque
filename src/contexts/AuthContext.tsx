import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, type AppRole, type AuthUser } from "@/lib/data/client";

export type { AppRole };

export interface AuthContextValue {
  user: AuthUser | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isRep: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const session = await auth.me();
      setUser(session?.user ?? null);
      setRole(session?.role ?? null);
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await auth.signIn(email.trim(), password);
        await refreshSession();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Falha ao entrar." };
      }
    },
    [refreshSession],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await auth.signUp(name.trim(), email.trim(), password);
        await refreshSession();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Falha ao cadastrar." };
      }
    },
    [refreshSession],
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: role === "admin",
      isManager: role === "manager",
      isRep: role === "rep",
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [user, role, isLoading, signIn, signUp, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

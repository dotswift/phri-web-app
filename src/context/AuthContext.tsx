import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { api, ApiError } from "../lib/api";
import type { Consent, Patient } from "../types/api";

interface AuthState {
  user: SupabaseUser | null;
  consent: Consent | null;
  patient: Patient | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserState: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserState = useCallback(async (session: Session | null) => {
    if (!session) {
      setUser(null);
      setConsent(null);
      setPatient(null);
      setLoading(false);
      return;
    }

    setUser(session.user);

    try {
      const [consentRes, patientRes] = await Promise.all([
        api.get<Consent | null>("/api/consent").catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }),
        api.get<Patient | null>("/api/patient").catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }),
      ]);

      setConsent(consentRes);
      setPatient(patientRes);
    } catch {
      // If we can't load state, user can still navigate to appropriate pages
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserState(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserState(session);
    });

    return () => subscription.unsubscribe();
  }, [loadUserState]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setConsent(null);
    setPatient(null);
  };

  const refreshUserState = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await loadUserState(session);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        consent,
        patient,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../infrastructure/supabaseClient";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: isSupabaseConfigured,
    error: null,
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      setState({ user: data.user, isLoading: false, error: error?.message ?? null });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, isLoading: false, error: null });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState((current) => ({ ...current, error: error.message }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setState((current) => ({ ...current, error: error.message }));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }, []);

  return {
    ...state,
    isAuthEnabled: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  };
};

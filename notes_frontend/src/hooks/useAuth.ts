"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthResponse, UserMeResponse } from "@/lib/api";
import { ApiClient } from "@/lib/api";

const TOKEN_KEY = "retro_notes_token";
const EMAIL_KEY = "retro_notes_email";

export type AuthState = {
  token: string | null;
  email: string | null;
  me: UserMeResponse | null;
  loading: boolean;
  error: string | null;
};

export type AuthActions = {
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

/**
 * Returns backend base URL.
 * In preview, backend runs on port 3001.
 */
function getApiBaseUrl(): string {
  // Next.js client components can read NEXT_PUBLIC_* at build time.
  // Fallback is the preview default from the work item.
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
}

// PUBLIC_INTERFACE
export function useAuth(): {
  api: ApiClient;
  state: AuthState;
  actions: AuthActions;
} {
  /** Hook managing auth token storage, user profile, and auth actions. */
  const api = useMemo(() => new ApiClient(getApiBaseUrl()), []);

  const [state, setState] = useState<AuthState>({
    token: null,
    email: null,
    me: null,
    loading: true,
    error: null,
  });

  // Load token from localStorage on first mount.
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const email = localStorage.getItem(EMAIL_KEY);
      api.setToken(token);
      setState((s) => ({
        ...s,
        token,
        email,
        loading: false,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [api]);

  const refreshMe = useCallback(async () => {
    if (!api.getToken()) {
      setState((s) => ({ ...s, me: null }));
      return;
    }
    try {
      const me = await api.me();
      setState((s) => ({ ...s, me, error: null }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load profile.";
      // Token may be invalid; keep it but show error.
      setState((s) => ({ ...s, me: null, error: msg }));
    }
  }, [api]);

  const persistAuth = useCallback(
    (auth: AuthResponse) => {
      api.setToken(auth.access_token);
      localStorage.setItem(TOKEN_KEY, auth.access_token);
      localStorage.setItem(EMAIL_KEY, auth.email);
      setState((s) => ({
        ...s,
        token: auth.access_token,
        email: auth.email,
        error: null,
      }));
    },
    [api]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const auth = await api.register(email, password);
        persistAuth(auth);
        await refreshMe();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Registration failed unexpectedly.";
        setState((s) => ({ ...s, error: msg }));
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [api, persistAuth, refreshMe]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const auth = await api.login(email, password);
        persistAuth(auth);
        await refreshMe();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Login failed unexpectedly.";
        setState((s) => ({ ...s, error: msg }));
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [api, persistAuth, refreshMe]
  );

  const logout = useCallback(() => {
    api.setToken(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
    } catch {
      // ignore
    }
    setState((s) => ({ ...s, token: null, email: null, me: null, error: null }));
  }, [api]);

  // Keep me in sync once we have a token.
  useEffect(() => {
    if (state.loading) return;
    if (state.token) {
      refreshMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]);

  return {
    api,
    state,
    actions: { register, login, logout, refreshMe },
  };
}

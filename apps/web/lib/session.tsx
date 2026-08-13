"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
  type SessionState,
} from "./auth";

type SessionContextValue = {
  session: SessionState | null;
  ready: boolean;
  signIn: (session: SessionState) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
    setReady(true);
  }, []);

  const signIn = useCallback((next: SessionState) => {
    writeStoredSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, signIn, signOut }),
    [session, ready, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    return {
      session: null,
      ready: true,
      signIn: () => undefined,
      signOut: () => undefined,
    } satisfies SessionContextValue;
  }
  return value;
}

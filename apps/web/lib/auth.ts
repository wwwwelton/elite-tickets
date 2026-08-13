export type SessionRole = "CUSTOMER" | "ORGANIZER" | "GATE";

export type SessionState = {
  accessToken: string;
  expiresIn: number;
  role: SessionRole;
};

const STORAGE_KEY = "elite-tickets.session";

export function loadSession(): SessionState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: SessionState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function roleHomePath(role: SessionRole) {
  switch (role) {
    case "CUSTOMER":
      return "/customer";
    case "ORGANIZER":
      return "/organizer";
    case "GATE":
      return "/gate";
  }
}

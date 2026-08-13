export type SessionRole = "CUSTOMER" | "ORGANIZER" | "GATE";

export type SessionState = {
  accessToken: string;
  expiresIn: number;
  role: SessionRole;
};

export type LoginResponse = {
  access_token: string;
  expires_in: number;
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

export function toSessionState(response: LoginResponse): SessionState {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    role: response.role,
  };
}

export function serializeSession(session: SessionState) {
  return JSON.stringify(session);
}

export function deserializeSession(raw: string): SessionState | null {
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.expiresIn !== "number" ||
      (parsed.role !== "CUSTOMER" &&
        parsed.role !== "ORGANIZER" &&
        parsed.role !== "GATE")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getPostLoginRedirect(role: SessionRole) {
  return roleHomePath(role);
}

export function signOut() {
  clearSession();
}

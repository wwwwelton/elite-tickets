export type SessionRole = "CUSTOMER" | "ORGANIZER" | "GATE";

export type SessionState = {
  accessToken: string;
  expiresAt: number;
  role: SessionRole;
  email: string;
  displayName: string;
};

export type LoginResponse = {
  access_token: string;
  expires_in: number;
  role: SessionRole;
};

const STORAGE_KEY = "elite-tickets.session";

export const ROLE_LABELS: Record<SessionRole, string> = {
  CUSTOMER: "Customer",
  ORGANIZER: "Organizer",
  GATE: "Gate staff",
};

export function roleHomePath(role: SessionRole) {
  switch (role) {
    case "CUSTOMER":
      return "/customer";
    case "ORGANIZER":
      return "/organizer/events";
    case "GATE":
      return "/gate";
  }
}

export function toSessionState(
  response: LoginResponse,
  identity: { email: string; displayName?: string },
): SessionState {
  return {
    accessToken: response.access_token,
    expiresAt: Date.now() + response.expires_in * 1000,
    role: response.role,
    email: identity.email,
    displayName: identity.displayName?.trim() || identity.email.split("@")[0],
  };
}

export function isExpired(session: SessionState) {
  return session.expiresAt <= Date.now();
}

function parseSession(raw: string): SessionState | null {
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.expiresAt !== "number" ||
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

export function readStoredSession(): SessionState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const session = parseSession(raw);
  if (!session || isExpired(session)) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  return session;
}

export function writeStoredSession(session: SessionState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

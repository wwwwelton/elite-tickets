import type { Role } from "@/lib/api";

const SESSION_KEY = "elite-tickets.session";

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  role: Role;
};

export type AuthSession = {
  accessToken: string;
  expiresAt: number;
  role: Role;
};

export type NavigationItem = {
  href: string;
  label: string;
};

export type { Role };

type RoleNavigation = readonly [NavigationItem, ...NavigationItem[]];

export const PUBLIC_NAVIGATION: readonly NavigationItem[] = [
  { href: "/", label: "Início" },
  { href: "/login", label: "Entrar" },
  { href: "/organizer/events", label: "Área do organizador" },
  { href: "/gate", label: "Portaria" },
] as const;

export const NAVIGATION_BY_ROLE: Record<Role, RoleNavigation> = {
  ORGANIZER: [{ href: "/organizer/events", label: "Meus eventos" }],
  CUSTOMER: [{ href: "/customer/tickets", label: "Meus ingressos" }],
  GATE: [{ href: "/gate", label: "Validar ingresso" }],
};

function isRole(value: unknown): value is Role {
  return value === "ORGANIZER" || value === "CUSTOMER" || value === "GATE";
}

function isSession(value: unknown): value is AuthSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.expiresAt === "number" &&
    Number.isFinite(session.expiresAt) &&
    isRole(session.role)
  );
}

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function saveSession(response: TokenResponse): AuthSession {
  const session: AuthSession = {
    accessToken: response.access_token,
    expiresAt: Date.now() + response.expires_in * 1000,
    role: response.role,
  };
  storage()?.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  storage()?.removeItem(SESSION_KEY);
}

export function getSession(): AuthSession | null {
  const saved = storage()?.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    const session: unknown = JSON.parse(saved);
    if (!isSession(session) || session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function roleHome(role: Role): string {
  return NAVIGATION_BY_ROLE[role][0].href;
}

export function primaryNavigationForSession(session: AuthSession | null): readonly NavigationItem[] {
  if (!session) return PUBLIC_NAVIGATION;
  return [{ href: "/", label: "Início" }, ...NAVIGATION_BY_ROLE[session.role]];
}

export function authenticatedActionForSession(session: AuthSession | null): string | null {
  if (!session) return null;
  return session.role === "CUSTOMER"
    ? "Meus ingressos"
    : session.role === "ORGANIZER"
      ? "Meus eventos"
      : "Validar ingresso";
}

export type RouteGuard =
  | { allowed: true; session: AuthSession }
  | {
      allowed: false;
      redirectTo: string;
      reason: "auth_required" | "access_denied";
    };

export function guardRoute(allowedRoles: readonly Role[]): RouteGuard {
  const session = getSession();
  if (!session) return { allowed: false, redirectTo: "/login", reason: "auth_required" };
  if (!allowedRoles.includes(session.role)) {
    return { allowed: false, redirectTo: roleHome(session.role), reason: "access_denied" };
  }
  return { allowed: true, session };
}

import type { SessionRole } from "@/lib/auth";

type SiteNavProps = {
  role?: SessionRole;
  onLogout?: () => void;
};

const roleLabels: Record<SessionRole, string> = {
  CUSTOMER: "Customer",
  ORGANIZER: "Organizer",
  GATE: "Gate Staff",
};

const rolePaths: Record<SessionRole, string> = {
  CUSTOMER: "/customer",
  ORGANIZER: "/organizer",
  GATE: "/gate",
};

export function SiteNav({ role, onLogout }: SiteNavProps) {
  return (
    <nav
      aria-label="authenticated navigation"
      style={{
        alignItems: "center",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      {role ? (
        <a
          href={rolePaths[role]}
          style={{
            border: "1px solid rgba(78, 70, 51, 0.8)",
            borderRadius: "9999px",
            padding: "10px 14px",
          }}
        >
          {roleLabels[role]}
        </a>
      ) : null}
      <a
        href="/login"
        style={{
          border: "1px solid rgba(78, 70, 51, 0.8)",
          borderRadius: "9999px",
          padding: "10px 14px",
        }}
      >
        Login
      </a>
      <a
        href="/register"
        style={{
          border: "1px solid rgba(78, 70, 51, 0.8)",
          borderRadius: "9999px",
          padding: "10px 14px",
        }}
      >
        Create account
      </a>
      <button
        onClick={onLogout}
        type="button"
        style={{
          background: "var(--accent)",
          border: "none",
          borderRadius: "9999px",
          color: "#121414",
          fontWeight: 700,
          padding: "10px 14px",
        }}
      >
        Logout
      </button>
    </nav>
  );
}

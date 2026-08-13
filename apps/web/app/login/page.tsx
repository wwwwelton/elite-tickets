import { SiteShell } from "@/components/shell/site-shell";

const roleChoices = [
  { label: "Customer", href: "/customer" },
  { label: "Organizer", href: "/organizer" },
  { label: "Gate Staff", href: "/gate" },
] as const;

export default function LoginPage() {
  return (
    <SiteShell
      title="Sign in"
      subtitle="Choose the role you are using to continue."
    >
      <section
        aria-label="role choices"
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {roleChoices.map((choice) => (
          <a
            key={choice.label}
            href={choice.href}
            style={{
              alignItems: "center",
              border: "1px solid rgba(78, 70, 51, 0.8)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              justifyContent: "space-between",
              padding: "16px 18px",
            }}
          >
            <span>{choice.label}</span>
            <span style={{ color: "var(--muted)" }}>Continue</span>
          </a>
        ))}
      </section>
    </SiteShell>
  );
}

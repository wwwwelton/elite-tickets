import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function SiteShell({ children, title, subtitle }: SiteShellProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        padding: "24px var(--page-gutter) 48px",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: "var(--page-width)",
        }}
      >
        <header
          style={{
            alignItems: "center",
            backdropFilter: "blur(12px)",
            background: "rgba(18, 20, 20, 0.72)",
            border: "1px solid rgba(78, 70, 51, 0.7)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-soft)",
            display: "flex",
            justifyContent: "space-between",
            gap: "24px",
            marginBottom: "28px",
            padding: "18px 22px",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--accent-strong)",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Elite Tickets
            </div>
            {title ? (
              <h1
                style={{
                  margin: "6px 0 0",
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p
                style={{
                  color: "var(--muted)",
                  margin: "8px 0 0",
                  maxWidth: "60ch",
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          <div
            style={{
              border: "1px solid rgba(78, 70, 51, 0.8)",
              borderRadius: "9999px",
              color: "var(--muted)",
              fontSize: "13px",
              letterSpacing: "0.12em",
              padding: "10px 14px",
              textTransform: "uppercase",
            }}
          >
            Responsive product shell
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

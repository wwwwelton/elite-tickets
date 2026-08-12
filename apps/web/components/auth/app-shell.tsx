"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  authenticatedActionForSession,
  clearSession,
  getSession,
  primaryNavigationForSession,
  type NavigationItem,
  type Role,
} from "@/lib/auth";
import { Button } from "@/components/ui";

type AppShellProps = {
  children: ReactNode;
};

function roleLabel(role: Role): string {
  if (role === "CUSTOMER") return "Cliente";
  if (role === "ORGANIZER") return "Organizador";
  return "Portaria";
}

function itemKey(item: NavigationItem): string {
  return `${item.href}:${item.label}`;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const session = getSession();

  const navigation = useMemo(() => primaryNavigationForSession(session), [session]);
  const actionLabel = authenticatedActionForSession(session);
  const currentRole = session?.role ? roleLabel(session.role) : null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function logout() {
    clearSession();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <Link className="app-shell__brand-link" href="/">
            <span className="label-caps">EliteTickets</span>
            <strong className="app-shell__brand-title">Ingressos e validação</strong>
          </Link>
          {currentRole ? <p className="code-data app-shell__role">{currentRole}</p> : null}
        </div>

        <button
          type="button"
          className="button button--ghost app-shell__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-shell-nav"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? "Fechar menu" : "Abrir menu"}
        </button>

        <nav
          id="app-shell-nav"
          className="app-shell__nav"
          data-open={menuOpen ? "true" : "false"}
          aria-label="Navegação principal"
        >
          {navigation.map((item) => {
            const current = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={itemKey(item)}
                className="app-shell__link"
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          {session ? (
            <Button type="button" variant="ghost" onClick={logout} className="app-shell__logout">
              Sair
            </Button>
          ) : null}
          {actionLabel ? <span className="app-shell__action code-data">{actionLabel}</span> : null}
        </nav>
      </header>

      <main id="main-content" className="app-shell__content">
        {children}
      </main>
    </div>
  );
}

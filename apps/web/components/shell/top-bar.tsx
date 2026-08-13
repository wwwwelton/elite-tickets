"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_LABELS, roleHomePath } from "@/lib/auth";
import { useSession } from "@/lib/session";

export function TopBar({ backHref }: { backHref?: string }) {
  const { session, ready, signOut } = useSession();
  const router = useRouter();

  return (
    <nav className="navbar sticky-top">
      <div className="container-fluid gap-3">
        <div className="d-flex align-items-center gap-3">
          {backHref ? (
            <Link
              className="btn btn-outline-light btn-sm"
              href={backHref}
              aria-label="Voltar"
            >
              ←
            </Link>
          ) : null}
          <Link className="brand" href={session ? roleHomePath(session.role) : "/"}>
            <span className="brand__mark" aria-hidden="true">
              ET
            </span>
            EliteTickets
          </Link>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!ready ? null : session ? (
            <>
              <Link
                className="badge text-cream d-none d-sm-inline-flex"
                href={roleHomePath(session.role)}
              >
                {ROLE_LABELS[session.role]}
              </Link>
              <button
                className="btn btn-outline-light btn-sm"
                type="button"
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-light btn-sm" href="/login">
                Entrar
              </Link>
              <Link className="btn btn-primary btn-sm" href="/register">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

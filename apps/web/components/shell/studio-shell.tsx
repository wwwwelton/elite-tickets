"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/lib/session";

const links = [
  { href: "/organizer/events", label: "Dashboard" },
  { href: "/organizer/events/new", label: "Create event" },
  { href: "/organizer/catalog", label: "Catalog" },
];

export function StudioShell({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useSession();

  return (
    <div className="container-fluid px-0">
      <div className="row g-0 min-vh-100">
        <aside className="col-12 col-lg-3 col-xl-2 bg-surface border-bottom border-end p-3 p-lg-4">
          <Link className="brand mb-4 d-inline-flex" href="/">
            <span className="brand__mark" aria-hidden="true">
              ET
            </span>
            Studio
          </Link>
          <p className="eyebrow d-none d-lg-block">
            {session?.displayName ?? "Organizer"}
          </p>
          <ul className="nav flex-lg-column gap-1 mb-4">
            {links.map((link) => (
              <li className="nav-item" key={link.href}>
                <Link
                  className="nav-link"
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-outline-light btn-sm w-100"
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
          >
            Sign out
          </button>
        </aside>

        <div className="col p-3 p-lg-4">
          <header className="d-flex flex-wrap align-items-end justify-content-between gap-3 border-bottom pb-3 mb-4">
            <div>
              {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
              <h1 className="display-4 mb-0 text-cream">{title}</h1>
            </div>
            {action}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

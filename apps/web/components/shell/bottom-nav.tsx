"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Explore", glyph: "◎" },
  { href: "/search", label: "Search", glyph: "⌕" },
  { href: "/customer/tickets", label: "My Tickets", glyph: "▤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Customer navigation">
      <ul className="nav nav-justified mb-0">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li className="nav-item" key={item.href}>
              <Link
                className="nav-link text-center"
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span className="d-block fs-5" aria-hidden="true">
                  {item.glyph}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

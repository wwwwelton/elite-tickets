import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

type AppShellProps = {
  children: ReactNode;
  backHref?: string;
  bare?: boolean;
};

export function AppShell({ children, backHref, bare = false }: AppShellProps) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <TopBar backHref={backHref} />
      <main className={bare ? "flex-grow-1" : "flex-grow-1 pb-5"}>
        {children}
      </main>
      <div style={{ height: "5rem" }} aria-hidden="true" />
      <BottomNav />
    </div>
  );
}

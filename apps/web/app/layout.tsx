import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/auth/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EliteTickets",
    template: "%s · EliteTickets",
  },
  description: "EliteTickets organiza eventos, ingressos digitais e validação de acesso.",
  applicationName: "EliteTickets",
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

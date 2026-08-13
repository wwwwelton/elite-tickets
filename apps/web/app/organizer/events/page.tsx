"use client";

import Link from "next/link";
import { StudioShell } from "@/components/shell/studio-shell";
import { RequireRole } from "@/components/shell/require-role";
import { OrganizerEventsList } from "@/components/organizer/events-list";

export default function OrganizerEventsPage() {
  return (
    <StudioShell
      eyebrow="Estúdio do organizador"
      title="Painel"
      action={
        <Link className="btn btn-primary" href="/organizer/events/new">
          Criar novo evento
        </Link>
      }
    >
      <RequireRole role="ORGANIZER">
        <OrganizerEventsList />
      </RequireRole>
    </StudioShell>
  );
}

"use client";

import type { ReactNode } from "react";
import type { SessionRole } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { LoadingState, UnauthorizedState } from "@/components/states/states";

export function RequireRole({
  role,
  children,
}: {
  role: SessionRole;
  children: ReactNode;
}) {
  const { session, ready } = useSession();

  if (!ready) {
    return <LoadingState label="Checking your session" />;
  }

  if (!session) {
    return <UnauthorizedState />;
  }

  if (session.role !== role) {
    return (
      <UnauthorizedState
        title="Wrong role for this area"
        description={`This area is reserved for the ${role.toLowerCase()} role. The backend remains the authority on every action.`}
      />
    );
  }

  return <>{children}</>;
}

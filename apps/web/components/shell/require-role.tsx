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
    return <LoadingState label="Verificando sua sessão" />;
  }

  if (!session) {
    return <UnauthorizedState />;
  }

  if (session.role !== role) {
    return (
      <UnauthorizedState
        title="Perfil incorreto para esta área"
        description={`Esta área é reservada para o perfil ${role.toLowerCase()}. O backend continua sendo a autoridade em cada ação.`}
      />
    );
  }

  return <>{children}</>;
}

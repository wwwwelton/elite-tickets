import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/states/states";

export default function EventNotFound() {
  return (
    <AppShell backHref="/">
      <div className="container py-5">
        <EmptyState
          title="Evento indisponível"
          description="Este evento não está publicado, foi cancelado ou não existe."
          action={
            <Link className="btn btn-primary" href="/">
              Voltar para a descoberta
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}

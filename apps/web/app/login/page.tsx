import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { LedgerRow, Ticket } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="page-grid hero-shell">
      <Ticket
        emphasized
        aria-labelledby="login-heading"
        detailsLabel="Credenciais de acesso"
        header={
          <div className="ticket__header-copy">
            <p className="label-caps">EliteTickets / Credencial de entrada</p>
            <h1 className="display-lg" id="login-heading">
              Entrar
            </h1>
            <p className="body-lg">
              Entre com uma conta de demonstração para continuar na experiência do seu perfil.
            </p>
          </div>
        }
        details={<LoginForm />}
        footer={
          <div className="ticket__details-stack">
            <div className="ticket__actions">
              <Link className="button button--ghost" href="/">
                Início
              </Link>
              <Link className="button button--primary" href="/login" aria-current="page">
                Entrar
              </Link>
            </div>
            <ul className="ledger" aria-label="Experiências disponíveis por perfil">
              <LedgerRow label="Customer" value="Eventos e ingressos" />
              <LedgerRow label="Organizer" value="Catálogo e inventário" />
              <LedgerRow label="Gate" value="Validação na portaria" />
            </ul>
          </div>
        }
      />
    </main>
  );
}

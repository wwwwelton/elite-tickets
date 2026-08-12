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
              Acesse sua conta
            </h1>
            <p className="body-lg">
              Entre com uma conta de demonstração para continuar na experiência do seu perfil.
            </p>
          </div>
        }
        details={<LoginForm />}
        footer={
          <ul className="ledger" aria-label="Experiências disponíveis por perfil">
            <LedgerRow label="Customer" value="Eventos e ingressos" />
            <LedgerRow label="Organizer" value="Catálogo e inventário" />
            <LedgerRow label="Gate" value="Validação na portaria" />
          </ul>
        }
      />
    </main>
  );
}

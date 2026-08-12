import type { Metadata } from "next";

import { CustomerTicketView, type CustomerTicket } from "@/components/tickets/ticket";
import { Status, Ticket } from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

type SharedTicket = CustomerTicket & { event_title: string };

export default async function SharedTicketPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const result = await loadSharedTicket(shareToken);

  return (
    <main className="page-grid">
      <Ticket
        emphasized
        header={
          <>
            <p className="label-caps">Ingresso compartilhado</p>
            <h1 className="display-lg">Apresentação</h1>
          </>
        }
        details={
          result.kind === "available" ? (
            <>
              <p role="status">Visualização pública somente leitura. A propriedade não foi transferida.</p>
              <CustomerTicketView allowShare={false} ticket={result.ticket} compact />
            </>
          ) : (
            <div className="ticket__details-stack">
              <Status status={result.kind === "expired" ? "EXPIRED" : "WRONG_EVENT"} />
              <h2 className="headline-md">
                {result.kind === "expired" ? "Ingresso compartilhado expirado" : "Link não encontrado"}
              </h2>
              <p>
                {result.kind === "expired"
                  ? "O ingresso já foi utilizado ou o evento terminou. Este link não permite mais apresentar o QR."
                  : "Confira se o link foi copiado por completo."}
              </p>
            </div>
          )
        }
      />
    </main>
  );
}

async function loadSharedTicket(
  shareToken: string,
): Promise<
  | { kind: "available"; ticket: SharedTicket }
  | { kind: "expired" }
  | { kind: "missing" }
> {
  const baseUrl =
    process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return { kind: "missing" };
  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/shared/tickets/${encodeURIComponent(shareToken)}`,
      { cache: "no-store", referrerPolicy: "no-referrer" },
    );
    if (response.status === 410) return { kind: "expired" };
    if (!response.ok) return { kind: "missing" };
    return { kind: "available", ticket: (await response.json()) as SharedTicket };
  } catch {
    return { kind: "missing" };
  }
}

"use client";

import { useState } from "react";

import { ApiError, apiMutation } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type ShareResponse = { share_url: string };

export function ShareAction({ ticketId }: { ticketId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createShare() {
    const guard = guardRoute(["CUSTOMER"]);
    if (!guard.allowed) {
      setError("Sua sessão expirou. Entre novamente para compartilhar.");
      return;
    }
    setPending(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await apiMutation<ShareResponse>(
        `/me/tickets/${encodeURIComponent(ticketId)}/share`,
        { accessToken: guard.session.accessToken },
      );
      setShareUrl(result.share_url);
      await copyLink(result.share_url, setFeedback);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível criar o link de compartilhamento.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button type="button" className="button button--ghost" disabled={pending} onClick={() => void createShare()}>
        {pending ? "Criando link…" : shareUrl ? "Recuperar link" : "Compartilhar ingresso"}
      </button>
      {shareUrl ? (
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor={`share-${ticketId}`}>Link público somente leitura</label>
          <input id={`share-${ticketId}`} value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className="button button--secondary" onClick={() => void copyLink(shareUrl, setFeedback)}>
            Copiar link
          </button>
        </div>
      ) : null}
      {feedback ? <p role="status">{feedback}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

async function copyLink(url: string, setFeedback: (message: string) => void) {
  try {
    await navigator.clipboard.writeText(url);
    setFeedback("Link copiado. O ingresso continua pertencendo a você.");
  } catch {
    setFeedback("Link criado. Selecione o campo para copiar manualmente.");
  }
}

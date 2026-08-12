"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ApiError, apiMutation } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type ShareResponse = { share_url: string };

export function ShareAction({ ticketId }: { ticketId: string }) {
  const shareFieldId = useId();
  const feedbackId = useId();
  const shareInput = useRef<HTMLInputElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!shareUrl) return;
    shareInput.current?.focus();
    shareInput.current?.select();
  }, [shareUrl]);

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
    <section
      className="ticket__actions shared-ticket-actions"
      aria-label="Compartilhamento do ingresso"
      aria-busy={pending}
    >
      <button
        type="button"
        className="button button--primary"
        disabled={pending}
        aria-controls={shareUrl ? shareFieldId : undefined}
        aria-expanded={shareUrl !== null}
        onClick={() => void createShare()}
      >
        {pending ? "Criando link…" : shareUrl ? "Recuperar link" : "Compartilhar ingresso"}
      </button>
      {shareUrl ? (
        <div className="field" id={shareFieldId}>
          <label htmlFor={`share-${ticketId}`}>Link público somente leitura</label>
          <input
            ref={shareInput}
            id={`share-${ticketId}`}
            value={shareUrl}
            readOnly
            aria-describedby={feedback ? feedbackId : undefined}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            className="button button--secondary"
            aria-describedby={feedback ? feedbackId : undefined}
            onClick={() => void copyLink(shareUrl, setFeedback)}
          >
            Copiar link
          </button>
        </div>
      ) : null}
      {feedback ? <p id={feedbackId} role="status" aria-atomic="true">{feedback}</p> : null}
      {error ? <p role="alert" aria-atomic="true">{error}</p> : null}
    </section>
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

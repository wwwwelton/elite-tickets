"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/shell/top-bar";
import { RequireRole } from "@/components/shell/require-role";
import { CameraScanner } from "@/components/gate/camera-scanner";
import { GateStatus } from "@/components/gate/gate-status";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/states";
import {
  ApiError,
  fetchGateEvents,
  validateGateTicket,
  type GateEventApi,
  type GateValidationApi,
} from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

export default function GatePage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <TopBar />
      <main className="flex-grow-1 container py-4" style={{ maxWidth: "34rem" }}>
        <RequireRole role="GATE">
          <GateScanner />
        </RequireRole>
      </main>
    </div>
  );
}

function GateScanner() {
  const [events, setEvents] = useState<GateEventApi[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [eventId, setEventId] = useState("");
  const [credential, setCredential] = useState("");
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<GateValidationApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(0);
  const inFlight = useRef(false);

  const load = useCallback(() => {
    setLoadError(null);
    fetchGateEvents()
      .then((list) => {
        setEvents(list);
        setEventId((current) => current || list[0]?.id || "");
      })
      .catch(() => setLoadError("Os eventos da portaria não puderam ser carregados."));
  }, []);

  useEffect(load, [load]);

  const submitCredential = useCallback(
    async (value: string) => {
      if (!eventId || !value.trim() || inFlight.current) {
        return;
      }

      inFlight.current = true;
      setValidating(true);
      setError(null);

      try {
        // A fresh key per attempt: idempotency guards a retried submit, and must
        // never mask ALREADY_USED when the same ticket is presented twice.
        const result = await validateGateTicket(
          eventId,
          value.trim(),
          crypto.randomUUID(),
        );
        setValidation(result);
        setScanned((current) => current + 1);
        setCredential("");
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "A validação falhou. Verifique a conexão e tente novamente.",
        );
      } finally {
        inFlight.current = false;
        setValidating(false);
      }
    },
    [eventId],
  );

  function handleValidate(event: React.FormEvent) {
    event.preventDefault();
    submitCredential(credential);
  }

  const handleDecode = useCallback(
    (value: string) => {
      setCredential(value);
      submitCredential(value);
    },
    [submitCredential],
  );

  if (loadError) {
    return <ErrorState description={loadError} onRetry={load} />;
  }

  if (!events) {
    return <LoadingState label="Carregando eventos da portaria" />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="Nenhum evento para validar"
        description="Não há eventos publicados disponíveis para validação no momento."
      />
    );
  }

  if (validation) {
    return (
      <GateStatus validation={validation} onDismiss={() => setValidation(null)} />
    );
  }

  const activeEvent = events.find((event) => event.id === eventId);

  return (
    <div className="d-grid gap-4">
      <section className="d-grid gap-2" aria-label="Active event">
        <label className="form-label mb-0" htmlFor="gate-event">
          Evento ativo da portaria
        </label>
        <select
          id="gate-event"
          className="form-select"
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
        {activeEvent ? (
          <p className="font-mono small text-secondary mb-0">
            {formatDate(activeEvent.starts_at)} · {formatTime(activeEvent.starts_at)} ·{" "}
            {activeEvent.venue_name ?? "Local"}
          </p>
        ) : null}
        <p className="eyebrow mb-0">Verificados nesta sessão: {scanned}</p>
      </section>

      <section className="bg-black border p-4 d-grid gap-3 justify-content-center text-center">
        <CameraScanner active={!validating} onDecode={handleDecode} />
        <p className="eyebrow mb-0">Aponte o leitor para o QR do ingresso</p>
        <p className="text-secondary small mb-0">
          Sem câmera neste dispositivo? Cole a credencial abaixo - o backend
          define o resultado de qualquer forma.
        </p>
      </section>

      <form className="d-grid gap-2" onSubmit={handleValidate}>
        <label className="form-label mb-0" htmlFor="gate-credential">
          Entrada manual da credencial
        </label>
        <textarea
          id="gate-credential"
          className="form-control font-mono"
          rows={3}
          placeholder="Cole a credencial escaneada"
          value={credential}
          onChange={(event) => setCredential(event.target.value)}
        />

        {error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : null}

        <button
          className="btn btn-primary btn-lg"
          type="submit"
          disabled={validating || !credential.trim()}
        >
          {validating ? "Validando…" : "Validar ingresso"}
        </button>
        {!validating && !credential.trim() ? (
          <p className="text-secondary small mb-0">
            Escaneie um QR ou cole uma credencial acima para habilitar a validação.
          </p>
        ) : null}
      </form>
    </div>
  );
}

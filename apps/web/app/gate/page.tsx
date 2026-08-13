"use client";

import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/shell/top-bar";
import { RequireRole } from "@/components/shell/require-role";
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

  const load = useCallback(() => {
    setLoadError(null);
    fetchGateEvents()
      .then((list) => {
        setEvents(list);
        setEventId((current) => current || list[0]?.id || "");
      })
      .catch(() => setLoadError("Gate events could not be loaded."));
  }, []);

  useEffect(load, [load]);

  async function handleValidate(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId || !credential.trim()) {
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // A fresh key per attempt: idempotency guards a retried submit, and must
      // never mask ALREADY_USED when the same ticket is presented twice.
      const result = await validateGateTicket(
        eventId,
        credential.trim(),
        crypto.randomUUID(),
      );
      setValidation(result);
      setScanned((current) => current + 1);
      setCredential("");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The validation request failed. Check the connection and retry.",
      );
    } finally {
      setValidating(false);
    }
  }

  if (loadError) {
    return <ErrorState description={loadError} onRetry={load} />;
  }

  if (!events) {
    return <LoadingState label="Loading gate events" />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No events to validate"
        description="There are no published events available for gate validation right now."
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
          Active event gate
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
            {activeEvent.venue_name ?? "Venue"}
          </p>
        ) : null}
        <p className="eyebrow mb-0">Checked this session: {scanned}</p>
      </section>

      <section className="bg-black border p-4 d-grid gap-3 justify-content-center text-center">
        <div className="scanner-frame mx-auto" aria-hidden="true" />
        <p className="eyebrow mb-0">Point the reader at the ticket QR</p>
        <p className="text-secondary small mb-0">
          No camera on this device? Paste the credential below — the backend
          decides the outcome either way.
        </p>
      </section>

      <form className="d-grid gap-2" onSubmit={handleValidate}>
        <label className="form-label mb-0" htmlFor="gate-credential">
          Manual credential entry
        </label>
        <textarea
          id="gate-credential"
          className="form-control font-mono"
          rows={3}
          placeholder="Paste the scanned credential"
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
          {validating ? "Validating…" : "Validate ticket"}
        </button>
      </form>
    </div>
  );
}

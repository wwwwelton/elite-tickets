"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { RouteAccessState } from "@/components/auth/route-access-state";
import { ApiError, apiMutation, apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";
import {
  ValidationResult,
  type ValidationResultKind,
} from "@/components/tickets/validation-result";
import { Ticket } from "@/components/ui";

type GateEvent = {
  id: string;
  title: string;
  starts_at: string;
  venue_name: string;
};

type ValidationResponse = {
  result: ValidationResultKind;
  attempted_at?: string;
};

type CameraState = "idle" | "requesting" | "active" | "denied" | "unavailable" | "error";

type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const submittingRef = useRef(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<GateEvent[] | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [manualCredential, setManualCredential] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<"auth_required" | "access_denied" | null>(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState((current) => (current === "active" ? "idle" : current));
  }, []);

  useEffect(() => {
    const guard = guardRoute(["GATE"]);
    if (!guard.allowed) {
      setAccessState(guard.reason);
      return;
    }
    setAccessToken(guard.session.accessToken);
    void loadEvents(guard.session.accessToken, setEvents, setError);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const submitCredential = useCallback(
    async (credential: string) => {
      const normalized = credential.trim();
      if (!accessToken || !selectedEventId || !normalized || submittingRef.current) return;
      submittingRef.current = true;
      setPending(true);
      setError(null);
      setResult(null);
      try {
        const response = await apiMutation<ValidationResponse, { credential: string }>(
          `/gate/events/${encodeURIComponent(selectedEventId)}/validate`,
          {
            accessToken,
            body: { credential: normalized },
            idempotencyKey: crypto.randomUUID(),
          },
        );
        setResult(response);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 0) {
          setResult({ result: "BACKEND_UNAVAILABLE" });
        } else {
          setError(apiMessage(caught, "Não foi possível validar o ingresso."));
        }
      } finally {
        submittingRef.current = false;
        setPending(false);
      }
    },
    [accessToken, selectedEventId],
  );

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || !streamRef.current) return;
    try {
      const codes = await detector.detect(video);
      const credential = codes.find((code) => code.rawValue?.trim())?.rawValue;
      if (credential) {
        stopCamera();
        await submitCredential(credential);
        return;
      }
    } catch {
      stopCamera();
      setCameraState("error");
      return;
    }
    animationRef.current = requestAnimationFrame(() => void scanFrame());
  }, [stopCamera, submitCredential]);

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
      setCameraState("unavailable");
      return;
    }
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      if (!videoRef.current) {
        stopCamera();
        setCameraState("error");
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("active");
      animationRef.current = requestAnimationFrame(() => void scanFrame());
    } catch (caught) {
      stopCamera();
      setCameraState(
        caught instanceof DOMException && caught.name === "NotAllowedError" ? "denied" : "error",
      );
    }
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitCredential(manualCredential);
  }

  if (accessState === "auth_required") {
    return (
      <RouteAccessState
        title="Acesso necessário"
        message="Entre para validar ingressos na portaria"
        actionHref="/login"
        actionLabel="Entrar"
      />
    );
  }
  if (accessState === "access_denied") {
    return (
      <RouteAccessState
        title="Acesso negado"
        message="Este painel pertence ao perfil da portaria"
        actionHref="/"
        actionLabel="Voltar ao início"
      />
    );
  }
  if (error && !events) return <p role="alert" aria-atomic="true">{error}</p>;
  if (!events) {
    return <p role="status" aria-atomic="true" aria-busy="true">Carregando eventos publicados…</p>;
  }

  return (
    <section className="gate-shell gate-scanner-shell" aria-busy={pending}>
      <div className="field">
        <label htmlFor="gate-event">Evento publicado</label>
        <select
          id="gate-event"
          aria-describedby="gate-event-help"
          value={selectedEventId}
          onChange={(event) => {
            stopCamera();
            setSelectedEventId(event.target.value);
            setResult(null);
            setError(null);
          }}
        >
          <option value="">Selecione um evento</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} — {dateFormatter.format(new Date(event.starts_at))} — {event.venue_name}
            </option>
          ))}
        </select>
        <p id="gate-event-help">Escolha o evento antes de ler ou digitar um ingresso.</p>
      </div>

      {events.length === 0 ? <p role="status">Nenhum evento disponível para validação.</p> : null}

      <div className="gate-sections">
        <Ticket
          aria-label="Leitura de ingresso por câmera"
          detailsLabel="Controles da câmera"
          header={<p className="label-caps">Leitura por câmera</p>}
          details={
            <>
              <video
                ref={videoRef}
                aria-label="Imagem da câmera para leitura do QR"
                muted
                playsInline
                style={{ display: cameraState === "active" ? "block" : "none", maxWidth: "100%" }}
              />
              <CameraMessage state={cameraState} />
              {cameraState === "active" ? (
                <button type="button" className="button button--ghost" onClick={stopCamera}>
                  Parar câmera
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!selectedEventId || pending}
                  onClick={() => void startCamera()}
                >
                  {cameraState === "requesting" ? "Solicitando câmera…" : "Usar câmera"}
                </button>
              )}
            </>
          }
        />

        <Ticket
          aria-label="Validação por entrada manual"
          detailsLabel="Código e ação de validação"
          header={<p className="label-caps">Entrada manual</p>}
          details={
            <form onSubmit={submitManual} className="gate-manual" aria-busy={pending}>
              <div className="field">
                <label htmlFor="manual-credential">Código do ingresso</label>
                <textarea
                  id="manual-credential"
                  rows={4}
                  value={manualCredential}
                  onChange={(event) => setManualCredential(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button type="submit" disabled={!selectedEventId || !manualCredential.trim() || pending}>
                {pending ? "Validando online…" : "Validar código"}
              </button>
            </form>
          }
        />
      </div>

      {error ? <p role="alert" aria-atomic="true">{error}</p> : null}
      {result ? (
        <ValidationResult
          result={result.result}
          {...(result.attempted_at ? { attemptedAt: result.attempted_at } : {})}
        />
      ) : null}
    </section>
  );
}

function CameraMessage({ state }: { state: CameraState }) {
  const messages: Record<CameraState, string | null> = {
    idle: "A câmera é opcional. Você também pode digitar o código abaixo.",
    requesting: "Aguardando permissão para acessar a câmera…",
    active: "Câmera ativa. Aponte para o QR do ingresso.",
    denied: "Permissão de câmera negada. Use a entrada manual abaixo.",
    unavailable: "Leitura por câmera indisponível neste navegador. Use a entrada manual abaixo.",
    error: "Não foi possível ler pela câmera. Use a entrada manual abaixo.",
  };
  return messages[state] ? <p role="status" aria-atomic="true">{messages[state]}</p> : null;
}

async function loadEvents(
  accessToken: string,
  setEvents: (events: GateEvent[]) => void,
  setError: (message: string) => void,
) {
  try {
    setEvents(
      await apiRequest<GateEvent[]>("/gate/events", {
        accessToken,
        cache: "no-store",
      }),
    );
  } catch (caught) {
    setError(apiMessage(caught, "Não foi possível carregar os eventos da portaria."));
  }
}

function apiMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

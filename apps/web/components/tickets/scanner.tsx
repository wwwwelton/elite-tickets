"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiMutation, apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type GateEvent = {
  id: string;
  title: string;
  starts_at: string;
  venue_name: string;
};

type ValidationResult = {
  result: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";
  attempted_at: string;
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
  const router = useRouter();
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
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      router.replace(guard.redirectTo);
      return;
    }
    setAccessToken(guard.session.accessToken);
    void loadEvents(guard.session.accessToken, setEvents, setError);
  }, [router]);

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
        const response = await apiMutation<ValidationResult, { credential: string }>(
          `/gate/events/${encodeURIComponent(selectedEventId)}/validate`,
          {
            accessToken,
            body: { credential: normalized },
            idempotencyKey: crypto.randomUUID(),
          },
        );
        setResult(response);
      } catch (caught) {
        setError(
          caught instanceof ApiError && caught.status === 0
            ? "Backend indisponível. Nenhum ingresso foi admitido; tente novamente online."
            : apiMessage(caught, "Não foi possível validar o ingresso."),
        );
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

  if (error && !events) return <p role="alert">{error}</p>;
  if (!events) return <p role="status">Carregando eventos publicados…</p>;

  return (
    <section aria-busy={pending} style={{ maxWidth: 760 }}>
      <div className="field">
        <label htmlFor="gate-event">Evento publicado</label>
        <select
          id="gate-event"
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
      </div>

      {events.length === 0 ? <p role="status">Nenhum evento disponível para validação.</p> : null}

      <div style={{ marginBlock: 32 }}>
        <p className="label-caps">Leitura por câmera</p>
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
          <button type="button" disabled={!selectedEventId || pending} onClick={() => void startCamera()}>
            {cameraState === "requesting" ? "Solicitando câmera…" : "Usar câmera"}
          </button>
        )}
      </div>

      <form onSubmit={submitManual}>
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

      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <p role="status" aria-live="polite" data-validation-result={result.result}>
          Resultado online: <strong>{result.result}</strong>
        </p>
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
  return messages[state] ? <p role="status">{messages[state]}</p> : null;
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

"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

export function CameraScanner({
  active,
  onDecode,
}: {
  active: boolean;
  onDecode: (credential: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onDecodeRef = useRef(onDecode);
  const [status, setStatus] = useState<"starting" | "ready" | "unavailable">(
    "starting",
  );

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    if (typeof window === "undefined" || !videoRef.current) {
      return;
    }

    let cancelled = false;
    const video = videoRef.current;
    const scanner = new QrScanner(
      video,
      (result) => onDecodeRef.current(result.data),
      { maxScansPerSecond: 5, preferredCamera: "environment" },
    );
    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("unavailable");
        }
      });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || status !== "ready") {
      return;
    }
    if (active) {
      scanner.start().catch(() => setStatus("unavailable"));
    } else {
      scanner.stop();
    }
  }, [active, status]);

  if (status === "unavailable") {
    return (
      <p className="text-secondary small mb-0">
        Camera unavailable — allow camera access or use manual entry below.
      </p>
    );
  }

  return (
    <div className="scanner-frame mx-auto">
      <video ref={videoRef} className="scanner-frame__video" muted playsInline />
    </div>
  );
}

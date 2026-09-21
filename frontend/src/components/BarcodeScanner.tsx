import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, ctrl) => {
        controls = ctrl;
        if (result && !cancelled) {
          cancelled = true;
          onDetected(result.getText());
        }
      })
      .catch((err: Error) => {
        setError(
          err.name === "NotAllowedError"
            ? "Kamerazugriff wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen."
            : "Kamera konnte nicht gestartet werden.",
        );
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="pt-safe flex items-center justify-between px-4 py-3">
        <span className="text-white font-medium">Barcode scannen</span>
        <button onClick={onClose} className="text-white text-2xl leading-none px-2 py-1" aria-label="Schließen">
          ×
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-white/80 rounded-2xl" />
        </div>
      </div>

      {error && (
        <div className="pb-safe p-4">
          <p className="text-white text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
}

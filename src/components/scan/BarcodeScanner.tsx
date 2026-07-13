import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, RefreshCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onDetected: (code: string) => void;
  autoStart?: boolean;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts?: { formats?: string[] }): {
        detect: (source: HTMLVideoElement | ImageBitmap) => Promise<Array<{ rawValue: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

type Mode = "native" | "zxing" | null;

// In-app barcode reading only (camera capture + client-side decode). Matches a
// scanned code against products already registered via `products.barcode` --
// no external GTIN lookup (that's ext-005-barcode-lookup, a gateway extension).
export function BarcodeScanner({ onDetected, autoStart = true }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const nativeLoopRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (nativeLoopRef.current !== null) {
      cancelAnimationFrame(nativeLoopRef.current);
      nativeLoopRef.current = null;
    }
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setRunning(false);
  }, []);

  const handleDetection = useCallback(
    (code: string) => {
      if (!code) return;
      setLastCode(code);
      onDetected(code);
    },
    [onDetected],
  );

  const startNative = useCallback(
    async (video: HTMLVideoElement) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const Detector = window.BarcodeDetector!;
      const supported = Detector.getSupportedFormats ? await Detector.getSupportedFormats() : [];
      const formats = supported.length
        ? supported
        : ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"];
      const detector = new Detector({ formats });

      const tick = async () => {
        if (!videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0 && results[0].rawValue) {
            handleDetection(results[0].rawValue);
          }
        } catch {
          // ignore transient detection errors
        }
        nativeLoopRef.current = requestAnimationFrame(tick);
      };
      nativeLoopRef.current = requestAnimationFrame(tick);
    },
    [handleDetection],
  );

  const startZxing = useCallback(
    async (video: HTMLVideoElement) => {
      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;

      const controls = await reader.decodeFromConstraints(
        {
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        },
        video,
        (result) => {
          if (result) {
            handleDetection(result.getText());
          }
        },
      );
      zxingControlsRef.current = controls;
    },
    [handleDetection],
  );

  const start = useCallback(async () => {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Câmera não suportada neste navegador.");
      }

      if (typeof window !== "undefined" && window.BarcodeDetector) {
        setMode("native");
        await startNative(video);
      } else {
        setMode("zxing");
        await startZxing(video);
      }
      setRunning(true);
    } catch (e) {
      const msg = (e as Error).message;
      setError(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Permissão da câmera negada. Habilite nas configurações do navegador."
          : msg,
      );
      stop();
    }
  }, [startNative, startZxing, stop]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-black aspect-[3/4] sm:aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {running && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-1/2 w-4/5 max-w-md rounded-xl border-2 border-accent-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 text-center">
              <ScanLine className="h-5 w-5 animate-pulse text-white/80" />
              <p className="text-xs text-white/70">Aponte para o código de barras</p>
            </div>
          </>
        )}
        {!running && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Button onClick={start}>
              <Camera className="mr-2 h-4 w-4" />
              Iniciar câmera
            </Button>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center text-white">
            <CameraOff className="h-8 w-8 text-destructive" />
            <p className="max-w-sm text-sm">{error}</p>
            <Button variant="outline" onClick={start}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {mode === "native"
            ? "Detector nativo"
            : mode === "zxing"
              ? "ZXing (compatibilidade)"
              : "—"}
        </span>
        {lastCode && <span className="font-mono">Último: {lastCode.slice(0, 16)}</span>}
      </div>
    </div>
  );
}

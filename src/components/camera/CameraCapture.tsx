import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useCamera } from '../../hooks/useCamera';
import { useIsMobile } from '../../hooks/useIsMobile';

interface CameraCaptureProps {
  onCapture: (file: File) => Promise<void> | void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const {
    videoRef,
    isCapturing,
    hasPermission,
    requestCameraPermission,
    capturePhoto,
    stopCamera,
  } = useCamera();

  const isMobile = useIsMobile();
  const toastShownRef = useRef(false);

  const showCameraError = useCallback((reason: string) => {
    if (toastShownRef.current) return;
    toastShownRef.current = true;
    if (reason === 'denied') {
      toast.error('Permiso de cámara denegado. Habilítalo en la configuración del navegador.');
    } else if (reason === 'unavailable') {
      toast.error('La cámara no está disponible o está siendo usada por otra app.');
    }
  }, []);

  const [showLoading, setShowLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] =
    useState<'Escaneando...' | 'Subiendo imagen...' | 'Procesando imagen...'>('Escaneando...');

  const handleClose = useCallback(() => {
    try {
      stopCamera();
    } finally {
      onClose();
    }
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (!isMobile) return;
    toastShownRef.current = false;
    requestCameraPermission().then((result) => {
      if (typeof result === 'string') showCameraError(result);
    });
    return () => { stopCamera(); };
  }, [isMobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!showLoading) handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose, showLoading]);

  const handleCapture = async () => {
    setShowLoading(true);
    setLoadingMessage('Escaneando...');
    const file = await capturePhoto();
    if (!file) {
      setShowLoading(false);
      return;
    }
    try {
      await Promise.resolve(onCapture(file));
    } finally {
      setShowLoading(false);
      handleClose();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setShowLoading(true);
    setLoadingMessage('Subiendo imagen...');
    try {
      await Promise.resolve(onCapture(file));
    } finally {
      setShowLoading(false);
      handleClose();
    }
  };

  // ── Desktop: solo mostrar uploader, sin cámara ──────────────────────────
  if (!isMobile) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-on-surface">Cargar documento</h3>
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showLoading ? (
            <div className="flex flex-col items-center py-8 gap-3 text-on-surface-variant">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin-slow" />
              <p className="text-sm">{loadingMessage}</p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group">
              <Upload className="w-8 h-8 text-on-surface-variant group-hover:text-primary mb-3 transition-colors" />
              <span className="text-sm font-medium text-on-surface">Haz clic para seleccionar una imagen</span>
              <span className="text-xs text-on-surface-variant mt-1">PNG, JPG, WEBP</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

          <Button variant="ghost" onClick={handleClose} className="w-full mt-4">
            Cancelar
          </Button>
        </Card>
      </div>
    );
  }

  // ── Móvil: pantalla completa con cámara ─────────────────────────────────
  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-on-surface-variant mb-4" />
            <h3 className="text-lg font-medium text-on-surface mb-2">Acceso a cámara requerido</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Por favor permite el acceso a la cámara para capturar imágenes, o sube una imagen existente.
            </p>
            <div className="space-y-3">
              <Button onClick={() => {
                toastShownRef.current = false;
                requestCameraPermission().then((result) => {
                  if (typeof result === 'string') showCameraError(result);
                });
              }} className="w-full">Intentar cámara de nuevo</Button>
              <label className="relative w-full">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="w-full">
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />Subir imagen
                  </Button>
                </div>
              </label>
              <Button variant="ghost" onClick={handleClose} className="w-full">Cancelar</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">

      {/* Overlay de loading */}
      {showLoading && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 text-white">
          <div className="rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 px-6 py-6 text-center shadow-2xl">
            <div className="relative mx-auto mb-4 h-20 w-20">
              <div className="absolute inset-0 rounded-full border-2 border-white/20" />
              <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin-slow" />
              <div className="absolute inset-2 rounded-full bg-white/10" />
              <div className="absolute inset-0 grid place-items-center">
                <Camera className="h-7 w-7" />
              </div>
            </div>
            <p className="text-base font-medium">{loadingMessage}</p>
            <p className="mt-1 text-xs text-white/70">Esto puede tomar un momento</p>
            <div className="mt-4 h-1 w-56 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-1/3 animate-progress bg-white/80" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-3 md:top-5 left-0 w-full px-4 z-40">
        <div className="flex justify-center">
          <p className="flex items-center gap-2 text-white text-sm md:text-base bg-black/60 px-3 md:px-4 py-1.5 rounded-full">
            <Camera className="w-4 h-4" />
            Posicione el documento dentro del marco
          </p>
        </div>
        <div className="absolute top-0 right-1">
          <button
            onClick={() => !showLoading && handleClose()}
            aria-label="Cerrar (Esc)"
            title="Cerrar (Esc)"
            className="mt-1 rounded-full p-2 md:p-2.5 bg-black/55 backdrop-blur ring-1 ring-white/20 text-red-300 hover:text-red-200 hover:bg-black/70 transition shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        <div className="absolute inset-0 flex items-center justify-center z-30 pt-16 md:pt-20 pb-28 md:pb-40">
          <div
            className="
              relative
              aspect-[3/4] sm:aspect-[4/3] lg:aspect-[16/10]
              rounded-2xl ring-2 ring-white/40 bg-black/10 backdrop-blur-[1px]
              w-[min(92vw,calc((100vh-260px)*0.75))]
              sm:w-[min(86vw,calc((100vh-260px)*1.333))]
              lg:w-[min(70vw,calc((100vh-260px)*1.6))]
              max-h-[calc(100vh-260px)]
            "
          >
            {/* Corners */}
            <div className="pointer-events-none">
              <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
            </div>

            {/* Central icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30 shadow-lg flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 md:w-10 md:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-2h6l2 2h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>

            {/* Scan line */}
            {!showLoading && (
              <div className="absolute left-4 right-4 md:left-8 md:right-8 top-0 scanline animate-scan rounded" />
            )}
          </div>
        </div>
      </div>

      {/* Botones móvil */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="bg-gradient-to-t from-black/85 to-transparent pt-6 pb-4">
          <div
            className={`pointer-events-auto flex items-center justify-center space-x-4 sm:space-x-6 max-w-md mx-auto ${
              showLoading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <label className="px-7 py-3.5 bg-yellow-500/80 text-white rounded-lg shadow-md border border-transparent hover:bg-yellow-500/60 hover:border-yellow-400 transition-all cursor-pointer flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Subir
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <Button
              onClick={handleCapture}
              loading={isCapturing}
              size="lg"
              className="px-8 py-3 bg-blue-600/80 text-white rounded-lg shadow-md border border-transparent hover:bg-blue-600/60 hover:border-blue-400 transition-all"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;

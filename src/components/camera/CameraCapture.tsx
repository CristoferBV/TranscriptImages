import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, Plus, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useCamera } from '../../hooks/useCamera';
import { useIsMobile } from '../../hooks/useIsMobile';

const MAX_IMAGES = 10;

interface CameraCaptureProps {
  onCapture: (files: File[]) => Promise<void> | void;
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

  const [showLoading, setShowLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Subiendo imágenes...');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const showCameraError = useCallback((reason: string) => {
    if (toastShownRef.current) return;
    toastShownRef.current = true;
    if (reason === 'denied') {
      toast.error('Permiso de cámara denegado. Habilítalo en la configuración del navegador.');
    } else if (reason === 'unavailable') {
      toast.error('La cámara no está disponible o está siendo usada por otra app.');
    }
  }, []);

  const handleClose = useCallback(() => {
    previews.forEach(URL.revokeObjectURL);
    try { stopCamera(); } finally { onClose(); }
  }, [stopCamera, onClose, previews]);

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
      if (e.key === 'Escape' && !showLoading) { e.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose, showLoading]);

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - selectedFiles.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes por proyecto`);
      return;
    }
    const toAdd = imageFiles.slice(0, remaining);
    if (imageFiles.length > remaining) {
      toast(`Solo se agregaron ${remaining} imagen(es). Límite: ${MAX_IMAGES}`, { icon: 'ℹ️' });
    }
    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setSelectedFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    e.target.value = '';
  };

  const handleProcess = async () => {
    if (!selectedFiles.length) return;
    setShowLoading(true);
    setLoadingMessage('Subiendo imágenes...');
    try {
      await Promise.resolve(onCapture(selectedFiles));
    } finally {
      setShowLoading(false);
      handleClose();
    }
  };

  // ── Mobile capture ──────────────────────────────────────────────────────
  const handleCapture = async () => {
    setShowLoading(true);
    setLoadingMessage('Escaneando...');
    const file = await capturePhoto();
    if (!file) { setShowLoading(false); return; }
    try {
      await Promise.resolve(onCapture([file]));
    } finally {
      setShowLoading(false);
      handleClose();
    }
  };

  const handleMobileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setShowLoading(true);
    setLoadingMessage('Subiendo imagen...');
    try {
      await Promise.resolve(onCapture([file]));
    } finally {
      setShowLoading(false);
      handleClose();
    }
  };

  // ── Desktop ─────────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Cargar imágenes</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {selectedFiles.length}/{MAX_IMAGES} imágenes seleccionadas
              </p>
            </div>
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 text-on-surface-variant">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin-slow" />
              <p className="text-sm">{loadingMessage}</p>
            </div>
          ) : selectedFiles.length === 0 ? (
            /* Drop zone vacío */
            <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group">
              <Upload className="w-8 h-8 text-on-surface-variant group-hover:text-primary mb-3 transition-colors" />
              <span className="text-sm font-medium text-on-surface">Haz clic para seleccionar imágenes</span>
              <span className="text-xs text-on-surface-variant mt-1">PNG, JPG, WEBP · Máximo {MAX_IMAGES} imágenes</span>
              <input type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
            </label>
          ) : (
            /* Grid de previews */
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant">
                    <img src={src} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeFile(i)}
                        className="w-7 h-7 rounded-full bg-error flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5 text-on-error" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}

                {/* Botón agregar más */}
                {selectedFiles.length < MAX_IMAGES && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                    <Plus className="w-5 h-5 text-on-surface-variant" />
                    <span className="text-[10px] text-on-surface-variant">Agregar</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
                  </label>
                )}
              </div>

              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Cada imagen será una página del documento
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-6">
            <Button variant="ghost" onClick={handleClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            {selectedFiles.length > 0 && (
              <button onClick={handleProcess} className="btn-auth-primary flex-1 sm:flex-none px-5 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                Procesar {selectedFiles.length} {selectedFiles.length === 1 ? 'imagen' : 'imágenes'}
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── Móvil: permiso denegado ─────────────────────────────────────────────
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
              <label className="relative w-full block">
                <input type="file" accept="image/*" onChange={handleMobileFileUpload} className="hidden" />
                <Button variant="outline" className="w-full pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" />Subir imagen
                </Button>
              </label>
              <Button variant="ghost" onClick={handleClose} className="w-full">Cancelar</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Móvil: cámara ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
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
          <p className="flex items-center gap-2 text-white text-sm bg-black/60 px-3 py-1.5 rounded-full">
            <Camera className="w-4 h-4" />
            Posicione el documento dentro del marco
          </p>
        </div>
        <div className="absolute top-0 right-1">
          <button
            onClick={() => !showLoading && handleClose()}
            aria-label="Cerrar (Esc)"
            className="mt-1 rounded-full p-2 bg-black/55 backdrop-blur ring-1 ring-white/20 text-red-300 hover:text-red-200 hover:bg-black/70 transition shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center z-30 pt-16 pb-28">
          <div className="relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl ring-2 ring-white/40 bg-black/10 backdrop-blur-[1px] w-[min(92vw,calc((100vh-260px)*0.75))] max-h-[calc(100vh-260px)]">
            <div className="pointer-events-none">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
            </div>
            {!showLoading && (
              <div className="absolute left-4 right-4 top-0 scanline animate-scan rounded" />
            )}
          </div>
        </div>
      </div>

      {/* Botones móvil */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="bg-gradient-to-t from-black/85 to-transparent pt-6 pb-4">
          <div className={`pointer-events-auto flex items-center justify-center space-x-4 max-w-md mx-auto ${showLoading ? 'pointer-events-none opacity-60' : ''}`}>
            <label className="px-7 py-3.5 bg-yellow-500/80 text-white rounded-lg shadow-md border border-transparent hover:bg-yellow-500/60 transition-all cursor-pointer flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Subir
              <input type="file" accept="image/*" onChange={handleMobileFileUpload} className="hidden" />
            </label>
            <Button
              onClick={handleCapture}
              loading={isCapturing}
              size="lg"
              className="px-8 py-3 bg-blue-600/80 text-white rounded-lg shadow-md border border-transparent hover:bg-blue-600/60 transition-all"
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

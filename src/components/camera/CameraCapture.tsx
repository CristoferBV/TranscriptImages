import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, Plus, ImageIcon, Check, RotateCcw, ChevronRight } from 'lucide-react';
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

type MobileScreen = 'camera' | 'preview' | 'gallery';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const {
    videoRef,
    streamRef,
    isCapturing,
    hasPermission,
    requestCameraPermission,
    capturePhoto,
    stopCamera,
  } = useCamera();

  const isMobile = useIsMobile();
  const toastShownRef = useRef(false);

  // Desktop state
  const [showLoading, setShowLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Subiendo imágenes...');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Mobile state
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>('camera');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);

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
    capturedPreviews.forEach(URL.revokeObjectURL);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    try { stopCamera(); } finally { onClose(); }
  }, [stopCamera, onClose, previews, capturedPreviews, previewUrl]);

  useEffect(() => {
    if (!isMobile) return;
    toastShownRef.current = false;
    requestCameraPermission().then((result) => {
      if (typeof result === 'string') showCameraError(result);
    });
    return () => { stopCamera(); };
  }, [isMobile]);

  // Reconectar stream al video cada vez que se vuelve a la pantalla de cámara
  useEffect(() => {
    if (!isMobile || mobileScreen !== 'camera') return;
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mobileScreen, isMobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showLoading) { e.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose, showLoading]);

  // ── Desktop helpers ──────────────────────────────────────────────────────
  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - selectedFiles.length;
    if (remaining <= 0) { toast.error(`Máximo ${MAX_IMAGES} imágenes por proyecto`); return; }
    const toAdd = imageFiles.slice(0, remaining);
    if (imageFiles.length > remaining) {
      toast(`Solo se agregaron ${remaining} imagen(es). Límite: ${MAX_IMAGES}`, { icon: 'ℹ️' });
    }
    setSelectedFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
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
    try { await Promise.resolve(onCapture(selectedFiles)); }
    finally { setShowLoading(false); handleClose(); }
  };

  // ── Mobile: capture → preview ────────────────────────────────────────────
  const handleMobileCapture = async () => {
    const file = await capturePhoto();
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewUrl(url);
    setMobileScreen('preview');
  };

  // Confirm preview → add to gallery
  const handleConfirmPhoto = () => {
    if (!previewFile || !previewUrl) return;
    if (capturedFiles.length >= MAX_IMAGES) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes`);
      URL.revokeObjectURL(previewUrl);
      setPreviewFile(null); setPreviewUrl(null);
      setMobileScreen('camera');
      return;
    }
    setCapturedFiles(prev => [...prev, previewFile]);
    setCapturedPreviews(prev => [...prev, previewUrl]);
    setPreviewFile(null); setPreviewUrl(null);
    setMobileScreen('gallery');
  };

  // Retake — discard preview, go back to camera
  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null); setPreviewUrl(null);
    setMobileScreen('camera');
  };

  // Remove from gallery
  const removeCaptured = (index: number) => {
    URL.revokeObjectURL(capturedPreviews[index]);
    setCapturedFiles(prev => prev.filter((_, i) => i !== index));
    setCapturedPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Process all captured
  const handleMobileProcess = async () => {
    if (!capturedFiles.length) return;
    setShowLoading(true);
    setLoadingMessage('Procesando imágenes...');
    try { await Promise.resolve(onCapture(capturedFiles)); }
    finally { setShowLoading(false); handleClose(); }
  };

  // Upload from gallery (mobile)
  const handleMobileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const remaining = MAX_IMAGES - capturedFiles.length;
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) toast(`Solo se agregaron ${remaining} imagen(es).`, { icon: 'ℹ️' });
    const urls = toAdd.map(f => URL.createObjectURL(f));
    setCapturedFiles(prev => [...prev, ...toAdd]);
    setCapturedPreviews(prev => [...prev, ...urls]);
    if (mobileScreen === 'camera') setMobileScreen('gallery');
    e.target.value = '';
  };

  // ── Desktop ──────────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Cargar imágenes</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {selectedFiles.length}/{MAX_IMAGES} imágenes seleccionadas
              </p>
            </div>
            <button onClick={handleClose} aria-label="Cerrar"
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface">
              <X className="w-5 h-5" />
            </button>
          </div>

          {showLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 text-on-surface-variant">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin-slow" />
              <p className="text-sm">{loadingMessage}</p>
            </div>
          ) : selectedFiles.length === 0 ? (
            <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group">
              <Upload className="w-8 h-8 text-on-surface-variant group-hover:text-primary mb-3 transition-colors" />
              <span className="text-sm font-medium text-on-surface">Haz clic para seleccionar imágenes</span>
              <span className="text-xs text-on-surface-variant mt-1">PNG, JPG, WEBP · Máximo {MAX_IMAGES} imágenes</span>
              <input type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant">
                    <img src={src} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removeFile(i)} className="w-7 h-7 rounded-full bg-error flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-on-error" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{i + 1}</span>
                  </div>
                ))}
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

          <div className="flex items-center gap-3 mt-6">
            <Button variant="ghost" onClick={handleClose} className="flex-1 sm:flex-none">Cancelar</Button>
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

  // ── Móvil: permiso denegado ──────────────────────────────────────────────
  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-on-surface-variant mb-4" />
            <h3 className="text-lg font-medium text-on-surface mb-2">Acceso a cámara requerido</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Permite el acceso a la cámara o sube una imagen existente.
            </p>
            <div className="space-y-3">
              <Button onClick={() => {
                toastShownRef.current = false;
                requestCameraPermission().then(r => { if (typeof r === 'string') showCameraError(r); });
              }} className="w-full">Intentar de nuevo</Button>
              <label className="relative w-full block">
                <input type="file" accept="image/*" multiple onChange={handleMobileFileUpload} className="hidden" />
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

  // ── Móvil: loading overlay ───────────────────────────────────────────────
  if (showLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black grid place-items-center text-white">
        <div className="rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 px-8 py-8 text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
            <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin-slow" />
            <div className="absolute inset-0 grid place-items-center">
              <Camera className="h-6 w-6" />
            </div>
          </div>
          <p className="text-base font-medium">{loadingMessage}</p>
          <p className="mt-1 text-xs text-white/60">Esto puede tomar un momento</p>
        </div>
      </div>
    );
  }

  // ── Móvil: vista previa de foto recién tomada ────────────────────────────
  if (mobileScreen === 'preview' && previewUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-4 pt-12 pb-4 flex items-center justify-between">
          <span className="text-white font-medium text-sm">Vista previa</span>
          <span className="text-white/50 text-xs">{capturedFiles.length + 1} de {MAX_IMAGES} máx.</span>
        </div>

        {/* Imagen */}
        <div className="flex-1 relative overflow-hidden">
          <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain" />
        </div>

        {/* Acciones */}
        <div className="shrink-0 px-6 py-8 flex items-center justify-between gap-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}>
          {/* Retomar */}
          <button
            onClick={handleRetake}
            className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <span className="text-xs">Retomar</span>
          </button>

          {/* Confirmar */}
          <button
            onClick={handleConfirmPhoto}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Check className="w-9 h-9 text-[#001f28]" strokeWidth={2.5} />
            </div>
            <span className="text-xs text-white">Usar foto</span>
          </button>

          {/* Continuar a galería si ya hay fotos */}
          {capturedFiles.length > 0 ? (
            <button
              onClick={() => setMobileScreen('gallery')}
              className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative">
                <ImageIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[#001f28] text-[10px] font-bold flex items-center justify-center">
                  {capturedFiles.length}
                </span>
              </div>
              <span className="text-xs">Galería</span>
            </button>
          ) : (
            <div className="w-14" />
          )}
        </div>
      </div>
    );
  }

  // ── Móvil: galería de fotos capturadas ───────────────────────────────────
  if (mobileScreen === 'gallery') {
    return (
      <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
        {/* Header */}
        <div className="shrink-0 auth-glass-card border-b border-white/5 px-4 h-14 flex items-center justify-between"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button onClick={handleClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-on-surface">
            {capturedFiles.length} {capturedFiles.length === 1 ? 'foto' : 'fotos'} · máx. {MAX_IMAGES}
          </span>
          <div className="w-5" />
        </div>

        {/* Grid de fotos */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            {capturedPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant">
                <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeCaptured(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <span className="absolute bottom-1 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                  {i + 1}
                </span>
              </div>
            ))}

            {/* Agregar más */}
            {capturedFiles.length < MAX_IMAGES && (
              <button
                onClick={() => setMobileScreen('camera')}
                className="aspect-square rounded-lg border-2 border-dashed border-outline-variant hover:border-primary transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <Plus className="w-6 h-6 text-on-surface-variant" />
                <span className="text-[10px] text-on-surface-variant">Agregar</span>
              </button>
            )}
          </div>

          <p className="text-xs text-on-surface-variant text-center mt-4 flex items-center justify-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            Cada foto será una página del documento
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-4 border-t border-outline-variant bg-surface-container"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
          <div className="flex gap-3">
            <label className="flex-none">
              <input type="file" accept="image/*" multiple onChange={handleMobileFileUpload} className="hidden" />
              <div className="h-11 px-4 rounded-full border border-outline-variant flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-colors">
                <Upload className="w-4 h-4" />
                Subir
              </div>
            </label>
            <button
              onClick={handleMobileProcess}
              disabled={capturedFiles.length === 0}
              className="btn-auth-primary flex-1 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
              Procesar {capturedFiles.length} {capturedFiles.length === 1 ? 'foto' : 'fotos'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Móvil: cámara ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-white text-xs bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
          Posiciona el documento en el marco
        </p>

        {/* Badge de fotos tomadas */}
        {capturedFiles.length > 0 ? (
          <button
            onClick={() => setMobileScreen('gallery')}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center relative"
          >
            <ImageIcon className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[#001f28] text-[10px] font-bold flex items-center justify-center">
              {capturedFiles.length}
            </span>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Video — sin blur, full screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Marco de encuadre — sin backdrop-blur */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: '80px', paddingBottom: '160px' }}>
        <div className="relative w-[85vw] max-w-sm aspect-[3/4]">
          {/* Esquinas */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-md" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-md" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-md" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-md" />
          {/* Scanline */}
          <div className="absolute left-3 right-3 top-0 scanline animate-scan rounded" />
        </div>
      </div>

      {/* Botones inferiores */}
      <div className="absolute inset-x-0 bottom-0 z-40"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div className="flex items-center justify-around px-10 py-4">

          {/* Subir desde galería */}
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] text-white/80">Subir</span>
            <input type="file" accept="image/*" multiple onChange={handleMobileFileUpload} className="hidden" />
          </label>

          {/* Botón captura principal */}
          <button
            onClick={handleMobileCapture}
            disabled={isCapturing}
            className="relative flex items-center justify-center disabled:opacity-60"
          >
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
              <div className={`rounded-full bg-white transition-all duration-150 ${isCapturing ? 'w-12 h-12' : 'w-16 h-16'}`} />
            </div>
          </button>

          {/* Ver galería / placeholder */}
          {capturedFiles.length > 0 ? (
            <button
              onClick={() => setMobileScreen('gallery')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white relative">
                <img src={capturedPreviews[capturedFiles.length - 1]} alt="" className="w-full h-full object-cover" />
                {capturedFiles.length > 1 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{capturedFiles.length}</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-white/80">Ver fotos</span>
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;

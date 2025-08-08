import React, { useEffect, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useCamera } from '../../hooks/useCamera';

interface CameraCaptureProps {
  // ahora puede devolver Promise para que este componente muestre el overlay hasta que termine
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

  const [showLoading, setShowLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<
    'Scanning...' | 'Uploading image...' | 'Processing image...'
  >('Scanning...');

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    setShowLoading(true);
    setLoadingMessage('Scanning...');
    const file = await capturePhoto();
    if (!file) {
      setShowLoading(false);
      return;
    }
    try {
      await Promise.resolve(onCapture(file)); // espera a que el padre suba/procese
    } finally {
      setShowLoading(false);
      onClose(); // cierra cuando terminó de verdad
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setShowLoading(true);
    setLoadingMessage('Uploading image...');
    try {
      await Promise.resolve(onCapture(file)); // el padre sube + OCR
    } finally {
      setShowLoading(false);
      onClose();
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please allow camera access to capture images, or upload an existing image instead.
            </p>
            <div className="space-y-3">
              <Button onClick={requestCameraPermission} className="w-full">
                Try Camera Again
              </Button>
              <label className="relative w-full">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="w-full">
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </label>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Cancel
              </Button>
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
            {/* Anillo animado + icono */}
            <div className="relative mx-auto mb-4 h-20 w-20">
              <div className="absolute inset-0 rounded-full border-2 border-white/20" />
              <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin-slow" />
              <div className="absolute inset-2 rounded-full bg-white/10" />
              <div className="absolute inset-0 grid place-items-center">
                <Camera className="h-7 w-7" />
              </div>
            </div>

            <p className="text-base font-medium">{loadingMessage}</p>
            <p className="mt-1 text-xs text-white/70">This may take a moment</p>

            {/* Barra de progreso indeterminada */}
            <div className="mt-4 h-1 w-56 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-1/3 animate-progress bg-white/80" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-4 left-0 w-full px-4 z-40">
        {/* Texto centrado */}
        <div className="flex justify-center">
          <p className="flex items-center gap-2 text-white text-base bg-black/60 px-4 py-1.5 rounded-full">
            <Camera className="w-4 h-4" />
            Position the document within the frame
          </p>
        </div>

        {/* Botón de cerrar */}
        <div className="absolute top-1 right-1">
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-red-600 hover:text-red-700 hover:bg-red-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Marco centrado con aspect ratio */}
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="relative w-[88%] max-w-[720px] aspect-[3/4] rounded-2xl ring-2 ring-white/40 bg-black/10 backdrop-blur-[1px]">
            {/* Esquinas limpias */}
            <div className="pointer-events-none">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
            </div>

            {/* Ícono central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30 shadow-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-white"
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

            {/* Línea de escaneo (pausada si cargando) */}
            {!showLoading && <div className="absolute left-3 right-3 top-0 scanline animate-scan rounded" />}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="bg-black p-4 sm:p-6 safe-area-bottom mb-4">
        <div
          className={`flex items-center justify-center space-x-4 sm:space-x-6 max-w-md mx-auto ${
            showLoading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {/* Upload */}
          <label className="px-7 py-3.5 bg-yellow-500/80 text-white rounded-lg shadow-md border border-transparent hover:bg-yellow-500/60 hover:border-yellow-400 transition-all cursor-pointer flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          {/* Capture */}
          <Button
            onClick={handleCapture}
            loading={isCapturing}
            size="lg"
            className="px-8 py-3 bg-blue-600/80 text-white rounded-lg shadow-md border border-transparent hover:bg-blue-600/60 hover:border-blue-400 transition-all"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capture
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;

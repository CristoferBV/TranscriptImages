import React, { useEffect, useState } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useCamera } from '../../hooks/useCamera';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
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

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    setShowLoading(true);
    const file = await capturePhoto();
    setTimeout(() => {
      setShowLoading(false);
      if (file) {
        onCapture(file);
        onClose();
      }
    }, 1200); // delay para UX
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onCapture(file);
      onClose();
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please allow camera access to capture images, or upload an existing image instead.
            </p>
            <div className="space-y-3">
              <Button onClick={requestCameraPermission} className="w-full">Try Camera Again</Button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />Upload Image
                </Button>
              </div>
              <Button variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
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
        <div className="absolute inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center text-white">
          <Loader className="animate-spin h-10 w-10 mb-4" />
          <p className="text-lg font-medium">Scanning...</p>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-4 left-0 w-full px-4 z-40">
        {/* Texto centrado */}
        <div className="flex justify-center">
          <p className="text-white text-base bg-black bg-opacity-60 px-4 py-1 rounded-md text-center">
            Position the document within the frame
          </p>
        </div>

        {/* Botón de cerrar */}
        <div className="absolute -top-3 right-1">
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video & guía */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Marco */}
        <div className="absolute inset-10 sm:inset-20 border-2 border-white border-opacity-30 rounded-xl pointer-events-none mt-5 z-30">
          {/* Esquinas */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-md"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-md"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-md"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-md"></div>

          {/* Ícono documento */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white bg-white bg-opacity-10 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>

          {/* Línea escaneo animada */}
          <div className="absolute inset-x-0 top-0 h-1 bg-green-400 animate-scan z-40" />
        </div>
      </div>

      {/* Botones */}
      <div className="bg-black p-4 sm:p-6 safe-area-bottom mb-4">
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 max-w-md mx-auto">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-manipulation"
            />
            <Button
              size="lg"
              className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />Upload
            </Button>
          </div>

          <Button
            onClick={handleCapture}
            loading={isCapturing}
            size="lg"
            className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5 mr-2" />Capture
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;

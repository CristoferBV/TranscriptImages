import React, { useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
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

  useEffect(() => {
    requestCameraPermission();
    
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      onCapture(file);
      onClose();
    }
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Camera Access Required
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please allow camera access to capture images, or upload an existing image instead.
            </p>
            
            <div className="space-y-3">
              <Button onClick={requestCameraPermission} className="w-full">
                Try Camera Again
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>
              
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="bg-black bg-opacity-80 p-4">
        <div className="flex items-center justify-center space-x-4">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="lg">
              <Upload className="w-5 h-5 mr-2" />
              Upload
            </Button>
          </div>
          
          <Button
            onClick={handleCapture}
            loading={isCapturing}
            size="lg"
            className="px-8"
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
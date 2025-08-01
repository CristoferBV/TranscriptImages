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
    <div className="fixed inset-0 bg-black flex flex-col z-50">
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
          className="absolute top-4 right-4 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Camera overlay guides */}
        <div className="absolute inset-4 border-2 border-white border-opacity-30 rounded-lg pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg"></div>
        </div>
        
        {/* Instructions */}
        <div className="absolute top-16 left-4 right-4 text-center">
          <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg">
            Position the document within the frame
          </p>
        </div>
      </div>
      
      <div className="bg-black p-4 sm:p-6 safe-area-bottom">
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 max-w-md mx-auto">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-manipulation"
            />
            <Button variant="outline" size="lg" className="px-6 py-4">
              <Upload className="w-5 h-5 mr-2" />
              Upload
            </Button>
          </div>
          
          <Button
            onClick={handleCapture}
            loading={isCapturing}
            size="lg"
            className="px-8 py-4 bg-white text-black hover:bg-gray-100"
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
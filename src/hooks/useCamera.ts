import { useState, useRef } from 'react';

export const useCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestCameraPermission = async () => {
    // Detener stream previo antes de pedir uno nuevo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } },
      { video: { facingMode: 'environment' } },
      { video: true },
    ];

    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
        return stream;
      } catch (error: any) {
        const name = error?.name ?? '';
        // Si es denegación de permisos o abort, no seguir intentando
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setHasPermission(false);
          return 'denied';
        }
        if (name === 'AbortError') {
          setHasPermission(false);
          return 'aborted';
        }
        console.warn('Camera constraint failed, trying next:', name);
      }
    }

    setHasPermission(false);
    return 'unavailable';
  };

  const capturePhoto = async (): Promise<File | null> => {
    if (!videoRef.current || !streamRef.current) {
      toast.error('Cámara no lista');
      return null;
    }

    setIsCapturing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      ctx.drawImage(video, 0, 0);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            resolve(file);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Error al capturar la foto');
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return {
    videoRef,
    streamRef,
    isCapturing,
    hasPermission,
    requestCameraPermission,
    capturePhoto,
    stopCamera,
  };
};
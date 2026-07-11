import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import toast from 'react-hot-toast';

export interface OCRResult {
  fullText: string;
}

type ProcessOCRPayload = { imageUrl: string };

export const useOCR = () => {
  const [processing, setProcessing] = useState(false);

  const processImage = async (imageUrl: string): Promise<OCRResult | null> => {
    setProcessing(true);
    try {
      const processOCR = httpsCallable<ProcessOCRPayload, OCRResult>(functions, 'processOCR');
      const { data } = await processOCR({ imageUrl });

      if (!data.fullText) {
        toast('No se detectó texto en la imagen.', { icon: 'ℹ️' });
        return { fullText: '' };
      }

      toast.success('Texto extraído correctamente');
      return data;
    } catch (error) {
      console.error('Error processing OCR:', error);
      toast.error('No se pudo extraer texto de la imagen');
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return { processImage, processing };
};

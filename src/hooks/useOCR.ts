// src/hooks/useOCR.ts
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import toast from 'react-hot-toast';

export interface OCRResult {
  fullText: string;
  materials: string[];
  measurements: string[];
  instructions: string[];
  category: string | null;
  relevant: boolean;
}

type ProcessOCRPayload = { imageUrl: string };

// Si quieres, expón también el último resultado
export const useOCR = () => {
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<OCRResult | null>(null);

  const processImage = async (imageUrl: string): Promise<OCRResult | null> => {
    setProcessing(true);
    try {
      // Tipa el callable para mejor DX
      const processOCR = httpsCallable<ProcessOCRPayload, OCRResult>(functions, 'processOCR');
      const { data } = await processOCR({ imageUrl });

      // Regla: si no es relevante, avisa y normaliza a arreglos vacíos
      if (!data.relevant) {
        toast('No se detectó información de carpintería/cortes/instalación.', { icon: 'ℹ️' });
        const normalized: OCRResult = {
          fullText: data.fullText || '',
          materials: [],
          measurements: [],
          instructions: [],
          category: null,
          relevant: false,
        };
        setLastResult(normalized);
        return normalized;
      }

      toast.success('Texto extraído correctamente');
      setLastResult(data);
      return data;
    } catch (error) {
      console.error('Error processing OCR:', error);
      toast.error('No se pudo extraer texto de la imagen');
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return { processImage, processing, lastResult };
};

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ProjectPage } from './useFirestore';
import toast from 'react-hot-toast';

export interface OCRResult {
  fullText: string;
}

type ProcessOCRPayload = { imageUrl: string };

export const useOCR = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const processImage = async (imageUrl: string): Promise<string> => {
    const processOCR = httpsCallable<ProcessOCRPayload, OCRResult>(functions, 'processOCR');
    const { data } = await processOCR({ imageUrl });
    return data.fullText || '';
  };

  const processImages = async (imageUrls: string[]): Promise<ProjectPage[]> => {
    setProcessing(true);
    setProgress({ done: 0, total: imageUrls.length });
    const pages: ProjectPage[] = [];

    try {
      // Procesar en lotes de 3 para no saturar la API
      const BATCH = 3;
      for (let i = 0; i < imageUrls.length; i += BATCH) {
        const batch = imageUrls.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map(processImage));

        results.forEach((result, idx) => {
          pages.push({
            imageUrl: batch[idx],
            fullText: result.status === 'fulfilled' ? result.value : '',
          });
        });

        setProgress({ done: Math.min(i + BATCH, imageUrls.length), total: imageUrls.length });
      }

      const failed = pages.filter(p => !p.fullText).length;
      if (failed > 0) {
        toast(`${failed} imagen(es) no generaron texto detectable.`, { icon: 'ℹ️' });
      } else {
        toast.success('Texto extraído correctamente');
      }

      return pages;
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('No se pudo extraer texto de las imágenes');
      return pages;
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return { processImages, processing, progress };
};

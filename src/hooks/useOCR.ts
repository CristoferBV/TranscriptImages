import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import toast from 'react-hot-toast';

export interface OCRResult {
  fullText: string;
  materials: string[];
  measurements: string[];
  instructions: string[];
}

export const useOCR = () => {
  const [processing, setProcessing] = useState(false);

  const processImage = async (imageUrl: string): Promise<OCRResult | null> => {
    setProcessing(true);
    
    try {
      const processOCR = httpsCallable(functions, 'processOCR');
      const result = await processOCR({ imageUrl });
      
      const ocrData = result.data as OCRResult;
      toast.success('Text extracted successfully');
      return ocrData;
    } catch (error) {
      console.error('Error processing OCR:', error);
      toast.error('Failed to extract text from image');
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return { processImage, processing };
};
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuthState } from './useAuth';
import toast from 'react-hot-toast';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuthState();

  const uploadImage = async (file: File, silent = false): Promise<string | null> => {
    if (!user) {
      if (!silent) toast.error('Debe iniciar sesión para subir imágenes');
      return null;
    }
    try {
      const fileName = `${user.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `images/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!user) {
      toast.error('Debe iniciar sesión para subir imágenes');
      return [];
    }
    setUploading(true);
    try {
      const results = await Promise.allSettled(files.map(f => uploadImage(f, true)));
      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

      if (urls.length !== files.length) {
        toast.error(`${files.length - urls.length} imagen(es) no se pudieron subir`);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploadImages, uploading };
};

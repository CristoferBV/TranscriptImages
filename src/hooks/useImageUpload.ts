import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuthState } from './useAuth';
import toast from 'react-hot-toast';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuthState();

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error('Debe iniciar sesión para subir imágenes');
      return null;
    }

    setUploading(true);
    
    try {
      const timestamp = Date.now();
      const fileName = `${user.uid}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, `images/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      toast.success('Imagen subida correctamente');
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
};
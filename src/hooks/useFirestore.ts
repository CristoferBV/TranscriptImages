import { useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,      
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthState } from './useAuth';
import toast from 'react-hot-toast';

import { getStorage, deleteObject, ref } from 'firebase/storage';

export interface ProjectData {
  id?: string;
  userId: string;
  title: string;
  imageUrl: string;
  fullText: string;
  materials: string[];
  measurements: string[];
  instructions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const useFirestore = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthState();
  const storage = getStorage(); 

  const saveProject = async (
    projectData: Omit<ProjectData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        userId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('Project saved successfully');
      return docRef.id;
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<ProjectData>): Promise<boolean> => {
    setLoading(true);
    try {
      const docRef = doc(db, 'projects', projectId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      toast.success('Project updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserProjects = async (): Promise<ProjectData[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as ProjectData[];

      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string, imageUrl?: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'projects', projectId));

      if (imageUrl) {
        try {
          const fileRef = ref(storage, imageUrl);
          await deleteObject(fileRef);
        } catch (err) {
          console.warn('Could not delete image from Storage:', err);
        }
      }

      toast.success('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { saveProject, updateProject, getUserProjects, deleteProject, loading };
};

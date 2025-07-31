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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthState } from './useAuth';
import toast from 'react-hot-toast';

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

  const saveProject = async (projectData: Omit<ProjectData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
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

  return { saveProject, updateProject, getUserProjects, loading };
};
import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useAuthState = () => {
  const { user, loading } = useAuth();
  return { user, loading };
};

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login with email:', email);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.code === 'auth/user-not-found' 
        ? 'No account found with this email'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : error.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please try again later.'
        : 'Login failed. Please try again.';
      
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      console.log('Attempting registration with email:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : error.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : error.code === 'auth/operation-not-allowed'
        ? 'Email/password accounts are not enabled. Please contact support.'
        : 'Registration failed. Please try again.';
      
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return { login, register, logout, loading };
};
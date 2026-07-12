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
      toast.success('¡Bienvenido de nuevo!');
      return { success: true };
    } catch (error: unknown) {
      console.error('Login error:', error);
      let message = 'Error al iniciar sesión. Intente de nuevo.';
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (typeof code === 'string') {
        message = code === 'auth/user-not-found'
          ? 'No se encontró una cuenta con este correo'
          : code === 'auth/wrong-password'
          ? 'Contraseña incorrecta'
          : code === 'auth/invalid-email'
          ? 'Correo electrónico inválido'
          : code === 'auth/invalid-credential'
          ? 'Correo o contraseña inválidos'
          : code === 'auth/too-many-requests'
          ? 'Demasiados intentos fallidos. Intente más tarde.'
          : message;
        }
      }
      
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
      toast.success('¡Cuenta creada exitosamente!');
      return { success: true };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      let message = 'Error al registrarse. Intente de nuevo.';
      if (error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
        const code = (error as { code: string }).code;
        message = code === 'auth/email-already-in-use'
          ? 'Ya existe una cuenta con este correo'
          : code === 'auth/weak-password'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : code === 'auth/invalid-email'
          ? 'Correo electrónico inválido'
          : code === 'auth/operation-not-allowed'
          ? 'Las cuentas con correo/contraseña no están habilitadas. Contacte soporte.'
          : message;
      }

      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada exitosamente');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Error al cerrar sesión');
    }
  };

  return { login, register, logout, loading };
};
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ScanText, ShieldCheck } from 'lucide-react';
import AuthInputField from './AuthInputField';
import { useAuthActions } from '../../hooks/useAuth';

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Register form — contains form state, validation, and submission logic.
 * Rendered inside RegisterPage.
 */
const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { register, loading } = useAuthActions();

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'El nombre es requerido';
    }
    if (!formData.email) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(formData.email, formData.password, formData.displayName);
    if (!result.success) {
      setErrors({ email: 'Este correo ya está registrado o no es válido' });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center justify-center gap-2 mb-10">
        <ScanText className="w-7 h-7 text-primary" strokeWidth={1.75} />
        <span className="text-headline-lg-mob font-semibold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Textografía
        </span>
      </div>

      {/* Glass card */}
      <div className="auth-glass-card rounded-[28px] px-8 py-6 md:px-10 md:py-7">
        {/* Desktop brand row */}
        <div className="hidden md:flex items-center gap-2 mb-4">
          <ScanText className="w-4 h-4 text-primary" strokeWidth={1.75} />
          <span className="text-label-md font-semibold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase">
            Textografía
          </span>
        </div>

        {/* Heading */}
        <div className="mb-4">
          <h1 className="text-[28px] font-semibold leading-tight text-on-surface mb-2 tracking-tight">
            Crea tu cuenta
          </h1>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            Empieza a digitalizar y editar tus documentos manuscritos en segundos.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
          <AuthInputField
            Icon={User}
            id="displayName"
            name="displayName"
            label="Nombre completo"
            type="text"
            placeholder="Ej. Ana García"
            value={formData.displayName}
            onChange={handleChange}
            error={errors.displayName}
            autoComplete="name"
            required
          />

          <AuthInputField
            Icon={Mail}
            id="email"
            name="email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
          />

          <AuthInputField
            Icon={Lock}
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            required
          />

          <AuthInputField
            Icon={Lock}
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-auth-primary w-full py-3 rounded-full flex items-center justify-center gap-2 mt-1 text-[15px]"
          >
            <span>{loading ? 'Creando cuenta…' : 'Crear cuenta'}</span>
            {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-4 text-center text-[14px] text-on-surface-variant">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="text-primary hover:text-primary-fixed font-medium transition-colors relative after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;

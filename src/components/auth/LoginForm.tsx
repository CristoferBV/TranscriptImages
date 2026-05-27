import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ScanText, ShieldCheck } from 'lucide-react';
import AuthInputField from './AuthInputField';
import { useAuthActions } from '../../hooks/useAuth';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Login form — contains form state, validation, and submission logic.
 * Rendered inside LoginPage.
 */
const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const { login, loading } = useAuthActions();

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setErrors({ email: 'Correo o contraseña incorrectos' });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Mobile logo (visible only on sm screens) */}
      <div className="md:hidden flex items-center justify-center gap-2 mb-10">
        <ScanText className="w-7 h-7 text-primary" strokeWidth={1.75} />
        <span className="text-headline-lg-mob font-semibold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Textografía
        </span>
      </div>

      {/* Glass card */}
      <div className="auth-glass-card rounded-[28px] px-8 py-8 md:px-11 md:py-10">
        {/* Desktop brand row */}
        <div className="hidden md:flex items-center gap-2 mb-5">
          <ScanText className="w-4 h-4 text-primary" strokeWidth={1.75} />
          <span className="text-label-md font-semibold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase">
            Textografía
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-[30px] font-semibold leading-tight text-on-surface mb-2 tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            Convierte documentos manuscritos en archivos digitales editables con ayuda de IA.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
            placeholder="Tu contraseña"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            required
          />

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <a
              href="#"
              className="text-label-md text-primary-container hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-auth-primary w-full py-3.5 rounded-full flex items-center justify-center gap-2 mt-1 text-[15px]"
          >
            <span>{loading ? 'Iniciando sesión…' : 'Iniciar sesión'}</span>
            {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        </form>

        {/* Signup link */}
        <p className="mt-6 text-center text-[14px] text-on-surface-variant">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="text-primary hover:text-primary-fixed font-medium transition-colors relative after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

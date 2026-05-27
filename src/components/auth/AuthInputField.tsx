import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AuthInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Lucide icon to show on the left */
  Icon: LucideIcon;
  /** Field label shown above the input */
  label: string;
  /** Validation error message */
  error?: string;
}

/**
 * Glassmorphism input field used across auth forms.
 * Supports optional password-visibility toggle and error states.
 */
const AuthInputField: React.FC<AuthInputFieldProps> = ({
  Icon,
  label,
  error,
  type,
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="relative group">
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-[12px] font-medium text-on-surface-variant mb-1 ml-1 transition-colors group-focus-within:text-primary"
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div className={`relative flex items-center auth-input-glass rounded-xl overflow-hidden ${error ? 'has-error' : ''}`}>
        {/* Left icon */}
        <Icon
          className="absolute left-3.5 w-[18px] h-[18px] text-outline transition-colors group-focus-within:text-primary"
          strokeWidth={1.75}
        />

        {/* Input */}
        <input
          id={id}
          type={inputType}
          className="
            w-full bg-transparent border-none
            py-2.5 pl-[44px] pr-4
            text-[15px] text-on-surface
            placeholder:text-outline-variant
            focus:outline-none focus:ring-0
          "
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 text-outline hover:text-on-surface transition-colors focus:outline-none p-1"
          >
            {showPassword ? (
              <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.75} />
            ) : (
              <Eye className="w-[18px] h-[18px]" strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 ml-1 text-label-sm text-error">{error}</p>
      )}
    </div>
  );
};

export default AuthInputField;

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-label-md text-on-surface-variant mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg
          bg-surface-container-low border
          text-on-surface placeholder:text-outline
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-colors duration-200
          ${error ? 'border-error' : 'border-outline-variant'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-label-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-label-sm text-on-surface-variant">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
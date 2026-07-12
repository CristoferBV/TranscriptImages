import React from 'react';
import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';
import Button from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'logout';

interface ConfirmDialogProps {
  open: boolean;
  variant?: ConfirmVariant;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-error-container/20',
    iconColor: 'text-error',
    confirmClass: 'bg-error text-on-error hover:opacity-90',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-400',
    confirmClass: 'bg-yellow-500 text-black hover:opacity-90',
  },
  logout: {
    icon: LogOut,
    iconBg: 'bg-error-container/20',
    iconColor: 'text-error',
    confirmClass: 'bg-error text-on-error hover:opacity-90',
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  variant = 'danger',
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const { icon: Icon, iconBg, iconColor, confirmClass } = VARIANT_CONFIG[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${iconBg} shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <h3 id="confirm-title" className="text-base font-semibold text-on-surface">
                  {title}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-outline-variant px-6 py-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="min-w-[96px]"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className={`min-w-[96px] ${confirmClass}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

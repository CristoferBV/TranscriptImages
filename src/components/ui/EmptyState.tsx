import React from 'react';
import { ScanText } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  onScan: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onScan }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    {/* Animated icon */}
    <div className="relative mb-8">
      <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <ScanText className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-20" />
    </div>

    <h2 className="text-xl font-semibold text-on-surface mb-2">
      Tu espacio está vacío
    </h2>
    <p className="text-sm text-on-surface-variant max-w-xs mb-8 leading-relaxed">
      Escanea tu primer documento y convierte cualquier imagen en texto digital editable.
    </p>

    <button
      onClick={onScan}
      className="btn-auth-primary px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2"
    >
      <ScanText className="w-4 h-4" />
      Escanear ahora
    </button>
  </div>
);

export default EmptyState;

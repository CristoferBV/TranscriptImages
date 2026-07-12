import React from 'react';
import { ScanText } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

const FAB: React.FC<FABProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Nuevo escaneo"
    className="
      fixed bottom-6 right-6 z-20
      w-14 h-14 rounded-full
      btn-auth-primary
      flex items-center justify-center
      shadow-glow-cyan
      sm:hidden
    "
  >
    <ScanText className="w-6 h-6" strokeWidth={2} />
  </button>
);

export default FAB;

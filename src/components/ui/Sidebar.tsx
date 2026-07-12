import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScanText, FolderOpen, LogOut, User } from 'lucide-react';
import { useAuthState, useAuthActions } from '../../hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';

interface SidebarProps {
  documentCount: number;
  onNewScan: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ documentCount, onNewScan }) => {
  const { user } = useAuthState();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-surface-container-lowest border-r border-outline-variant/50">

        {/* Brand */}
        <div className="px-6 py-6 border-b border-outline-variant/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <ScanText className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface tracking-tight">Digidoc CR</p>
              <p className="text-xs text-on-surface-variant">OCR Inteligente</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={onNewScan}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors btn-auth-primary mb-3"
          >
            <ScanText className="w-4 h-4" strokeWidth={2} />
            Nuevo escaneo
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Mis documentos
            <span className="ml-auto text-xs bg-surface-container-high px-2 py-0.5 rounded-full">
              {documentCount}
            </span>
          </button>
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-outline-variant/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-on-surface truncate">
                {user?.displayName || 'Usuario'}
              </p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              aria-label="Cerrar sesión"
              className="text-on-surface-variant hover:text-error transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        variant="logout"
        title="¿Cerrar sesión?"
        description="Se cerrará tu sesión actual. Podrás volver a iniciar sesión cuando quieras."
        confirmLabel="Cerrar sesión"
        onConfirm={() => { setConfirmLogout(false); logout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
};

export default Sidebar;

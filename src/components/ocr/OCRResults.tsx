import React, { useState } from 'react';
import { Save, X, FileText, Edit3, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { ProjectPage } from '../../hooks/useFirestore';

interface OCRResultsProps {
  pages: ProjectPage[];
  projectTitle: string;
  onTitleChange: (title: string) => void;
  onSave: (pages: ProjectPage[]) => void;
  onClose: () => void;
  saving?: boolean;
}

const OCRResults: React.FC<OCRResultsProps> = ({
  pages,
  projectTitle,
  onTitleChange,
  onSave,
  onClose,
  saving = false,
}) => {
  const [editedPages, setEditedPages] = useState<ProjectPage[]>(pages);
  const [activePage, setActivePage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const current = editedPages[activePage];
  const wordCount = current.fullText.trim() ? current.fullText.trim().split(/\s+/).length : 0;

  const updateText = (text: string) => {
    setEditedPages(prev =>
      prev.map((p, i) => i === activePage ? { ...p, fullText: text } : p)
    );
  };

  const isMultiPage = editedPages.length > 1;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-surface-container border border-outline-variant rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[95vh] sm:h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-base font-semibold text-on-surface">Texto extraído</span>
            {isMultiPage && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {editedPages.length} páginas
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto min-h-0">

          {/* Título */}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Nombre del proyecto</label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej. Factura enero, Contrato, Receta..."
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          {/* Navegación de páginas */}
          {isMultiPage && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {editedPages.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setActivePage(i); setIsEditing(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    activePage === i
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <img src={p.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                  Página {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Vista de la página activa */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1 min-h-0">

            {/* Miniatura de imagen */}
            <div className="sm:w-40 shrink-0">
              <img
                src={current.imageUrl}
                alt={`Página ${activePage + 1}`}
                className="w-full sm:w-40 h-32 sm:h-full object-cover rounded-xl border border-outline-variant"
              />
            </div>

            {/* Texto */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-on-surface-variant">
                  {isMultiPage ? `Página ${activePage + 1} · ` : ''}{wordCount} palabras
                </span>
                <button
                  onClick={() => setIsEditing(v => !v)}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    isEditing
                      ? 'bg-primary/15 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isEditing ? <><Check className="w-3.5 h-3.5" />Listo</> : <><Edit3 className="w-3.5 h-3.5" />Editar</>}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={current.fullText}
                  onChange={(e) => updateText(e.target.value)}
                  autoFocus
                  className="flex-1 w-full min-h-[180px] p-4 rounded-xl resize-none bg-surface-container-low border border-primary/50 ring-2 ring-primary/20 text-on-surface text-sm leading-relaxed focus:outline-none"
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  className="flex-1 min-h-[180px] p-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto cursor-text hover:border-outline transition-colors"
                >
                  {current.fullText || <span className="text-outline italic">Sin texto extraído</span>}
                </div>
              )}
            </div>
          </div>

          {/* Navegación prev/next en móvil */}
          {isMultiPage && (
            <div className="flex items-center justify-between sm:hidden">
              <button
                onClick={() => { setActivePage(p => Math.max(0, p - 1)); setIsEditing(false); }}
                disabled={activePage === 0}
                className="flex items-center gap-1 text-sm text-on-surface-variant disabled:opacity-30 hover:text-on-surface transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-xs text-on-surface-variant">{activePage + 1} / {editedPages.length}</span>
              <button
                onClick={() => { setActivePage(p => Math.min(editedPages.length - 1, p + 1)); setIsEditing(false); }}
                disabled={activePage === editedPages.length - 1}
                className="flex items-center gap-1 text-sm text-on-surface-variant disabled:opacity-30 hover:text-on-surface transition-colors"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 border-t border-outline-variant bg-surface-container px-5 py-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(editedPages)}
              loading={saving}
              disabled={editedPages.every(p => !p.fullText.trim())}
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar proyecto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRResults;

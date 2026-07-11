import React, { useState } from 'react';
import { Save, X, FileText, Edit3, Check } from 'lucide-react';
import Button from '../ui/Button';
import { OCRResult } from '../../hooks/useOCR';

interface OCRResultsProps {
  result: OCRResult;
  projectTitle: string;
  onTitleChange: (title: string) => void;
  onSave: (data: OCRResult) => void;
  onClose: () => void;
  saving?: boolean;
}

const OCRResults: React.FC<OCRResultsProps> = ({
  result,
  projectTitle,
  onTitleChange,
  onSave,
  onClose,
  saving = false,
}) => {
  const [fullText, setFullText] = useState(result.fullText);
  const [isEditing, setIsEditing] = useState(false);

  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  const charCount = fullText.length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-surface-container border border-outline-variant rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-[95vh] sm:h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-base font-semibold text-on-surface">Texto extraído</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">

          {/* Título del proyecto */}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej. Factura enero, Receta pasta, Contrato..."
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          {/* Texto extraído */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-label-md text-on-surface-variant">
                Contenido
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant">
                  {wordCount} palabras · {charCount} caracteres
                </span>
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    isEditing
                      ? 'bg-primary/15 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isEditing ? (
                    <><Check className="w-3.5 h-3.5" />Listo</>
                  ) : (
                    <><Edit3 className="w-3.5 h-3.5" />Editar</>
                  )}
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                autoFocus
                className="flex-1 w-full min-h-[200px] p-4 rounded-xl resize-none bg-surface-container-low border border-primary/50 ring-2 ring-primary/20 text-on-surface text-sm leading-relaxed focus:outline-none transition-colors"
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="flex-1 min-h-[200px] p-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto cursor-text hover:border-outline transition-colors"
              >
                {fullText || (
                  <span className="text-outline italic">Sin texto extraído</span>
                )}
              </div>
            )}
          </div>
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
              onClick={() => onSave({ fullText })}
              loading={saving}
              disabled={!fullText.trim()}
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

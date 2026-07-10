import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { OCRResult } from '../../hooks/useOCR';

interface OCRResultsProps {
  result: OCRResult;
  onSave: (data: OCRResult) => void;
  onClose: () => void;
  saving?: boolean;
}

const SECTIONS = [
  {
    key: 'materials' as const,
    title: 'Materiales',
    cardClass: 'border border-primary/20 bg-primary/5',
    titleClass: 'text-primary',
  },
  {
    key: 'measurements' as const,
    title: 'Medidas',
    cardClass: 'border border-secondary/20 bg-secondary/5',
    titleClass: 'text-secondary',
  },
  {
    key: 'instructions' as const,
    title: 'Instrucciones de instalación',
    cardClass: 'border border-tertiary/20 bg-tertiary/5',
    titleClass: 'text-tertiary',
  },
] as const;

const OCRResults: React.FC<OCRResultsProps> = ({ result, onSave, onClose, saving = false }) => {
  const [editingData, setEditingData] = useState<OCRResult>(result);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleArrayEdit = (
    section: keyof Pick<OCRResult, 'materials' | 'measurements' | 'instructions'>,
    value: string
  ) => {
    const items = value.split('\n').filter((item) => item.trim() !== '');
    setEditingData((prev) => ({ ...prev, [section]: items }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-surface-container border border-outline-variant rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-outline-variant">
          <h2 className="text-lg sm:text-xl font-semibold text-on-surface">
            Contenido extraído
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors touch-manipulation text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">

          {/* Texto completo */}
          <Card>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-on-surface">
                Texto completo
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'fullText' ? null : 'fullText')}
                className="touch-manipulation"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            {editingSection === 'fullText' ? (
              <textarea
                value={editingData.fullText}
                onChange={(e) => setEditingData((prev) => ({ ...prev, fullText: e.target.value }))}
                className="w-full h-32 sm:h-40 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base bg-surface-container-low border border-outline-variant text-on-surface"
              />
            ) : (
              <p className="text-sm sm:text-base text-on-surface-variant whitespace-pre-wrap bg-surface-container-low p-3 rounded-lg">
                {editingData.fullText || 'Sin texto extraído'}
              </p>
            )}
          </Card>

          {/* Secciones categorizadas */}
          {SECTIONS.map(({ key, title, cardClass, titleClass }) => (
            <div key={key} className={`rounded-lg p-6 ${cardClass}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${titleClass}`}>{title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection(editingSection === key ? null : key)}
                  className="touch-manipulation"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              {editingSection === key ? (
                <textarea
                  value={editingData[key].join('\n')}
                  onChange={(e) => handleArrayEdit(key, e.target.value)}
                  className="w-full h-32 sm:h-40 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base bg-surface-container-low border border-outline-variant text-on-surface"
                  placeholder={`Ingrese ${title.toLowerCase()}, uno por línea`}
                />
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {editingData[key].length > 0 ? (
                    editingData[key].map((item, index) => (
                      <div key={index} className="bg-surface-container p-2 sm:p-3 rounded-lg border border-outline-variant text-on-surface text-sm">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant italic">
                      Sin {title.toLowerCase()} identificados
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="border-t border-outline-variant bg-surface-container p-3 sm:p-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={() => onSave(editingData)} loading={saving} className="w-full sm:w-auto">
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

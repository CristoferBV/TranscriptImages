import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, Copy,
  Check, Edit3, Save, X, Trash2, Calendar,
  RotateCw, ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectData, ProjectPage } from '../hooks/useFirestore';
import { useFirestore } from '../hooks/useFirestore';
import { useExport } from '../hooks/useExport';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const pageWordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPages, setEditedPages] = useState<ProjectPage[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const { updateProject, deleteProject } = useFirestore();
  const { exportToPDF, exportToExcel, exportingPDF, exportingExcel } = useExport();

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetImageView = () => {
    setRotation(0);
    setZoom(1);
  };

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const snap = await getDoc(doc(db, 'projects', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as ProjectData;
          setProject(data);
          setEditedPages(data.pages);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const currentPage = editedPages[activePage];
  const isMultiPage = editedPages.length > 1;

  const handleCopy = async () => {
    if (!project) return;
    const text = isMultiPage
      ? `--- Página ${activePage + 1} ---\n${currentPage.fullText}`
      : currentPage.fullText;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Texto copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePageText = (text: string) => {
    setEditedPages(prev => prev.map((p, i) => i === activePage ? { ...p, fullText: text } : p));
  };

  const handleSaveEdit = async () => {
    if (!project?.id) return;
    setSaving(true);
    const ok = await updateProject(project.id, { pages: editedPages });
    if (ok) {
      setProject(prev => prev ? { ...prev, pages: editedPages } : prev);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!project?.id) return;
    setDeleting(true);
    await deleteProject(project.id, project.pages);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project || !currentPage) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-4">
        <p className="text-on-surface-variant">Documento no encontrado.</p>
        <Button onClick={() => navigate('/dashboard')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      {/* Header */}
      <header className="auth-glass-card border-b border-white/5 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Mis documentos</span>
          </button>

          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-sm sm:text-base font-semibold text-on-surface truncate">
              {project.title}
            </h1>
            <p className="text-xs text-on-surface-variant hidden sm:block">
              <Calendar className="w-3 h-3 inline mr-1" />
              {formatDate(project.updatedAt)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              title="Copiar todo el texto"
              className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(project)}
              loading={exportingPDF}
              disabled={exportingPDF || exportingExcel}
            >
              <FileText className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(project)}
              loading={exportingExcel}
              disabled={exportingPDF || exportingExcel}
            >
              <Download className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <button
              onClick={() => setConfirmDelete(true)}
              title="Eliminar documento"
              className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body — layout de 3 columnas en desktop */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-start max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {/* Columna izquierda: grid de miniaturas */}
        {isMultiPage && (
          <aside className="lg:w-56 xl:w-60 shrink-0 lg:sticky lg:top-24">
            <p className="text-xs font-medium text-on-surface-variant mb-3 uppercase tracking-wider">
              Páginas ({editedPages.length})
            </p>
            {/* Desktop: lista vertical */}
            <div className="hidden lg:flex flex-col gap-3 h-[55vh] min-h-[420px] max-h-[680px] overflow-y-auto pr-1">
              {editedPages.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActivePage(i);
                    setIsEditing(false);
                    resetImageView();
                  }}
                  className={`group shrink-0 overflow-hidden rounded-xl border-2 text-left transition-all ${
                    activePage === i
                      ? 'border-primary shadow-glow-cyan bg-primary/5'
                      : 'border-outline-variant bg-surface-container-low hover:border-primary/50'
                  }`}
                >
                  <div className="relative w-full h-32 xl:h-36 flex items-center justify-center overflow-hidden bg-surface-container-high p-2">
                    <img
                      src={p.imageUrl}
                      alt={`Vista previa de la página ${i + 1}`}
                      loading="lazy"
                      className="block max-w-full max-h-full w-auto h-auto object-contain rounded-md"
                    />

                    {activePage === i && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 text-on-primary" />
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between px-3 py-2 border-t ${
                      activePage === i
                        ? 'border-primary/30'
                        : 'border-outline-variant'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        activePage === i
                          ? 'text-primary'
                          : 'text-on-surface'
                      }`}
                    >
                      Página {i + 1}
                    </span>

                    <span className="text-[10px] text-on-surface-variant">
                      {pageWordCount(p.fullText)} palabras
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {/* Mobile: scroll horizontal */}
            <div className="flex lg:hidden gap-3 overflow-x-auto pb-2">
              {editedPages.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActivePage(i);
                    setIsEditing(false);
                    resetImageView();
                  }}
                  className={`shrink-0 w-24 overflow-hidden rounded-xl border-2 transition-all ${
                    activePage === i
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant bg-surface-container-low'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center bg-surface-container-high p-1.5">
                    <img
                      src={p.imageUrl}
                      alt={`Vista previa de la página ${i + 1}`}
                      loading="lazy"
                      className="block max-w-full max-h-full w-auto h-auto object-contain rounded"
                    />

                    {activePage === i && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-on-primary" />
                      </div>
                    )}
                  </div>

                  <div className="px-2 py-1.5 border-t border-outline-variant">
                    <span
                      className={`text-[10px] font-semibold ${
                        activePage === i
                          ? 'text-primary'
                          : 'text-on-surface'
                      }`}
                    >
                      Página {i + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Columna central: documento escaneado */}
        <div
          className={`flex flex-col gap-3 min-w-0 ${
            isMultiPage ? 'lg:flex-1' : 'lg:w-1/2'
          }`}
        >
          {/* Encabezado y controles */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              {isMultiPage
                ? `Documento — Página ${activePage + 1}`
                : 'Documento escaneado'}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                title="Alejar"
                aria-label="Alejar imagen"
                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="min-w-[44px] text-center text-xs text-on-surface-variant">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= 3}
                title="Acercar"
                aria-label="Acercar imagen"
                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={rotateImage}
                title="Rotar 90 grados"
                aria-label="Rotar imagen"
                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={resetImageView}
                title="Restablecer imagen"
                aria-label="Restablecer imagen"
                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Visor */}
          <div className="relative h-[55vh] min-h-[420px] max-h-[680px] overflow-auto rounded-xl border border-outline-variant bg-surface-container-high">
            <div
              className="absolute inset-0 min-w-full min-h-full flex items-center justify-center"
              style={{
                padding: rotation % 180 === 0 ? '1rem' : '4rem',
              }}
            >
              <img
                src={currentPage.imageUrl}
                alt={`Página ${activePage + 1}`}
                draggable={false}
                onDoubleClick={() => {
                  setZoom(prev => (prev === 1 ? 2 : 1));
                }}
                className="block max-w-none rounded-lg shadow-md select-none transition-transform duration-200"
                style={{
                  width: `${zoom * 100}%`,
                  height: 'auto',
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
              />
            </div>
          </div>
        </div>

        {/* Columna derecha: texto */}
        <div
          className={`flex flex-col gap-3 min-w-0 ${
            isMultiPage ? 'lg:flex-1' : 'lg:w-1/2'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {isMultiPage ? `Texto — Página ${activePage + 1}` : 'Texto extraído'}
              </span>
              <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                {pageWordCount(currentPage.fullText)} palabras
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={() => { setIsEditing(false); setEditedPages(project.pages); }}
                  className="p-1 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                disabled={saving}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  isEditing
                    ? 'bg-primary/15 text-primary hover:bg-primary/25'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {saving
                  ? <LoadingSpinner size="sm" />
                  : isEditing
                    ? <><Save className="w-3.5 h-3.5" />Guardar</>
                    : <><Edit3 className="w-3.5 h-3.5" />Editar</>
                }
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={currentPage.fullText}
              onChange={(e) => updatePageText(e.target.value)}
              autoFocus
              className="h-[55vh] min-h-[420px] max-h-[680px] w-full p-4 rounded-xl resize-none bg-surface-container-low border border-primary/50 ring-2 ring-primary/20 text-on-surface text-sm leading-relaxed focus:outline-none transition-colors"
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="h-[55vh] min-h-[420px] max-h-[680px] p-4 rounded-xl overflow-y-auto bg-surface-container-low border border-outline-variant text-on-surface text-sm leading-relaxed whitespace-pre-wrap cursor-text hover:border-outline transition-colors"
            >
              {currentPage.fullText || (
                <span className="text-outline italic">Sin texto extraído para esta página</span>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        variant="danger"
        title="¿Eliminar documento?"
        description="Esta acción no se puede deshacer. El documento y todas sus imágenes serán eliminados permanentemente."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default DocumentDetailPage;

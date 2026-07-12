import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, Copy,
  Check, Edit3, Save, X, Trash2, Calendar,
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

  const { updateProject, deleteProject } = useFirestore();
  const { exportToPDF, exportToExcel, exportingPDF, exportingExcel } = useExport();

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
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {/* Columna izquierda: grid de miniaturas */}
        {isMultiPage && (
          <aside className="lg:w-48 shrink-0">
            <p className="text-xs font-medium text-on-surface-variant mb-3 uppercase tracking-wider">
              Páginas ({editedPages.length})
            </p>
            {/* Desktop: lista vertical */}
            <div className="hidden lg:flex flex-col gap-2">
              {editedPages.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setActivePage(i); setIsEditing(false); }}
                  className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                    activePage === i
                      ? 'border-primary shadow-glow-cyan'
                      : 'border-outline-variant hover:border-primary/50'
                  }`}
                >
                  <img
                    src={p.imageUrl}
                    alt={`Página ${i + 1}`}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className={`absolute inset-0 flex items-end p-1.5 bg-gradient-to-t from-black/70 to-transparent`}>
                    <span className="text-[10px] font-semibold text-white">Pág. {i + 1}</span>
                  </div>
                  {activePage === i && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-on-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {/* Mobile: scroll horizontal */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {editedPages.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setActivePage(i); setIsEditing(false); }}
                  className={`relative shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activePage === i
                      ? 'border-primary'
                      : 'border-outline-variant hover:border-primary/50'
                  }`}
                >
                  <img src={p.imageUrl} alt={`Página ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 flex items-end p-1 bg-gradient-to-t from-black/70 to-transparent">
                    <span className="text-[9px] font-semibold text-white">{i + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Columna central: imagen grande */}
        <div className={`flex flex-col gap-3 ${isMultiPage ? 'lg:flex-1' : 'lg:w-1/2'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              {isMultiPage ? `Imagen — Página ${activePage + 1}` : 'Imagen escaneada'}
            </span>
          </div>
          <div className="rounded-lg overflow-hidden border border-outline-variant bg-surface-container-high flex-1">
            <img
              src={currentPage.imageUrl}
              alt={`Página ${activePage + 1}`}
              className="w-full object-contain max-h-[70vh] lg:max-h-full"
            />
          </div>
        </div>

        {/* Columna derecha: texto */}
        <div className={`flex flex-col gap-3 ${isMultiPage ? 'lg:flex-1' : 'lg:w-1/2'}`}>
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
              className="flex-1 min-h-[400px] lg:min-h-0 lg:h-full w-full p-4 rounded-lg resize-none bg-surface-container-low border border-primary/50 ring-2 ring-primary/20 text-on-surface text-sm leading-relaxed focus:outline-none transition-colors"
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="flex-1 min-h-[400px] lg:min-h-0 p-4 rounded-lg overflow-y-auto bg-surface-container-low border border-outline-variant text-on-surface text-sm leading-relaxed whitespace-pre-wrap cursor-text hover:border-outline transition-colors"
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

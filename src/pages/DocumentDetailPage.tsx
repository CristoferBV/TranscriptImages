import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, Copy, Share2,
  Check, Edit3, Save, X, Trash2, Calendar, AlignLeft, ChevronLeft, ChevronRight,
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

const totalWords = (pages: ProjectPage[]) => {
  const text = pages.map(p => p.fullText).join(' ');
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

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
  const { exportToPDF, exportToExcel, exporting } = useExport();

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
    const text = project.pages.map((p, i) =>
      isMultiPage ? `--- Página ${i + 1} ---\n${p.fullText}` : p.fullText
    ).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Texto copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!project) return;
    const text = `*${project.title}*\n\n${project.pages.map(p => p.fullText).join('\n\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
    <div className="min-h-screen bg-app-bg">
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      {/* Header */}
      <header className="auth-glass-card border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Mis documentos</span>
          </button>

          <h1 className="text-sm sm:text-base font-semibold text-on-surface truncate flex-1 text-center px-2">
            {project.title}
          </h1>

          {/* Actions desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToPDF(project)} loading={exporting} disabled={exporting}>
              <FileText className="w-4 h-4 mr-1.5" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToExcel(project)} loading={exporting} disabled={exporting}>
              <Download className="w-4 h-4 mr-1.5" />Excel
            </Button>
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Actions mobile */}
          <div className="flex sm:hidden items-center gap-1 shrink-0">
            <button onClick={handleCopy} className="p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={handleShare} className="p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-on-surface-variant hover:text-error transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-4">
            {isMultiPage && (
              <span className="text-primary font-medium">{project.pages.length} páginas</span>
            )}
            <div className="flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>{totalWords(editedPages)} palabras totales</span>
            </div>
          </div>
        </div>

        {/* Tabs de páginas */}
        {isMultiPage && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {editedPages.map((p, i) => (
              <button
                key={i}
                onClick={() => { setActivePage(i); setIsEditing(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                  activePage === i
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant hover:text-on-surface'
                }`}
              >
                <img src={p.imageUrl} alt="" className="w-6 h-6 rounded object-cover" />
                Página {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Imagen */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container-high">
              <img
                src={currentPage.imageUrl}
                alt={`Página ${activePage + 1}`}
                className="w-full object-contain max-h-[60vh]"
              />
            </div>

            {/* Navegación prev/next */}
            {isMultiPage && (
              <div className="flex items-center justify-between">
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

            {/* Export mobile */}
            <div className="flex gap-3 sm:hidden">
              <Button variant="outline" size="sm" onClick={() => exportToPDF(project)} loading={exporting} disabled={exporting} className="flex-1">
                <FileText className="w-4 h-4 mr-1.5" />PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(project)} loading={exporting} disabled={exporting} className="flex-1">
                <Download className="w-4 h-4 mr-1.5" />Excel
              </Button>
            </div>
          </div>

          {/* Texto */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface">
                {isMultiPage ? `Texto — Página ${activePage + 1}` : 'Texto extraído'}
              </span>
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
                  {saving ? <LoadingSpinner size="sm" /> : isEditing ? <><Save className="w-3.5 h-3.5" />Guardar</> : <><Edit3 className="w-3.5 h-3.5" />Editar</>}
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={currentPage.fullText}
                onChange={(e) => updatePageText(e.target.value)}
                autoFocus
                className="flex-1 min-h-[400px] lg:min-h-[500px] w-full p-4 rounded-xl resize-none bg-surface-container-low border border-primary/50 ring-2 ring-primary/20 text-on-surface text-sm leading-relaxed focus:outline-none transition-colors"
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="flex-1 min-h-[400px] lg:min-h-[500px] p-4 rounded-xl overflow-y-auto bg-surface-container-low border border-outline-variant text-on-surface text-sm leading-relaxed whitespace-pre-wrap cursor-text hover:border-outline transition-colors"
              >
                {currentPage.fullText || <span className="text-outline italic">Sin texto extraído</span>}
              </div>
            )}
          </div>
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

import React, { useState, useEffect, useMemo } from 'react';
import { ScanText, LogOut, User, Trash2, Menu, X, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import FAB from '../components/ui/FAB';
import SearchBar from '../components/ui/SearchBar';
import Sidebar from '../components/ui/Sidebar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CameraCapture from '../components/camera/CameraCapture';
import OCRResults from '../components/ocr/OCRResults';
import ProjectCard from '../components/projects/ProjectCard';
import { useAuthState, useAuthActions } from '../hooks/useAuth';
import { useImageUpload } from '../hooks/useImageUpload';
import { useOCR } from '../hooks/useOCR';
import { useFirestore, ProjectData, ProjectPage } from '../hooks/useFirestore';

const DashboardPage: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [ocrPages, setOcrPages] = useState<ProjectPage[] | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user } = useAuthState();
  const { logout } = useAuthActions();
  const { uploadImages, uploading } = useImageUpload();
  const { processImages, processing, progress } = useOCR();
  const { saveProject, getUserProjects, deleteProject, loading: firestoreLoading } = useFirestore();
  const navigate = useNavigate();

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    const userProjects = await getUserProjects();
    setProjects(userProjects);
    setLoadingProjects(false);
  };

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.pages.some(pg => pg.fullText.toLowerCase().includes(q))
    );
  }, [projects, search]);

  const handleCapture = async (files: File[]) => {
    const urls = await uploadImages(files);
    if (!urls.length) return;
    const pages = await processImages(urls);
    if (pages.length) setOcrPages(pages);
  };

  const handleSaveProject = async (pages: ProjectPage[]) => {
    const title = projectTitle.trim() || `Escaneo ${new Date().toLocaleDateString('es-CR')}`;
    const projectId = await saveProject({ title, pages });
    if (projectId) {
      setOcrPages(null);
      setProjectTitle('');
      await loadProjects();
      navigate(`/document/${projectId}`);
    }
  };

  const requestDelete = (project: ProjectData) => {
    setPendingDelete(project);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await deleteProject(pendingDelete.id!, pendingDelete.pages);
      await loadProjects();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const isProcessing = uploading || processing;

  return (
    <div className="min-h-screen bg-app-bg flex">
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      <Sidebar documentCount={projects.length} onNewScan={() => setShowCamera(true)} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar móvil */}
        <header className="lg:hidden auth-glass-card border-b border-white/5 sticky top-0 z-30 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <ScanText className="w-4 h-4 text-primary" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-on-surface">Digidoc CR</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden auth-glass-card border-b border-white/5 px-4 py-3 z-20 space-y-2">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <User className="w-4 h-4" />
              <span className="truncate">{user?.displayName || user?.email}</span>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/stats'); }}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              Estadísticas
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); setConfirmLogout(true); }}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-error transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}

        <main className="flex-1 relative z-10 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-on-surface">Mis documentos</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {projects.length} {projects.length === 1 ? 'documento' : 'documentos'} escaneados
              </p>
            </div>
          </div>

          {/* Barra de progreso OCR */}
          {isProcessing && progress && (
            <div className="mb-6 bg-surface-container border border-outline-variant rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin-slow shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-on-surface font-medium">
                  Procesando imágenes... {progress.done}/{progress.total}
                </p>
                <div className="mt-1.5 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          {projects.length > 0 && (
            <div className="mb-6">
              <SearchBar value={search} onChange={setSearch} />
            </div>
          )}

          {/* Grid */}
          {loadingProjects ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onScan={() => setShowCamera(true)} />
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-on-surface-variant text-sm">No se encontraron documentos para "{search}"</p>
              <button onClick={() => setSearch('')} className="text-primary text-sm mt-2 hover:underline">
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onDelete={requestDelete} />
              ))}
            </div>
          )}
        </main>
      </div>

      <FAB onClick={() => setShowCamera(true)} />

      {showCamera && (
        <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}

      {ocrPages && (
        <OCRResults
          pages={ocrPages}
          projectTitle={projectTitle}
          onTitleChange={setProjectTitle}
          onSave={handleSaveProject}
          onClose={() => { setOcrPages(null); setProjectTitle(''); }}
          saving={firestoreLoading}
        />
      )}

      <ConfirmDialog
        open={confirmOpen && !!pendingDelete}
        variant="danger"
        title="¿Eliminar documento?"
        description={`Está a punto de eliminar "${pendingDelete?.title}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
      <ConfirmDialog
        open={confirmLogout}
        variant="logout"
        title="¿Cerrar sesión?"
        description="Se cerrará tu sesión actual. Podrás volver a iniciar sesión cuando quieras."
        confirmLabel="Cerrar sesión"
        onConfirm={() => { setConfirmLogout(false); logout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
};

export default DashboardPage;

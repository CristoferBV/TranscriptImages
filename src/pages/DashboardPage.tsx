import React, { useState, useEffect } from 'react';
import { Camera, Plus, LogOut, User, FolderOpen, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CameraCapture from '../components/camera/CameraCapture';
import OCRResults from '../components/ocr/OCRResults';
import ProjectCard from '../components/projects/ProjectCard';
import { useAuthState, useAuthActions } from '../hooks/useAuth';
import { useImageUpload } from '../hooks/useImageUpload';
import { useOCR, OCRResult } from '../hooks/useOCR';
import { useFirestore, ProjectData } from '../hooks/useFirestore';
import Input from '../components/ui/Input';

const DashboardPage: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'projects'>('new');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuthState();
  const { logout } = useAuthActions();
  const { uploadImage, uploading } = useImageUpload();
  const { processImage, processing } = useOCR();
  const { saveProject, getUserProjects, deleteProject, loading: firestoreLoading } = useFirestore();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const userProjects = await getUserProjects();
    setProjects(userProjects);
  };

  const handleImageCapture = async (file: File) => {
    const imageUrl = await uploadImage(file);
    if (!imageUrl) return;
    setCurrentImage(imageUrl);
    const result = await processImage(imageUrl);
    if (result) setOcrResult(result);
  };

  const handleSaveProject = async (data: OCRResult) => {
    if (!currentImage) return;
    const title = projectTitle.trim() || `Proyecto ${new Date().toLocaleDateString()}`;
    const projectId = await saveProject({
      title,
      imageUrl: currentImage,
      fullText: data.fullText,
      materials: data.materials,
      measurements: data.measurements,
      instructions: data.instructions,
    });
    if (projectId) {
      setCurrentImage(null);
      setOcrResult(null);
      setProjectTitle('');
      await loadProjects();
      setActiveTab('projects');
    }
  };

  const requestDeleteProject = (project: ProjectData) => {
    setPendingDelete(project);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await deleteProject(pendingDelete.id!, pendingDelete.imageUrl);
      await loadProjects();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const isProcessing = uploading || processing;

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Ambient orbs */}
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      {/* Header */}
      <div className="auth-glass-card border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-on-primary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-on-surface">Digidoc CR</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 text-sm text-on-surface-variant">
                <User className="w-4 h-4" />
                <span className="truncate max-w-[120px] sm:max-w-32" title={user?.displayName || user?.email || ''}>
                  {user?.displayName || user?.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-surface-container rounded-lg p-1">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Nuevo proyecto</span>
            <span className="xs:hidden">Nuevo</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Mis proyectos ({projects.length})</span>
            <span className="xs:hidden">Proyectos ({projects.length})</span>
          </button>
        </div>

        {/* Tab: Nuevo proyecto */}
        {activeTab === 'new' && (
          <div className="space-y-6">
            {!currentImage ? (
              <Card className="text-center py-8 sm:py-12">
                <Camera className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-on-surface-variant mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-on-surface mb-2">
                  Digitalizar documentos
                </h3>
                <p className="text-sm sm:text-base text-on-surface-variant mb-6 max-w-md mx-auto px-4">
                  Tome una foto o cargue una imagen, PDF o documento escaneado para
                  extraer, organizar y convertir información en datos digitales listos
                  para procesar y exportar.
                </p>
                <Button onClick={() => setShowCamera(true)} size="lg" disabled={isProcessing} className="w-full sm:w-auto">
                  <Camera className="w-5 h-5 mr-2" />
                  Iniciar digitalización
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <Input
                    label="Título del proyecto"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Ingrese un nombre para este proyecto"
                    helperText="Déjelo vacío para generar un nombre automáticamente"
                    className="text-base"
                  />
                </Card>

                <Card>
                  <h3 className="text-base sm:text-lg font-medium text-on-surface mb-4">
                    Documento cargado
                  </h3>
                  <div className="aspect-video bg-surface-container-high rounded-lg overflow-hidden mb-4">
                    <img src={currentImage} alt="Documento cargado" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentImage(null);
                        setOcrResult(null);
                        setProjectTitle('');
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cargar otro documento
                    </Button>
                    {isProcessing && (
                      <div className="flex items-center text-sm text-on-surface-variant w-full sm:w-auto justify-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Procesando documento...
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab: Mis proyectos */}
        {activeTab === 'projects' && (
          <div>
            {projects.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <FolderOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-on-surface-variant mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-on-surface mb-2">
                  Aún no hay proyectos
                </h3>
                <p className="text-sm sm:text-base text-on-surface-variant mb-6 px-4">
                  Comience digitalizando su primer documento.
                </p>
                <Button onClick={() => setActiveTab('new')} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer proyecto
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={requestDeleteProject}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Cámara */}
      {showCamera && (
        <CameraCapture onCapture={handleImageCapture} onClose={() => setShowCamera(false)} />
      )}

      {/* Modal: Resultados OCR */}
      {ocrResult && (
        <OCRResults
          result={ocrResult}
          onSave={handleSaveProject}
          onClose={() => setOcrResult(null)}
          saving={firestoreLoading}
        />
      )}

      {/* Modal: Confirmar eliminación */}
      {confirmOpen && pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container border border-outline-variant shadow-2xl">
            <div className="px-5 pt-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-error-container/20 p-2 text-error">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface">
                  ¿Eliminar proyecto?
                </h3>
              </div>
              <p className="mt-3 px-1 text-sm text-on-surface-variant">
                Está a punto de eliminar{' '}
                <span className="font-medium text-on-surface">"{pendingDelete.title}"</span>.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-outline-variant px-5 py-4">
              <Button
                variant="outline"
                className="min-w-[96px]"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingDelete(null);
                }}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                className="min-w-[96px] bg-error text-on-error hover:opacity-90"
                onClick={confirmDelete}
                loading={deleting}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

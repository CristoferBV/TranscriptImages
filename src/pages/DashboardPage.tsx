import React, { useState, useEffect } from 'react';
import { Camera, Plus, LogOut, User, FolderOpen } from 'lucide-react';
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

  const { user } = useAuthState();
  const { logout } = useAuthActions();
  const { uploadImage, uploading } = useImageUpload();
  const { processImage, processing } = useOCR();
  const { saveProject, getUserProjects, loading: firestoreLoading } = useFirestore();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const userProjects = await getUserProjects();
    setProjects(userProjects);
  };

  const handleImageCapture = async (file: File) => {
    setShowCamera(false);
    
    // Upload image to Firebase Storage
    const imageUrl = await uploadImage(file);
    if (!imageUrl) return;

    setCurrentImage(imageUrl);
    
    // Process image with OCR
    const result = await processImage(imageUrl);
    if (result) {
      setOcrResult(result);
    }
  };

  const handleSaveProject = async (data: OCRResult) => {
    if (!currentImage) return;

    const title = projectTitle.trim() || `Project ${new Date().toLocaleDateString()}`;
    
    const projectData = {
      title,
      imageUrl: currentImage,
      fullText: data.fullText,
      materials: data.materials,
      measurements: data.measurements,
      instructions: data.instructions,
    };

    const projectId = await saveProject(projectData);
    if (projectId) {
      // Reset form
      setCurrentImage(null);
      setOcrResult(null);
      setProjectTitle('');
      
      // Reload projects
      await loadProjects();
      
      // Switch to projects tab
      setActiveTab('projects');
    }
  };

  const isProcessing = uploading || processing;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Furniture OCR
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.displayName || user?.email}</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            New Project
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-2" />
            My Projects ({projects.length})
          </button>
        </div>

        {/* New Project Tab */}
        {activeTab === 'new' && (
          <div className="space-y-6">
            {!currentImage ? (
              <Card className="text-center py-12">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Capture Construction Documents
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Take a photo or upload an image of furniture construction documents, 
                  plans, or specifications to extract text and organize information.
                </p>
                
                <Button
                  onClick={() => setShowCamera(true)}
                  size="lg"
                  disabled={isProcessing}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Capture
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Project Title Input */}
                <Card>
                  <Input
                    label="Project Title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter a title for this project"
                    helperText="Leave blank to auto-generate based on date"
                  />
                </Card>

                {/* Image Preview */}
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Captured Image</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={currentImage}
                      alt="Captured document"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentImage(null);
                        setOcrResult(null);
                        setProjectTitle('');
                      }}
                    >
                      Capture New Image
                    </Button>
                    
                    {isProcessing && (
                      <div className="flex items-center text-sm text-gray-600">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing image...
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* My Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            {projects.length === 0 ? (
              <Card className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Projects Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by capturing your first construction document.
                </p>
                <Button onClick={() => setActiveTab('new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* OCR Results Modal */}
      {ocrResult && (
        <OCRResults
          result={ocrResult}
          onSave={handleSaveProject}
          onClose={() => setOcrResult(null)}
          saving={firestoreLoading}
        />
      )}
    </div>
  );
};

export default DashboardPage;
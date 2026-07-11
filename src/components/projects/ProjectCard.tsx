import React from 'react';
import { FileText, Download, Calendar, Trash2, AlignLeft } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ProjectData } from '../../hooks/useFirestore';
import { useExport } from '../../hooks/useExport';

interface ProjectCardProps {
  project: ProjectData;
  onDelete?: (project: ProjectData) => void;
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const wordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const { exportToPDF, exportToExcel, exporting } = useExport();

  return (
    <Card className="hover:shadow-inner-glass transition-all duration-200 hover:-translate-y-1">
      <div className="flex flex-col space-y-4">

        {/* Imagen */}
        <div className="aspect-video bg-surface-container-high rounded-lg overflow-hidden">
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-on-surface line-clamp-2">
            {project.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDate(project.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 shrink-0" />
              <span>{wordCount(project.fullText)} palabras</span>
            </div>
          </div>

          {/* Preview del texto */}
          {project.fullText && (
            <p className="text-xs text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 line-clamp-2 leading-relaxed">
              {project.fullText}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(project)}
              className="text-error hover:bg-error-container/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(project)}
              loading={exporting}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(project)}
              loading={exporting}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;

import React from 'react';
import { FileText, Download, Calendar, Trash2 } from 'lucide-react';
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

const STATS = [
  { labelKey: 'materials' as const, label: 'Materiales', colorClass: 'text-primary', bgClass: 'bg-primary/10' },
  { labelKey: 'measurements' as const, label: 'Medidas', colorClass: 'text-secondary', bgClass: 'bg-secondary/10' },
  { labelKey: 'instructions' as const, label: 'Pasos', colorClass: 'text-tertiary', bgClass: 'bg-tertiary/10' },
];

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const { exportToPDF, exportToExcel, exporting } = useExport();

  return (
    <Card className="hover:shadow-inner-glass transition-all duration-200 hover:-translate-y-1">
      <div className="flex flex-col space-y-4">
        {/* Imagen del proyecto */}
        <div className="aspect-video bg-surface-container-high rounded-lg overflow-hidden">
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-on-surface mb-2 line-clamp-2">
            {project.title}
          </h3>
          <div className="flex items-center text-xs sm:text-sm text-on-surface-variant mb-3">
            <Calendar className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{formatDate(project.updatedAt)}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm mb-4">
            {STATS.map(({ labelKey, label, colorClass, bgClass }) => (
              <div key={labelKey} className={`text-center p-2 sm:p-3 rounded-lg ${bgClass}`}>
                <div className={`font-bold text-lg sm:text-xl ${colorClass}`}>
                  {project[labelKey].length}
                </div>
                <div className={`font-medium ${colorClass}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-outline-variant space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(project)}
                className="w-full sm:w-auto text-error hover:bg-error-container/20"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(project)}
              loading={exporting}
              disabled={exporting}
              className="flex-1 sm:flex-none"
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
              className="flex-1 sm:flex-none"
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

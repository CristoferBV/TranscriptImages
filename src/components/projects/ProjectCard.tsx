import React from 'react';
import { FileText, Download, Calendar, Edit, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ProjectData } from '../../hooks/useFirestore';
import { useExport } from '../../hooks/useExport';

interface ProjectCardProps {
  project: ProjectData;
  onEdit?: (project: ProjectData) => void;
  onDelete?: (project: ProjectData) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const { exportToPDF, exportToExcel, exporting } = useExport();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
      <div className="flex flex-col space-y-4">
        {/* Project Image */}
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-sm">
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
        </div>

        {/* Project Info */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h3>

          <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4 mr-1" />
            <span className="truncate">{formatDate(project.updatedAt)}</span>
          </div>

          {/* Content Summary */}
          <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm mb-4">
            <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="font-bold text-lg sm:text-xl text-blue-800">{project.materials.length}</div>
              <div className="text-blue-600 font-medium">Materials</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
              <div className="font-bold text-lg sm:text-xl text-green-800">{project.measurements.length}</div>
              <div className="text-green-600 font-medium">Measures</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
              <div className="font-bold text-lg sm:text-xl text-orange-800">{project.instructions.length}</div>
              <div className="text-orange-600 font-medium">Steps</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-gray-200 space-y-2 sm:space-y-0">
          {/* Left: Delete */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(project)} className="w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(project)}
                className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Right: Export */}
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

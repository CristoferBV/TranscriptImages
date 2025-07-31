import React from 'react';
import { FileText, Download, Calendar, Edit } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ProjectData } from '../../hooks/useFirestore';
import { useExport } from '../../hooks/useExport';

interface ProjectCardProps {
  project: ProjectData;
  onEdit?: (project: ProjectData) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit }) => {
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
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex flex-col space-y-4">
        {/* Project Image */}
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Project Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {project.title}
          </h3>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(project.updatedAt)}
          </div>

          {/* Content Summary */}
          <div className="grid grid-cols-3 gap-2 text-sm mb-4">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">{project.materials.length}</div>
              <div className="text-blue-600">Materials</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">{project.measurements.length}</div>
              <div className="text-green-600">Measurements</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="font-medium text-orange-800">{project.instructions.length}</div>
              <div className="text-orange-600">Instructions</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
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
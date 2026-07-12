import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlignLeft, Trash2, ArrowRight, Images } from 'lucide-react';
import { ProjectData } from '../../hooks/useFirestore';

interface ProjectCardProps {
  project: ProjectData;
  onDelete?: (project: ProjectData) => void;
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);
};

const totalWords = (project: ProjectData) => {
  const text = project.pages.map(p => p.fullText).join(' ');
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const navigate = useNavigate();
  const firstImage = project.pages[0]?.imageUrl;
  const previewText = project.pages.map(p => p.fullText).join(' ').trim();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project);
  };

  return (
    <div
      onClick={() => navigate(`/document/${project.id}`)}
      className="group bg-surface-container border border-outline-variant rounded-lg overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Imagen */}
      <div className="aspect-video bg-surface-container-high overflow-hidden relative">
        {firstImage && (
          <img
            src={firstImage}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {/* Badge páginas */}
        {project.pages.length > 1 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
            <Images className="w-3 h-3" />
            {project.pages.length} págs.
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <ArrowRight className="w-3.5 h-3.5 text-on-primary" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
          {project.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlignLeft className="w-3 h-3 shrink-0" />
            <span>{totalWords(project)} palabras</span>
          </div>
        </div>

        {previewText && (
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {previewText}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50">
          <span className="text-xs text-primary/70 font-medium">Ver documento →</span>
          {onDelete && (
            <button
              onClick={handleDelete}
              aria-label="Eliminar"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

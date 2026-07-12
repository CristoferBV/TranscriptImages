import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="bg-surface-container border border-outline-variant rounded-lg p-4 animate-pulse">
    <div className="aspect-video bg-surface-container-high rounded-lg mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-surface-container-high rounded w-3/4" />
      <div className="h-3 bg-surface-container-high rounded w-1/2" />
      <div className="h-3 bg-surface-container-high rounded w-full" />
      <div className="h-3 bg-surface-container-high rounded w-2/3" />
    </div>
    <div className="flex justify-between mt-4 pt-3 border-t border-outline-variant">
      <div className="h-8 bg-surface-container-high rounded w-20" />
      <div className="flex gap-2">
        <div className="h-8 bg-surface-container-high rounded w-16" />
        <div className="h-8 bg-surface-container-high rounded w-16" />
      </div>
    </div>
  </div>
);

export default SkeletonCard;

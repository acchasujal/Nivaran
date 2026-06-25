import React, { useState, useEffect } from 'react';
import { ZoomIn, Trash2, RotateCcw } from 'lucide-react';
import { ImageViewer } from '../dialogs/ImageViewer';
import { cn } from '@/lib/utils';

interface PhotoPreviewProps {
  file: File;
  onRemove: () => void;
  onReplace?: () => void;
  className?: string;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  file,
  onRemove,
  onReplace,
  className,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Generate object URL for file preview and clean it up on unmount/change
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!previewUrl) return null;

  return (
    <div className={cn('relative w-full rounded-medium border border-secondary-border overflow-hidden bg-slate-50 group select-none', className)}>
      {/* Preview Image */}
      <img
        src={previewUrl}
        alt="Report Evidence Preview"
        className="w-full h-48 md:h-56 object-cover"
      />

      {/* Overlay Actions (visible on hover) */}
      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
        {/* Zoom Action */}
        <button
          type="button"
          onClick={() => setIsViewerOpen(true)}
          className="p-2.5 rounded-full bg-white/95 text-slate-800 hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow"
          title="Zoom image"
        >
          <ZoomIn size={16} />
        </button>

        {/* Replace / Retry Action */}
        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="p-2.5 rounded-full bg-white/95 text-slate-800 hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow"
            title="Replace image"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* Remove Action */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2.5 rounded-full bg-rose-600/95 text-white hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow"
          title="Remove image"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Mini details badge */}
      <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-sm text-[10px] text-white px-2 py-1 rounded-small font-medium font-sans">
        {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.name.slice(-12)}
      </div>

      {/* Lightbox / Zoom Dialog */}
      {isViewerOpen && (
        <ImageViewer
          src={previewUrl}
          alt={file.name}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
};
export default PhotoPreview;

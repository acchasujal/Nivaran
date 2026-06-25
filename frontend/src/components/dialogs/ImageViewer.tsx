import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = 'Uploaded preview', onClose }) => {
  const [scale, setScale] = useState(1);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 0.75));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 transition-opacity select-none"
      onClick={onClose}
    >
      {/* Top Bar Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.75}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white disabled:opacity-40 transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 3}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white disabled:opacity-40 transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white transition-colors cursor-pointer"
          aria-label="Close viewer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image container */}
      <div className="max-w-full max-h-full overflow-auto p-4 flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})` }}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-small shadow-2xl transition-transform duration-200 ease-out pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
export default ImageViewer;

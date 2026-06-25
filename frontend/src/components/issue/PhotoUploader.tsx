import React, { useState, useRef } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  onCapture: (file: File) => void;
  className?: string;
}

// Client-side image resizing helper (resizes to max 1920px dimensions, keeping ratio)
const resizeImage = (file: File, maxWidth = 1920, maxHeight = 1920): Promise<File> => {
  return new Promise((resolve) => {
    // Only resize image types
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Check if resizing is necessary
        if (width <= maxWidth && height <= maxHeight) {
          resolve(file);
          return;
        }

        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const resizedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type || 'image/jpeg',
          0.85 // quality compression ratio
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onCapture, className }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (file: File) => {
    setError(null);

    // Validate type (JPG/PNG only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG or PNG image.');
      return;
    }

    // Validate size (8MB max)
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('File is too large. Maximum allowed size is 8MB.');
      return;
    }

    try {
      setResizing(true);
      const processedFile = await resizeImage(file);
      onCapture(processedFile);
    } catch (err) {
      setError('Error processing image. Please try again.');
    } finally {
      setResizing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-medium p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none min-h-[220px] transition-all',
          isDragActive 
            ? 'border-primary bg-blue-50/30' 
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
          onChange={handleFileChange}
          disabled={resizing}
        />

        {resizing ? (
          <div className="flex flex-col items-center space-y-2">
            <span className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
            <span className="text-xs font-semibold text-slate-500 font-sans">Optimizing photo quality...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-secondary-border text-slate-400 mb-4 shrink-0">
              <Camera size={22} className="stroke-[1.5]" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-semibold text-secondary-foreground font-sans">
                Upload issue photo
              </p>
              <p className="text-xs text-slate-400 font-normal font-sans">
                Drag and drop, or tap to capture/select file
              </p>
              <p className="text-[10px] text-slate-400 font-normal font-sans pt-1">
                PNG, JPG, or JPEG up to 8MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-100 rounded-small select-none animate-fade">
          <AlertCircle size={14} className="shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}
    </div>
  );
};
export default PhotoUploader;

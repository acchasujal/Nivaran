import React, { useState, useRef } from 'react';
import { ShieldCheck, RefreshCw, Camera } from 'lucide-react';
import { Button } from '../buttons/Button';
import { cn } from '../../../lib/utils';

export interface ImageUploadProps {
  label?: string;
  onImageCaptured?: (file: File, altText: string) => void;
  previewUrl?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Capture Evidence Photo',
  onImageCaptured,
  previewUrl,
  className,
}) => {
  const [image, setImage] = useState<string | null>(previewUrl || null);
  const [altText, setAltText] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShutterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[EvidenceUpload] shutter clicked, triggering file input click');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setFileObj(file);
      const url = URL.createObjectURL(file);
      setImage(url);
      const defaultAlt = `Civic evidence photo taken ${new Date().toLocaleTimeString()}`;
      setAltText(defaultAlt);
      onImageCaptured?.(file, defaultAlt);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setFileObj(null);
    setAltText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full font-sans space-y-3', className)}>
      <label htmlFor="evidence-photo-input" className="block text-sm font-medium text-neutral-900 select-none">
        {label}
      </label>

      <div className="p-2.5 bg-primary-500/10 border border-primary-500/20 rounded-md flex items-center gap-2 text-xs text-primary-900">
        <ShieldCheck className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
        <span>
          <strong>EXIF Privacy Protection:</strong> GPS metadata & camera serial numbers are automatically stripped before dispatch.
        </span>
      </div>

      <input
        ref={fileInputRef}
        id="evidence-photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        style={{ display: 'none' }}
      />

      {!image ? (
        <div
          onClick={handleShutterClick}
          className="flex flex-col items-center justify-center p-8 bg-neutral-100 border-2 border-dashed border-neutral-300 hover:border-primary-500 hover:bg-slate-200/40 rounded-lg text-center space-y-4 cursor-pointer transition-colors"
        >
          <button
            type="button"
            onClick={handleShutterClick}
            aria-label="Take Evidence Photo"
            className="min-w-[72px] min-h-[72px] rounded-full bg-primary-700 hover:bg-primary-500 text-white shadow-premium flex items-center justify-center border-4 border-white active:scale-95 transition-transform duration-fast focus-visible:ring-4 focus-visible:ring-primary-500 cursor-pointer"
          >
            <Camera className="w-8 h-8" aria-hidden="true" />
          </button>
          <span className="text-xs text-neutral-700 font-medium select-none">
            Tap shutter button (72×72px) to launch camera or upload photo
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-neutral-200 aspect-video bg-neutral-900 flex items-center justify-center">
            <img src={image} alt={altText || 'Evidence preview'} className="object-contain max-h-full w-full" />
            <div className="absolute top-2 right-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetake}
                leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retake Photo
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="img-alt" className="block text-xs font-medium text-neutral-900 mb-1">
              Accessibility Alt Text Description (Required for visual evidence)
            </label>
            <input
              id="img-alt"
              type="text"
              value={altText}
              onChange={(e) => {
                setAltText(e.target.value);
                if (fileObj) onImageCaptured?.(fileObj, e.target.value);
              }}
              placeholder="Describe evidence photo (e.g., Damaged road surface near main intersection)"
              className="w-full min-h-[44px] px-3 text-sm border border-neutral-200 rounded-md font-sans focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

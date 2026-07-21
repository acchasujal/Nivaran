import React from 'react';
import { ImageUpload } from '../../../design-system/primitives/forms/ImageUpload';

export interface CameraUploadStepProps {
  previewUrl: string | null;
  onImageCaptured: (file: File, altText: string) => void;
}

export const CameraUploadStep: React.FC<CameraUploadStepProps> = ({
  previewUrl,
  onImageCaptured,
}) => {
  return (
    <div className="space-y-4 font-sans">
      <ImageUpload
        label="Capture Evidence Photo (Required)"
        previewUrl={previewUrl || undefined}
        onImageCaptured={onImageCaptured}
      />
    </div>
  );
};

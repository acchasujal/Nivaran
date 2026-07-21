import React from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { ShieldCheck } from 'lucide-react';

export interface EvidenceReviewStepProps {
  photoPreviewUrl: string | null;
  altText: string;
  onChangeAltText: (alt: string) => void;
}

export const EvidenceReviewStep: React.FC<EvidenceReviewStepProps> = ({
  photoPreviewUrl,
  altText,
  onChangeAltText,
}) => {
  return (
    <div className="space-y-4 font-sans">
      <Surface variant="card" elevation={1} className="p-4 space-y-3">
        <h4 className="text-sm font-semibold text-neutral-900">Review Evidence Photo Asset</h4>

        {photoPreviewUrl ? (
          <div className="relative rounded-md overflow-hidden bg-neutral-900 aspect-video flex items-center justify-center max-h-60 border border-neutral-200">
            <img src={photoPreviewUrl} alt={altText || 'Captured evidence'} className="object-contain max-h-full w-full" />
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-neutral-700 bg-neutral-100 rounded-md">
            No photo asset selected. Please return to Step 1 to attach evidence.
          </div>
        )}

        <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-md text-xs text-primary-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-700 shrink-0" />
          <span>Cryptographic EXIF metadata stripped. GPS & camera serial sanitized for citizen privacy.</span>
        </div>

        <div>
          <label htmlFor="review-alt" className="block text-xs font-medium text-neutral-900 mb-1">
            Accessibility Alt Text Description
          </label>
          <input
            id="review-alt"
            type="text"
            value={altText}
            onChange={(e) => onChangeAltText(e.target.value)}
            placeholder="Describe evidence photo for screen reader users..."
            className="w-full min-h-[44px] px-3 text-sm border border-neutral-200 rounded-md font-sans focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </Surface>
    </div>
  );
};

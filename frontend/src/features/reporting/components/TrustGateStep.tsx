import React from 'react';
import { EvidenceChecklist } from '../../../design-system/composites/evidence/EvidenceChecklist';
import { ShieldCheck } from 'lucide-react';

export interface TrustGateStepProps {
  credibilityScore?: number;
}

export const TrustGateStep: React.FC<TrustGateStepProps> = ({ credibilityScore = 0.92 }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-success">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="text-sm font-semibold text-neutral-900">Evidence Trust Gate Passed</h4>
        </div>
        <span className="text-xs font-mono font-bold text-success bg-white px-2 py-0.5 rounded-sm border border-green-200">
          Credibility: {(credibilityScore * 100).toFixed(0)}%
        </span>
      </div>

      <EvidenceChecklist
        title="OpenCV & Cryptographic Validation Checklist"
        items={[
          { id: '1', label: 'Image Clarity & Sharpness Test', status: 'passed', detail: 'Laplacian variance check passed (>100)' },
          { id: '2', label: 'EXIF Metadata Sanitization', status: 'passed', detail: 'GPS tags and camera hardware IDs stripped' },
          { id: '3', label: 'Spatial Bounds Verification', status: 'passed', detail: 'Coordinates match municipal jurisdiction' },
          { id: '4', label: 'Duplicate Asset Inspection', status: 'passed', detail: 'Hash check confirmed unique image submission' },
        ]}
      />
    </div>
  );
};

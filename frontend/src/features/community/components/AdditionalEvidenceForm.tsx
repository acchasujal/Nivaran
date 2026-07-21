import React, { useState } from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Textarea } from '../../../design-system/primitives/forms/Textarea';
import { ImageUpload } from '../../../design-system/primitives/forms/ImageUpload';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Camera, Send, PlusCircle } from 'lucide-react';

export interface AdditionalEvidenceFormProps {
  caseId: string;
  onEvidenceSubmit: (evidence: { photoFile: File | null; comment: string }) => void;
  className?: string;
}

export const AdditionalEvidenceForm: React.FC<AdditionalEvidenceFormProps> = ({
  caseId,
  onEvidenceSubmit,
  className,
}) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && !photoFile) return;
    onEvidenceSubmit({ photoFile, comment });
    setSubmitted(true);
  };

  return (
    <Surface variant="card" className={`p-6 space-y-4 font-sans ${className || ''}`}>
      <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-neutral-100 pb-2">
        <Camera className="w-5 h-5" />
        <h3 className="text-base text-neutral-900">Contribute Supplemental Evidence & Field Notes</h3>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-neutral-700">
            Attaching ground photos or status updates to Case ID: <strong className="font-mono text-neutral-900">{caseId}</strong>
          </p>

          <Textarea
            name="evidenceComment"
            label="Structured Field Observation"
            placeholder="Describe site changes, current weather/flood impact, or contractor activity observed..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <ImageUpload
            label="Attach Geotagged Supplemental Evidence Photo (Optional)"
            onImageCaptured={(file) => setPhotoFile(file)}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={!comment.trim() && !photoFile}
              leadingIcon={<Send className="w-4 h-4" />}
            >
              Submit Contribution
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center text-xs text-neutral-900 space-y-2">
          <p className="font-semibold text-success">Supplemental Evidence Successfully Submitted!</p>
          <p className="text-neutral-700">Your contribution has been appended to the public evidence ledger.</p>
          <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)} leadingIcon={<PlusCircle className="w-3.5 h-3.5" />}>
            Add Another Contribution
          </Button>
        </div>
      )}
    </Surface>
  );
};

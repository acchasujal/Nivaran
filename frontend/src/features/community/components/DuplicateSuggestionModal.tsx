import React, { useState } from 'react';
import { Dialog } from '../../../design-system/primitives/overlays/Dialog';
import { TextField } from '../../../design-system/primitives/forms/TextField';
import { Textarea } from '../../../design-system/primitives/forms/Textarea';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Copy, CheckCircle2 } from 'lucide-react';

export interface DuplicateSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSuggestMerge: (targetCaseId: string, reason: string) => void;
}

export const DuplicateSuggestionModal: React.FC<DuplicateSuggestionModalProps> = ({
  open,
  onOpenChange,
  caseId,
  onSuggestMerge,
}) => {
  const [targetCaseId, setTargetCaseId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCaseId.trim()) return;
    onSuggestMerge(targetCaseId, reason);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setTargetCaseId('');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Suggest Duplicate Case Merge"
      description={`Report duplicate issue for Case ID: #${caseId}`}
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans py-2">
          <TextField
            name="targetCaseId"
            label="Target Existing Case ID (e.g. CP-2026-881)"
            placeholder="Enter existing case ID..."
            value={targetCaseId}
            onChange={(e) => setTargetCaseId(e.target.value)}
            required
          />

          <Textarea
            name="duplicateReason"
            label="Reasoning / Proximity Note"
            placeholder="Explain why these two reports refer to the exact same physical hazard..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!targetCaseId.trim()}
              leadingIcon={<Copy className="w-4 h-4" />}
            >
              Submit Duplicate Merge Suggestion
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 text-center font-sans space-y-3 py-4">
          <div className="inline-flex p-3 bg-green-100 text-success rounded-pill">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-neutral-900">Merge Suggestion Dispatched</h4>
          <p className="text-xs text-neutral-700">
            Municipal triage officers will review this duplicate report during executive queue processing.
          </p>
          <div className="pt-2 flex justify-center">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

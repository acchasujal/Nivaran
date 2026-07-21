import React, { useState } from 'react';
import { useApproveDraft, useUpdateDraft, useEscalateDraft } from '../../../api/queries';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Textarea } from '../../../design-system/primitives/forms/Textarea';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { FileText, CheckCircle2, Send } from 'lucide-react';
import type { ActionDraft } from '../../../api/types';

export interface DraftReviewPanelProps {
  issueId: string;
  draft: ActionDraft;
  className?: string;
}

export const DraftReviewPanel: React.FC<DraftReviewPanelProps> = ({ issueId, draft, className }) => {
  const [content, setContent] = useState(draft.content);
  const approveMutation = useApproveDraft(issueId);
  const updateMutation = useUpdateDraft(issueId);
  const escalateMutation = useEscalateDraft(issueId);

  const handleSave = async () => {
    await updateMutation.mutateAsync({ draftId: draft.id, content });
  };

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ draftId: draft.id, status: 'approved' });
  };

  const handleEscalate = async () => {
    await escalateMutation.mutateAsync({ draftId: draft.id, method: 'email', recipient: 'mayor@noida.gov.in' });
  };

  return (
    <Surface variant="card" className={`p-6 space-y-4 font-sans ${className || ''}`}>
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <div className="flex items-center gap-2 text-primary-700 font-semibold">
          <FileText className="w-5 h-5" />
          <h3 className="text-base text-neutral-900">Legal Complaint Directive Review — #{draft.id}</h3>
        </div>
        <span className="text-xs font-mono font-bold uppercase text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm">
          {draft.status}
        </span>
      </div>

      <Textarea
        name="draftContent"
        label="Edit Complaint Text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
        <Button
          variant="secondary"
          size="sm"
          loading={updateMutation.isPending}
          onClick={handleSave}
        >
          Save Edits
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={approveMutation.isPending}
            onClick={handleApprove}
            leadingIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Approve Draft Directive
          </Button>

          <Button
            variant="danger"
            size="sm"
            loading={escalateMutation.isPending}
            onClick={handleEscalate}
            leadingIcon={<Send className="w-4 h-4" />}
          >
            Escalate to Mayor / Executive
          </Button>
        </div>
      </div>
    </Surface>
  );
};

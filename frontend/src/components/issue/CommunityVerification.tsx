import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Camera, MessageSquare, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/shared/HelpTooltip';

interface CommunityVerificationProps {
  issueId?: string; // reserved for future backend integration
  confirmCount?: number;
}

type ActionType = 'confirm' | 'photo' | 'comment' | null;

export const CommunityVerification: React.FC<CommunityVerificationProps> = ({
  issueId: _issueId, // reserved for future backend integration
  confirmCount = 0,
}) => {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [localConfirmCount, setLocalConfirmCount] = useState(confirmCount);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  const [submittedComment, setSubmittedComment] = useState<string | null>(null);
  const [photoSubmitted, setPhotoSubmitted] = useState(false);

  const handleConfirm = () => {
    if (hasConfirmed) return;
    setHasConfirmed(true);
    setLocalConfirmCount((c) => c + 1);
    setActiveAction(null);
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    setSubmittedComment(comment.trim());
    setComment('');
    setActiveAction(null);
  };

  const handlePhotoNote = () => {
    setPhotoSubmitted(true);
    setActiveAction(null);
  };

  return (
    <div className="border border-slate-200 bg-white rounded-medium shadow-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2 select-none">
          <MessageSquare size={15} className="text-primary shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              Community Verification
              <HelpTooltip text="Allows multiple citizens to strengthen evidence for the same civic issue." />
            </h4>
            <p className="text-[10px] text-slate-450 mt-0.5">
              Nearby citizens can verify this report.
            </p>
          </div>
        </div>

        {/* Demo badge */}
        <span className="text-[8px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0">
          Community Layer
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Confirm count display */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border-2 shrink-0 transition-colors',
            hasConfirmed ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'
          )}>
            <ThumbsUp size={20} className={hasConfirmed ? 'fill-emerald-100' : ''} />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{localConfirmCount}</span>
            <span className="text-xs text-slate-500 ml-2">
              {localConfirmCount === 1 ? 'citizen confirmed' : 'citizens confirmed'}
            </span>
            <p className="text-[10px] text-slate-450 mt-0.5">
              Community verification strengthens evidence credibility and escalation priority.
            </p>
          </div>
        </div>

        {/* Submitted items */}
        <AnimatePresence>
          {submittedComment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 border border-slate-200 rounded-small p-3 space-y-1"
            >
              <div className="flex items-center gap-1.5 select-none">
                <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Your comment logged</span>
              </div>
              <p className="text-xs text-slate-700 italic">"{submittedComment}"</p>
            </motion.div>
          )}

          {photoSubmitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 border border-slate-200 rounded-small p-3 flex items-center gap-2"
            >
              <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
              <span className="text-xs text-slate-700">Photo evidence noted — upload feature coming soon.</span>
            </motion.div>
          )}

          {!submittedComment && !photoSubmitted && (
            <div className="border border-dashed border-slate-200 rounded-medium p-4 text-center select-none bg-slate-50/50">
              <span className="text-xs text-slate-500 block font-semibold mb-1">No community contributions yet.</span>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                Be the first to confirm this issue or add your comments to strengthen the verified evidence trail!
              </p>
            </div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={hasConfirmed}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-small border transition-all cursor-pointer active:scale-[0.98]',
              hasConfirmed
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default'
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50 hover:border-slate-350'
            )}
          >
            <ThumbsUp size={13} className={hasConfirmed ? 'fill-emerald-200' : ''} />
            <span>{hasConfirmed ? 'Confirmed ✓' : 'Confirm Issue'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAction(activeAction === 'comment' ? null : 'comment')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-small border border-slate-250 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer active:scale-[0.98]"
          >
            <MessageSquare size={13} />
            <span>Add Comment</span>
          </button>

          <button
            type="button"
            onClick={handlePhotoNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-small border border-slate-250 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Camera size={13} />
            <span>Add Photo</span>
          </button>
        </div>

        {/* Comment Expander */}
        <AnimatePresence>
          {activeAction === 'comment' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe what you observed — e.g. 'This pothole has been here for 3 months and damaged a scooter.'"
                className="w-full text-xs border border-slate-250 rounded-small px-3 py-2 focus:outline-none focus:border-primary resize-none bg-slate-50/50"
                maxLength={300}
              />
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400">{comment.length}/300</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCommentSubmit}
                    disabled={!comment.trim()}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-small transition-all cursor-pointer disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-[9px] text-slate-400 select-none">
          <Info size={11} className="shrink-0 mt-0.5" />
          <span>
            Community verification strengthens evidence credibility and escalation priority.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommunityVerification;

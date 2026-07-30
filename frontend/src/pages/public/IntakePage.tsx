import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useReportingFlowState } from '../../features/reporting/state/useReportingFlowStore';
import { useCreateIssue, useAnalyzeImage } from '../../api/queries';
import { useConnectivity } from '../../core/providers/ConnectivityProvider';
import { useOffline } from '../../core/providers/OfflineProvider';
import { useFeedback } from '../../core/providers/FeedbackProvider';
import { ReportFlowLayout } from '../../design-system/layouts/ReportFlowLayout';
import { Button } from '../../design-system/primitives/buttons/Button';
import { ReportEntryStep } from '../../features/reporting/components/ReportEntryStep';
import { CameraUploadStep } from '../../features/reporting/components/CameraUploadStep';
import { EvidenceReviewStep } from '../../features/reporting/components/EvidenceReviewStep';
import { LocationConfirmStep } from '../../features/reporting/components/LocationConfirmStep';
import { TrustGateStep } from '../../features/reporting/components/TrustGateStep';
import { AISummaryStep } from '../../features/reporting/components/AISummaryStep';
import { CommunityMatchStep } from '../../features/reporting/components/CommunityMatchStep';
import { HumanApprovalStep } from '../../features/reporting/components/HumanApprovalStep';
import { SubmissionSuccessStep } from '../../features/reporting/components/SubmissionSuccessStep';

const STEPS = [
  { id: 1, label: 'Evidence & Category' },
  { id: 2, label: 'Review & Location' },
  { id: 3, label: 'Server Evidence Review' },
  { id: 4, label: 'Corroboration Decision' },
  { id: 5, label: 'Submission Consent' },
  { id: 6, label: 'Case Created' },
];

export const IntakePage: React.FC = () => {
  usePageTitle('Report Civic Hazard — nivaran');
  const navigate = useNavigate();
  const { isOnline } = useConnectivity();
  const { saveDraft } = useOffline();
  const { showToast } = useFeedback();
  const { state, updateState, nextStep, prevStep } = useReportingFlowState();
  const createIssueMutation = useCreateIssue();
  const analyzeImageMutation = useAnalyzeImage();
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    if (state.step === 1 && !state.photoFile) {
      showToast('Please capture or attach an evidence photo before proceeding.', 'warning');
      return;
    }

    if (state.step === 5) {
      // Final submission trigger
      if (!state.consented) {
        showToast('Please review and approve the report before submitting.', 'warning');
        return;
      }

      if (state.latitude === null || state.longitude === null) {
        showToast('Please confirm the incident location before submitting.', 'warning');
        return;
      }

      if (!isOnline) {
        saveDraft({
          title: `${state.issueType.replace('_', ' ')} Report`,
          category: state.issueType,
          payload: {
            latitude: state.latitude,
            longitude: state.longitude,
            user_note: state.userNote,
          },
        });
        showToast('Saved on this device. Automatic offline submission is not available yet.', 'info');
        updateState({ createdIssueId: null });
        nextStep();
        return;
      }

      setSubmitting(true);
      try {
        const created = await createIssueMutation.mutateAsync({
          photo: state.photoFile!,
          latitude: state.latitude,
          longitude: state.longitude,
          user_note: state.userNote,
        });
        updateState({ createdIssueId: created.id });
        showToast('Report submitted for review.', 'success');
        nextStep();
      } catch (err: any) {
        showToast(err?.message || 'Failed to submit report. Please try again.', 'danger');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    nextStep();
  };

  return (
    <ReportFlowLayout
      currentStep={state.step}
      steps={STEPS}
      actions={
        state.step === 6 ? null : (
          <>
            <Button variant="ghost" disabled={state.step === 1 || submitting} onClick={prevStep}>
              Back
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleNext}>
              {state.step === 5 ? 'Approve & Submit Report' : 'Continue'}
            </Button>
          </>
        )
      }
    >
      {state.step === 1 && (
        <div className="space-y-6">
          <ReportEntryStep
            issueType={state.issueType}
            userNote={state.userNote}
            onChangeIssueType={(t) => updateState({ issueType: t })}
            onChangeUserNote={(n) => updateState({ userNote: n })}
          />
          <CameraUploadStep
            previewUrl={state.photoPreviewUrl}
            onImageCaptured={async (file, alt) => {
              const url = URL.createObjectURL(file);
              updateState({ photoFile: file, photoPreviewUrl: url, altText: alt });

              setSubmitting(true);
              try {
                const result = await analyzeImageMutation.mutateAsync({ photo: file });
                updateState({ 
                   latitude: state.latitude || (result.gps_coords ? result.gps_coords[0] : null),
                   longitude: state.longitude || (result.gps_coords ? result.gps_coords[1] : null),
                   issueType: (result.autofill?.category as any) || state.issueType
                });
                showToast('Image analyzed successfully.', 'success');
              } catch (err: any) {
                if (err.response?.status === 400 && err.response?.data?.detail?.error === 'validation_gate_failed') {
                   showToast(err.response?.data?.detail?.message || 'Image rejected: Invalid evidence.', 'danger');
                   updateState({ photoFile: null, photoPreviewUrl: null });
                } else {
                   showToast('Warning: AI analysis failed, but you can proceed manually.', 'warning');
                }
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </div>
      )}

      {state.step === 2 && (
        <div className="space-y-6">
          <EvidenceReviewStep
            photoPreviewUrl={state.photoPreviewUrl}
            altText={state.altText}
            onChangeAltText={(alt) => updateState({ altText: alt })}
          />
          <LocationConfirmStep
            location={state.latitude !== null && state.longitude !== null
              ? { latitude: state.latitude, longitude: state.longitude, locality: state.locality }
              : null}
            onChangeLocation={(coords) =>
              updateState({
                latitude: coords.latitude,
                longitude: coords.longitude,
                locality: coords.locality || state.locality,
              })
            }
          />
        </div>
      )}

      {state.step === 3 && (
        <div className="space-y-6">
          <TrustGateStep />
          <AISummaryStep issueType={state.issueType} userNote={state.userNote} />
        </div>
      )}

      {state.step === 4 && (
        <CommunityMatchStep
          locality={state.locality}
          onSelectOption={(communityChoice) => updateState({ communityChoice })}
        />
      )}

      {state.step === 5 && (
        <HumanApprovalStep
          issueType={state.issueType}
          locality={state.locality}
          userNote={state.userNote}
          onConsentChange={(consented) => updateState({ consented })}
        />
      )}

      {state.step === 6 && (
        <SubmissionSuccessStep
          caseId={state.createdIssueId}
          mode={state.createdIssueId ? 'dispatched' : 'queued'}
          onTrackCase={() => state.createdIssueId ? navigate(`/issue/${state.createdIssueId}`) : navigate('/my-reports')}
        />
      )}
    </ReportFlowLayout>
  );
};

export default IntakePage;

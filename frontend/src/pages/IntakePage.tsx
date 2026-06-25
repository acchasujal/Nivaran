import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { PhotoUploader } from '@/components/issue/PhotoUploader';
import { PhotoPreview } from '@/components/issue/PhotoPreview';
import { LocationPicker } from '@/components/issue/LocationPicker';
import { AgentTimeline } from '@/components/timeline/AgentTimeline';
import type { TimelineStepData } from '@/components/timeline/AgentTimeline';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useCreateIssue } from '@/api/queries';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export const IntakePage: React.FC = () => {
  const navigate = useNavigate();
  const createIssueMutation = useCreateIssue();

  // Form states
  const [photo, setPhoto] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  
  // Submission & Progress states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start progress timer when submission begins
  useEffect(() => {
    if (isSubmitting && !submitError) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSubmitting, submitError]);

  const handlePhotoCapture = (file: File) => {
    setPhoto(file);
    setFieldErrors((prev) => ({ ...prev, photo: '' }));
  };

  const handleLocationLocate = (coords: { lat: number; lng: number } | null) => {
    setCoordinates(coords);
    if (coords) {
      setFieldErrors((prev) => ({ ...prev, coordinates: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!photo) {
      errors.photo = 'Photo evidence is required to submit a report.';
    }
    if (!coordinates) {
      errors.coordinates = 'Coordinates are required. Please allow GPS or enter manually.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setElapsedSeconds(0);

    try {
      const response = await createIssueMutation.mutateAsync({
        photo: photo!,
        latitude: coordinates!.lat,
        longitude: coordinates!.lng,
        user_note: userNote.trim() || undefined,
      });

      // Navigate to details page on successful creation
      // Add a slight delay so the user sees the completed states
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(`/issue/${response.id}`);
      }, 1000);

    } catch (err) {
      setIsSubmitting(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        if (err.response.status === 422 && data.error === 'validation_error') {
          // Surfaced validation fields
          setFieldErrors(data.fields || { general: 'Failed to validate report fields.' });
          setSubmitError('Validation failed. Please check the coordinates and image criteria.');
        } else if (err.response.status === 502 && data.error === 'ai_unavailable') {
          setSubmitError('Gemini is currently unavailable. We could not analyze the photo. Please try again.');
        } else {
          setSubmitError(data.detail || 'An unexpected error occurred. Please try again.');
        }
      } else {
        setSubmitError('Network error. Please check your connection and try again.');
      }
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setUserNote('');
    setIsSubmitting(false);
    setSubmitError(null);
    setElapsedSeconds(0);
    setFieldErrors({});
  };

  // Generate timeline steps dynamically during submission state
  const getSubmittingTimelineSteps = (): TimelineStepData[] => {
    // Estimate: Agent 1 runs for ~7 seconds, then Agent 2 runs
    const isAgent1Done = elapsedSeconds >= 7 || createIssueMutation.isSuccess;
    
    return [
      {
        number: 1,
        name: 'Agent 1: Issue Understanding',
        agentLabel: 'Gemini Vision Intake',
        description: 'Analyzing photo clarity, classifying civic issue category, and assessing severity level...',
        status: createIssueMutation.isSuccess 
          ? 'completed'
          : submitError && elapsedSeconds < 7
          ? 'failed'
          : isAgent1Done
          ? 'completed'
          : 'running',
      },
      {
        number: 2,
        name: 'Agent 2: Proximity Verification',
        agentLabel: 'Deduplication & Clustering',
        description: 'Cross-referencing report location with existing clusters and checking duplicate entries...',
        status: createIssueMutation.isSuccess
          ? 'completed'
          : submitError && elapsedSeconds >= 7
          ? 'failed'
          : isAgent1Done
          ? 'running'
          : 'pending',
      },
      {
        number: 3,
        name: 'Agent 3: Impact Intelligence',
        agentLabel: 'Aggregated Impact Analysis',
        description: 'Evaluating collective risks and consequences (triggers when report threshold is reached).',
        status: 'pending',
      },
      {
        number: 4,
        name: 'Agent 4: Action Draft Generator',
        agentLabel: 'Complaint, RTI & Summary Builder',
        description: 'Generating drafts for complaint escalation and RTI letters.',
        status: 'pending',
      },
      {
        number: 5,
        name: 'Agent 5: Accountability Escalator',
        agentLabel: 'SendGrid Email & PDF Export',
        description: 'Dispatches finalized escalation requests to relevant municipal offices.',
        status: 'pending',
      },
    ];
  };

  return (
    <div className="flex-1 flex flex-col pb-10">
      <PageHeader
        title="Report Civic Issue"
        subtitle="Observe → Understand → Act. Submit verified photographic evidence of infrastructure issues."
      />

      {isSubmitting ? (
        /* Progress timeline view when uploading/submitting */
        <div className="max-w-2xl mx-auto w-full py-12 space-y-8 animate-fade">
          <div className="text-center space-y-2">
            {createIssueMutation.isSuccess ? (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-2 shrink-0">
                <CheckCircle2 size={28} className="stroke-[1.5] animate-pulse" />
              </div>
            ) : (
              <span className="inline-block w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-2" />
            )}
            <h2 className="text-lg font-semibold text-secondary-foreground">
              {createIssueMutation.isSuccess ? 'Issue Verified successfully!' : 'Analyzing Report...'}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {createIssueMutation.isSuccess 
                ? 'Redirecting to issue dashboard detail...' 
                : `Please wait. Handing off to Agent 1 and Agent 2. Elapsed: ${elapsedSeconds}s (takes ~6-15 seconds).`
              }
            </p>
          </div>

          <div className="border border-secondary-border bg-white rounded-large p-6 md:p-8 shadow-subtle">
            <AgentTimeline steps={getSubmittingTimelineSteps()} />
          </div>
        </div>
      ) : submitError ? (
        /* Error view when submission fails */
        <div className="max-w-2xl mx-auto w-full py-12 animate-fade">
          <ErrorState
            title="Analysis Failure"
            explanation={submitError}
            onRetry={handleReset}
            retryText="Reset & Try Again"
          />
        </div>
      ) : (
        /* Form intake flow view */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-start animate-fade">
          <div className="lg:col-span-7 space-y-6">
            {/* Photo Upload Container */}
            <div className="border border-secondary-border bg-white rounded-large p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-700 border-b border-secondary-border pb-3">
                <FileText size={18} className="text-primary shrink-0" />
                <span className="text-sm font-semibold font-sans">Evidence Media</span>
              </div>

              {photo ? (
                <PhotoPreview
                  file={photo}
                  onRemove={() => setPhoto(null)}
                  onReplace={() => setPhoto(null)}
                />
              ) : (
                <PhotoUploader onCapture={handlePhotoCapture} />
              )}

              {fieldErrors.photo && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold select-none animate-fade">
                  <AlertCircle size={14} />
                  <span>{fieldErrors.photo}</span>
                </div>
              )}
            </div>

            {/* Location Picker Container */}
            <div className="space-y-2">
              <LocationPicker onLocate={handleLocationLocate} />
              {fieldErrors.coordinates && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold px-2 select-none animate-fade">
                  <AlertCircle size={14} />
                  <span>{fieldErrors.coordinates}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right hand details form column */}
          <div className="lg:col-span-5 border border-secondary-border bg-white rounded-large p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-secondary-foreground border-b border-secondary-border pb-3">
                Report Description
              </h3>
              <p className="text-xs text-slate-400 font-normal leading-normal">
                Add optional details about the context (e.g. nearest cross street, duration of the issue, severity context).
              </p>
              <textarea
                rows={4}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Describe the issue context..."
                className="w-full text-sm border border-secondary-border rounded-small px-3 py-2 bg-slate-50 focus:bg-white transition-colors resize-none mt-2"
                maxLength={500}
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-small shadow transition-all active:scale-[0.99] cursor-pointer"
            >
              Submit Report
            </button>
            
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Submitting a report runs Agent 1 (Gemini Vision classification) and Agent 2 (location-based clustering) in real-time.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
export default IntakePage;

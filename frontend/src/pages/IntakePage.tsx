import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { PhotoUploader } from '@/components/issue/PhotoUploader';
import { PhotoPreview } from '@/components/issue/PhotoPreview';
import { LocationPicker } from '@/components/issue/LocationPicker';
import { AgentTimeline } from '@/components/timeline/AgentTimeline';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useCreateIssue } from '@/api/queries';
import { AlertCircle, FileText, CheckCircle2, ArrowRight, ArrowLeft, Send, Sparkles, MapPin, Landmark } from 'lucide-react';
import axios from 'axios';
import { demoScenarios } from '@/data/demoScenarios';
import type { DemoScenario } from '@/data/demoScenarios';
import { getLocalityName } from '@/utils/getLocalityName';
import { cn } from '@/lib/utils';
import { useTour } from '@/context/TourContext';

export const IntakePage: React.FC = () => {
  const navigate = useNavigate();
  const createIssueMutation = useCreateIssue();
  const { registerTourTarget } = useTour();

  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [photo, setPhoto] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  const [validationGateError, setValidationGateError] = useState<any>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSelectDemoScenario = async (scenarioId: string) => {
    if (!scenarioId) return;
    setIsDemoLoading(true);
    try {
      let scenario: DemoScenario;
      if (scenarioId === 'random') {
        const randomIndex = Math.floor(Math.random() * demoScenarios.length);
        scenario = demoScenarios[randomIndex];
      } else {
        const found = demoScenarios.find(s => s.id === scenarioId);
        if (!found) return;
        scenario = found;
      }
      
      const response = await fetch(`/${scenario.imagePath}`);
      const blob = await response.blob();
      const file = new File([blob], scenario.imagePath, { type: 'image/jpeg' });
      setPhoto(file);
      setCoordinates({ lat: scenario.latitude, lng: scenario.longitude });
      setUserNote(scenario.description);
      setFieldErrors({});
      // Auto-advance to step 3 so the judge sees the compiled case and can submit immediately
      setCurrentStep(3);
    } catch (err) {
      console.error('Failed to load demo scenario', err);
    } finally {
      setIsDemoLoading(false);
    }
  };
  
  // Submission & Progress states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
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



  // NOTE: No tour event listener here. The guide never auto-selects scenarios.

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

  // Step controls
  const handleNextStep = () => {
    setFieldErrors({});
    if (currentStep === 1) {
      if (!photo) {
        setFieldErrors({ photo: 'Photo evidence is required to proceed.' });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!coordinates) {
        setFieldErrors({ coordinates: 'Geographic location is required to proceed.' });
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
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
      // Fallback steps
      if (!photo) setCurrentStep(1);
      else if (!coordinates) setCurrentStep(2);
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

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsSubmitting(false);
      setSubmittedIssueId(response.id);
      // Tour reads issue ID passively from the URL — no explicit call needed.

    } catch (err) {
      setIsSubmitting(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        if (err.response.status === 400 && data.detail && data.detail.error === 'validation_gate_failed') {
          setValidationGateError(data.detail);
        } else if (err.response.status === 422 && data.error === 'validation_error') {
          setFieldErrors(data.fields || { general: 'Failed to validate report fields.' });
          setSubmitError('Validation failed. Please check the coordinates and image criteria.');
        } else if (err.response.status === 502 && data.error === 'ai_unavailable') {
          setSubmitError('Gemini is currently unavailable. We could not analyze the photo. Please try again.');
        } else {
          setSubmitError(data.detail?.message || data.detail || 'An unexpected error occurred. Please try again.');
        }
      } else {
        setSubmitError('Network error. Please check your connection and try again.');
      }
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setCoordinates(null);
    setUserNote('');
    setIsSubmitting(false);
    setSubmitError(null);
    setElapsedSeconds(0);
    setFieldErrors({});
    setCurrentStep(1);
  };

  // Compute live local preview parameters
  const localityName = useMemo(() => {
    if (!coordinates) return '';
    return getLocalityName(coordinates.lat, coordinates.lng);
  }, [coordinates]);

  // Stepper Header tabs helper
  const stepsConfig = [
    { number: 1, label: 'Evidence Media' },
    { number: 2, label: 'Location Lock' },
    { number: 3, label: 'Case Context' },
  ];

  if (validationGateError) {
    return (
      <div className="max-w-2xl mx-auto w-full py-12 px-4 flex flex-col items-center justify-center font-sans select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full border border-slate-200 bg-white rounded-medium p-8 shadow-subtle flex flex-col items-center space-y-6"
        >
          {/* Rejection Alert/Warning icon */}
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-250 mb-2 shadow-sm animate-fade">
            <AlertCircle size={36} className="stroke-[1.5]" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
              Submission couldn't be verified
            </h2>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Detected: <span className="text-rose-600 font-extrabold">{validationGateError.detected_object || 'Unknown'}</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {validationGateError.message || "This image does not appear to show a civic infrastructure issue."}
            </p>
            {validationGateError.suggestion && (
              <p className="text-[11px] text-teal-700 font-bold bg-teal-50 border border-teal-100 rounded-small p-2.5 mt-2 leading-relaxed">
                💡 Suggestion: {validationGateError.suggestion}
              </p>
            )}
          </div>

          {/* Validation Checklist Indicators */}
          {validationGateError.checks && (
            <div className="w-full bg-slate-50 rounded-medium border border-slate-250/60 p-4.5 space-y-3 text-[11px] text-slate-700">
              <h3 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5 select-none">
                Validation Checklist
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  {validationGateError.checks.file ? (
                    <span className="text-emerald-600 font-extrabold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-extrabold">✕</span>
                  )}
                  <span className="text-slate-500">File Validation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {validationGateError.checks.quality ? (
                    <span className="text-emerald-600 font-extrabold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-extrabold">✕</span>
                  )}
                  <span className="text-slate-500">Image Quality</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {validationGateError.checks.scene ? (
                    <span className="text-emerald-600 font-extrabold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-extrabold">✕</span>
                  )}
                  <span className="text-slate-500">Scene Classification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {validationGateError.checks.infrastructure ? (
                    <span className="text-emerald-600 font-extrabold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-extrabold">✕</span>
                  )}
                  <span className="text-slate-500">Civic Infrastructure</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  {validationGateError.checks.issue ? (
                    <span className="text-emerald-600 font-extrabold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-extrabold">✕</span>
                  )}
                  <span className="text-slate-500">Visible Civic Issue</span>
                </div>
              </div>
            </div>
          )}

          {/* Accepted items checklist */}
          <div className="w-full bg-slate-50 rounded-medium border border-slate-200/60 p-5 space-y-3.5 text-xs text-slate-700">
            <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-450 border-b border-slate-200 pb-2 select-none">
              Accepted Examples
            </h3>
            <ul className="space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                Potholes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                Garbage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                Water Leaks
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                Streetlights
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                Footpaths
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                Construction Debris
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              setValidationGateError(null);
              handleReset();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow transition-all cursor-pointer text-center"
          >
            Upload Another Image
          </button>
        </motion.div>
      </div>
    );
  }

  if (submittedIssueId) {
    return (
      <div className="max-w-2xl mx-auto w-full py-12 px-4 flex flex-col items-center justify-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full border border-slate-200 bg-white rounded-medium p-8 shadow-subtle flex flex-col items-center space-y-6"
        >
          {/* Header check icon */}
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250 mb-2 shadow-sm animate-fade">
            <CheckCircle2 size={36} className="stroke-[1.5]" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-sans">
              Your Report Mattered!
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              CivicPulse has verified your evidence and initiated the automated community resolution workflow.
            </p>
          </div>

          {/* AI Workflow Milestones Checklist */}
          <div className="w-full bg-slate-50 rounded-small border border-slate-200/60 p-5 space-y-4 text-xs text-slate-700">
            <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2 select-none">
              AI Pipeline Progress Check
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block leading-tight">Original Evidence Secured</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Photo and metadata logged onto the secure ledger.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block leading-tight">AI Analysis Completed</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Gemini Vision validated categorisation and credibility score.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block leading-tight">Spatial Deduplication Check</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Agent 2 cross-referenced location with nearby incident clusters.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block leading-tight">Escalation Briefs Generated</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Action Generator compiled formal RTI and municipal complaints.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
            <button
              onClick={() => navigate(`/issue/${submittedIssueId}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Track Report</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => navigate('/tracker')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-small shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>View Public Tracker</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-10 font-sans">
      <PageHeader
        title="Incident Report Intake"
        subtitle="AI Civic Operations Center: Transform raw photographic evidence of infrastructure failures into verified, sendable legal complaints and RTI briefs."
        action={
          <div className="relative inline-block text-left">
            <select
              id="demo-scenario-select"
              ref={(el) => registerTourTarget('demo-scenario', el)}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleSelectDemoScenario(e.target.value);
                }
              }}
              disabled={isDemoLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-255 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-small shadow-sm transition-all cursor-pointer disabled:opacity-50 select-none appearance-none pr-8 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '14px',
              }}
            >
              <option value="" disabled className="text-slate-800 bg-white">
                {isDemoLoading ? 'Loading Scenario...' : 'Select Case Demo'}
              </option>
              <option value="random" className="text-slate-800 bg-white">Random Case Scenario</option>
              {demoScenarios.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-800 bg-white">
                  {s.title}
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[9px] text-slate-450 leading-tight max-w-[200px] text-right ml-auto select-none">
              New here? Choose any demo scenario for a complete guided experience, or upload your own image to analyze a real civic issue.
            </div>
          </div>
        }
      />

      {isSubmitting ? (
        /* Progress timeline view when uploading/submitting */
        <div id="intake-pipeline-container" ref={(el) => registerTourTarget('ai-pipeline', el)} className="max-w-2xl mx-auto w-full py-12 space-y-8 animate-fade select-none">
          <div className="text-center space-y-3">
            {createIssueMutation.isSuccess ? (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2 shrink-0">
                <CheckCircle2 size={28} className="stroke-[1.5]" />
              </div>
            ) : (
              <span className="inline-block w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-2" />
            )}
            <h2 className="text-lg font-bold text-secondary-foreground font-sans tracking-tight">
              {createIssueMutation.isSuccess ? 'Evidence Verified & Processed!' : 'Processing Case Evidence...'}
            </h2>
            <div className="flex justify-center items-center gap-4 text-xs font-semibold text-slate-500 max-w-md mx-auto py-2 bg-slate-50 border border-slate-200/60 rounded-medium shadow-sm">
              <div className="px-3 border-r border-slate-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-450 block">Elapsed Time</span>
                <span className="text-sm font-bold text-slate-750">{elapsedSeconds}s</span>
              </div>
              <div className="px-3">
                <span className="text-[9px] uppercase tracking-wider text-slate-450 block">Status</span>
                <span className="text-sm font-bold text-primary">
                  {createIssueMutation.isSuccess ? 'Completed' : 'Processing...'}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white rounded-medium p-6 md:p-8 shadow-subtle space-y-6">
            <AgentTimeline
              isSubmitting={isSubmitting}
              elapsedSeconds={elapsedSeconds}
              submitError={submitError}
            />
          </div>
        </div>
      ) : submitError ? (
        /* Error view when submission fails */
        <div className="max-w-2xl mx-auto w-full py-12 animate-fade">
          <ErrorState
            title="Evidence Processing Failure"
            explanation={submitError}
            onRetry={handleReset}
            retryText="Reset & Try Again"
          />
        </div>
      ) : (
        /* Form stepper intake flow view */
        <div id="intake-form-container" className="max-w-3xl mx-auto w-full py-6 space-y-8">
          {/* Quick value proposition (First 30 seconds check) */}
          <div className="border border-slate-200 bg-white rounded-medium p-5 shadow-subtle flex items-start gap-4 select-none">
            <span className="p-2.5 rounded bg-teal-50 text-primary border border-teal-200 shrink-0">
              <Landmark size={20} />
            </span>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                AI Civic Operations Intake Portal
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide verifiable visual evidence of municipal infrastructure problems. CivicPulse translates citizen reports into compiled audit trails and sendable legal briefs, bypassing administrative delays.
              </p>
            </div>
          </div>
          {/* Stepper Header Navigation Indicators */}
          <div className="flex items-center justify-between border border-slate-200 bg-slate-50/50 p-4 rounded-medium select-none" role="navigation" aria-label="Wizard Steps">
            {stepsConfig.map((step, idx) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <React.Fragment key={step.number}>
                  <div 
                    className="flex items-center gap-2"
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${step.number}: ${step.label}${isCompleted ? ', Completed' : ''}${isActive ? ', Active' : ''}`}
                  >
                    <span className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border transition-colors shrink-0",
                      isActive && "bg-primary border-primary text-white shadow-sm",
                      isCompleted && "bg-emerald-50 border-emerald-250 text-emerald-700",
                      !isActive && !isCompleted && "bg-white border-slate-200 text-slate-400"
                    )}>
                      {isCompleted ? <CheckCircle2 size={15} aria-label="Completed" /> : step.number}
                    </span>
                    <span className={cn(
                      "text-xs font-bold font-sans tracking-tight hidden sm:inline",
                      isActive ? "text-slate-800" : "text-slate-400"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {idx < stepsConfig.length - 1 && (
                    <div className="flex-1 h-[1px] bg-slate-200 mx-4 hidden sm:block" aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Stepper Content Window */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade">
                <div className="border border-slate-200 bg-white rounded-medium p-6 space-y-4 shadow-subtle">
                  <div className="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3">
                    <FileText size={18} className="text-primary shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Step 1: Evidence Capture</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Upload a clear, unaltered photograph of the infrastructure or municipal failure. The AI pipeline evaluates visual context, detects dupes, and determines incident parameters.
                  </p>

                  <div id="photo-uploader-container" ref={(el) => registerTourTarget('photo-uploader', el)}>
                    {photo ? (
                      <PhotoPreview
                        file={photo}
                        onRemove={() => setPhoto(null)}
                        onReplace={() => setPhoto(null)}
                      />
                    ) : (
                      <PhotoUploader onCapture={handlePhotoCapture} />
                    )}
                  </div>

                  {fieldErrors.photo && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold select-none mt-2">
                      <AlertCircle size={14} />
                      <span>{fieldErrors.photo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fade">
                <LocationPicker value={coordinates} onLocate={handleLocationLocate} />
                {fieldErrors.coordinates && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold px-2 select-none">
                    <AlertCircle size={14} />
                    <span>{fieldErrors.coordinates}</span>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade">
                {/* Notes Input Area */}
                <div className="lg:col-span-7 border border-slate-200 bg-white rounded-medium p-6 space-y-4 shadow-subtle">
                  <div className="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3">
                    <FileText size={18} className="text-primary shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Step 3: Brief Context</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Provide optional details about the context (e.g. duration of outage, specific location landmarks, hazardous risks) to ground the drafted complaint briefs.
                  </p>
                  
                  <textarea
                    rows={4}
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Describe specific context for official briefs..."
                    className="w-full text-sm border border-slate-250 rounded-small px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none mt-2"
                    maxLength={500}
                  />
                </div>

                {/* Final Case Review Summary */}
                <div className="lg:col-span-5 border border-slate-200 bg-white rounded-medium p-6 space-y-6 shadow-subtle">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Review Case File
                  </h3>
                  
                  <div className="space-y-4 text-xs">
                    {/* Media Thumbnail */}
                    {photo && (
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          <img src={URL.createObjectURL(photo)} alt="Evidence preview" className="h-full w-full object-cover" />
                        </div>
                        <div className="leading-tight">
                          <span className="font-bold text-slate-700 block">Evidence File Loaded</span>
                          <span className="text-[10px] text-slate-450 mt-0.5 block font-mono">{(photo.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                    )}

                    {/* Location Summary */}
                    <div className="flex items-start gap-2.5 pt-3 border-t border-slate-100 text-slate-650">
                      <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-bold text-slate-700 block">{localityName || 'Coordinates Loaded'}</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          GPS: {coordinates?.lat.toFixed(6)}, {coordinates?.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>

                    {/* Explanatory AI warning */}
                    <div className="flex gap-2 p-3 bg-teal-50/50 border border-teal-200 rounded-small text-teal-800 leading-tight">
                      <Sparkles size={14} className="shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium font-sans">
                        Submission triggers Agent 1 (understanding) and Agent 2 (clustering checks) synchronously. Case file details will update instantly.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Submit to Operations Center</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 select-none">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-250 bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={13} />
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakePage;

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  FileUp,
  ShieldCheck,
  BrainCircuit,
  CircleCheckBig,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/context/UploadContext";
import { useAuth } from "@/context/AuthContext";
import { useHealthData } from "@/context/HealthDataContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDocumentUploadRealtime } from "@/hooks/useDocumentUploadRealtime";
import { toast } from "sonner";

const PROGRESS_STEPS = [
  {
    label: "Uploading your records",
    description: "Securely transmitting your medical records...",
    icon: FileUp,
  },
  {
    label: "Protecting your data",
    description: "Encrypting and stripping personal identifiers...",
    icon: ShieldCheck,
  },
  {
    label: "Reading your records",
    description: "Extracting health data so it's yours to explore...",
    icon: BrainCircuit,
  },
  {
    label: "Your records are yours",
    description: "Your health data is organized and ready.",
    icon: CircleCheckBig,
  },
] as const;

function percentToStep(percent: number | undefined, isComplete: boolean): number {
  if (isComplete) return 3;
  if (!percent) return 0;
  if (percent < 10) return 0;
  if (percent < 20) return 1;
  return 2;
}

export function UploadProgressPage() {
  const {
    state, progress, error, uploadId, resume, reset,
    chunksCompleted, totalChunks, resourceCounts, totalExtracted,
  } = useUpload();
  const { refreshUserState } = useAuth();
  const { refreshDashboard } = useHealthData();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const isComplete = state === "complete";
  const isFailed = state === "error";
  const currentStep = percentToStep(progress?.percent, isComplete);

  // Persist uploadId so dashboard can subscribe to post-processing status
  useEffect(() => {
    if (isComplete && uploadId) {
      localStorage.setItem("phri_pending_upload_id", uploadId);
    }
  }, [isComplete, uploadId]);

  // Phase B: transition to dashboard view after first chunk_complete
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (chunksCompleted > 0 && !showDashboard) {
      setShowDashboard(true);
      refreshDashboard();
    }
  }, [chunksCompleted, showDashboard, refreshDashboard]);

  // Refresh dashboard on each chunk_complete
  useEffect(() => {
    if (chunksCompleted > 0) {
      refreshDashboard();
    }
  }, [chunksCompleted, refreshDashboard]);

  // Phase C: post-processing realtime subscription
  const realtimeStatus = useDocumentUploadRealtime(
    isComplete ? uploadId : null,
  );

  // Toast when enrichment/embedding complete
  useEffect(() => {
    if (realtimeStatus?.enrichmentStatus === "completed") {
      toast.success("Your health insights are ready");
      refreshDashboard();
    }
  }, [realtimeStatus?.enrichmentStatus, refreshDashboard]);

  useEffect(() => {
    if (realtimeStatus?.embeddingStatus === "completed") {
      toast.success("Your health assistant is ready");
    }
  }, [realtimeStatus?.embeddingStatus]);

  // Navigate to dashboard after completion
  const handleContinue = useCallback(async () => {
    await refreshUserState();
    navigate("/home");
  }, [refreshUserState, navigate]);

  // Determine if post-processing is fully done
  const postProcessingDone =
    realtimeStatus?.enrichmentStatus === "completed" &&
    realtimeStatus?.embeddingStatus === "completed";

  // Auto-navigate only after extraction AND post-processing are both done
  useEffect(() => {
    if (!isComplete || !postProcessingDone) return;
    const timeout = setTimeout(() => {
      handleContinue();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [isComplete, postProcessingDone, handleContinue]);

  const handleRetry = useCallback(async () => {
    if (uploadId) {
      await resume(uploadId);
    } else {
      reset();
      navigate("/upload");
    }
  }, [uploadId, resume, reset, navigate]);

  // If user navigates here with no active upload, redirect
  useEffect(() => {
    if (state === "idle") {
      navigate("/upload", { replace: true });
    }
  }, [state, navigate]);

  const postProcessingActive =
    isComplete &&
    realtimeStatus &&
    (realtimeStatus.enrichmentStatus !== "completed" ||
      realtimeStatus.embeddingStatus !== "completed");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">
          <span className="text-primary">P</span>HRI
        </h1>
        <p className="text-sm text-muted-foreground">
          {isComplete
            ? "Now you own your health records"
            : "Taking ownership of your health records"}
        </p>
      </div>

      {/* Resource counts banner */}
      {totalExtracted > 0 && !isComplete && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border bg-card p-4 text-center"
        >
          <p className="text-sm font-medium">
            {chunksCompleted}/{totalChunks} sections processed
          </p>
          <p className="text-2xl font-bold text-primary">{totalExtracted}</p>
          <p className="text-xs text-muted-foreground">health records found so far</p>
          {resourceCounts && Object.keys(resourceCounts).length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {Object.entries(resourceCounts).map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Step indicators */}
      <div className="w-full max-w-sm" role="list" aria-label="Upload progress">
        {PROGRESS_STEPS.map((step, i) => {
          const isCompleted = !isFailed && currentStep > i;
          const isActive = isFailed ? false : currentStep === i;
          const isFailedStep = isFailed && i === currentStep;
          const isUpcoming = !isCompleted && !isActive && !isFailedStep;
          const StepIcon = step.icon;

          return (
            <div key={i} role="listitem" aria-current={isActive ? "step" : undefined}>
              {i > 0 && (
                <div className="ml-5 h-8 flex items-stretch">
                  <div
                    className={`w-0.5 transition-colors duration-500 ${
                      isCompleted || isActive || isFailedStep
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  {isActive && !prefersReduced && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ animation: "step-pulse 1.5s ease-out infinite" }}
                    />
                  )}

                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary bg-background text-primary"
                          : isFailedStep
                            ? "border-destructive bg-background text-destructive"
                            : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={prefersReduced ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Check className="h-5 w-5" />
                      </motion.div>
                    ) : isFailedStep ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                </div>

                <div className="pt-2 min-w-0">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      isUpcoming && !isFailedStep ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {isFailedStep ? "Processing failed" : step.label}
                  </p>

                  <AnimatePresence>
                    {(isActive || isFailedStep) && (
                      <motion.p
                        initial={prefersReduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-1 text-xs text-muted-foreground overflow-hidden"
                      >
                        {isFailedStep
                          ? error || "An error occurred during processing."
                          : progress?.description || step.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post-processing banner */}
      {postProcessingActive && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 w-full max-w-sm space-y-2"
        >
          {realtimeStatus.enrichmentStatus !== "completed" && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">Building your health insights...</span>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {realtimeStatus.embeddingStatus !== "completed" && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">Preparing your health assistant...</span>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="mt-8">
        {isComplete && (
          <div className="flex flex-col items-center gap-2">
            <Button onClick={handleContinue}>
              {postProcessingDone
                ? "View your dashboard"
                : "Continue to dashboard"}
            </Button>
            {!postProcessingDone && (
              <p className="text-xs text-muted-foreground">
                Insights are still loading — they'll be ready when you arrive
              </p>
            )}
          </div>
        )}

        {isFailed && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              {error || "Processing failed. Please try again."}
            </p>
            <Button onClick={handleRetry}>Try Again</Button>
          </div>
        )}
      </div>
    </div>
  );
}

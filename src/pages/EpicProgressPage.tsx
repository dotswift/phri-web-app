import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Download,
  BrainCircuit,
  CircleCheckBig,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEpicStatus } from "@/hooks/useEpicStatus";
import { useAuth } from "@/context/AuthContext";
import { useHealthData } from "@/context/HealthDataContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const STEPS = [
  {
    label: "Connected to Epic MyChart",
    description: "Successfully authenticated with your healthcare provider.",
    icon: ShieldCheck,
  },
  {
    label: "Downloading your health records",
    description: "Fetching conditions, medications, labs, and more\u2026",
    icon: Download,
  },
  {
    label: "Processing & generating insights",
    description: "Analyzing and organizing your medical data\u2026",
    icon: BrainCircuit,
  },
  {
    label: "Your records are ready",
    description: "Everything is set \u2014 taking you to your dashboard.",
    icon: CircleCheckBig,
  },
] as const;

const MIN_STEP_MS = 2000;
const READY_HOLD_MS = 1500;

function epicToStep(epicStatus: ReturnType<typeof useEpicStatus>): number {
  if (!epicStatus) return 0;
  if (epicStatus.syncing && epicStatus.syncProgress) {
    return epicStatus.syncProgress.completed > 0 ? 1 : 0;
  }
  if (!epicStatus.syncing && epicStatus.connected) {
    return 3; // Sync done
  }
  return 0;
}

export function EpicProgressPage() {
  const [searchParams] = useSearchParams();
  const callbackStatus = searchParams.get("status");
  const errorMessage = searchParams.get("message");
  const navigate = useNavigate();
  const { refreshUserState } = useAuth();
  const { refresh: refreshHealthData } = useHealthData();
  const prefersReduced = useReducedMotion();

  const isError = callbackStatus === "error";
  const epicStatus = useEpicStatus(isError ? 0 : 3000);

  const backendStep = isError ? 0 : epicToStep(epicStatus);
  const [displayStep, setDisplayStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refreshedRef = useRef(false);

  // Refresh auth state on successful callback so router sees the new Patient
  useEffect(() => {
    if (callbackStatus === "success" && !refreshedRef.current) {
      refreshedRef.current = true;
      refreshUserState();
    }
  }, [callbackStatus, refreshUserState]);

  // Walk display step forward at minimum pace
  useEffect(() => {
    if (isError) return;
    if (backendStep <= displayStep) return;

    timerRef.current = setTimeout(() => {
      setDisplayStep((prev) => prev + 1);
    }, MIN_STEP_MS);

    return () => clearTimeout(timerRef.current);
  }, [backendStep, displayStep, isError]);

  // When sync finishes (step 2 displayed), briefly show "processing" then jump to ready
  useEffect(() => {
    if (displayStep === 2 && backendStep >= 3) {
      const t = setTimeout(() => setDisplayStep(3), MIN_STEP_MS);
      return () => clearTimeout(t);
    }
  }, [displayStep, backendStep]);

  // Navigate after ready step
  useEffect(() => {
    if (displayStep < 3) return;

    const timeout = setTimeout(async () => {
      await refreshUserState();
      refreshHealthData();
      navigate("/home");
    }, READY_HOLD_MS);

    return () => clearTimeout(timeout);
  }, [displayStep, navigate, refreshUserState, refreshHealthData]);

  const handleRetry = useCallback(() => {
    navigate("/records-choice");
  }, [navigate]);

  // Build sub-label for downloading step
  const subLabel =
    epicStatus?.syncing && epicStatus.syncProgress
      ? `${epicStatus.syncProgress.completed} of ${epicStatus.syncProgress.total} categories`
      : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">PHRI</h1>
        <p className="text-sm text-muted-foreground">
          Personal Health Record &amp; Insights
        </p>
      </div>

      <div className="w-full max-w-sm" role="list" aria-label="Epic sync progress">
        {STEPS.map((step, i) => {
          const isCompleted = !isError && displayStep > i;
          const isActive = isError ? false : displayStep === i;
          const isErrorStep = isError && i === 0;
          const isUpcoming = !isCompleted && !isActive && !isErrorStep;
          const StepIcon = step.icon;

          return (
            <div key={i} role="listitem" aria-current={isActive ? "step" : undefined}>
              {i > 0 && (
                <div className="ml-5 h-8 flex items-stretch">
                  <div
                    className={`w-0.5 transition-colors duration-500 ${
                      isCompleted || isActive || isErrorStep
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
                          : isErrorStep
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
                    ) : isErrorStep ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                </div>

                <div className="pt-2 min-w-0">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      isUpcoming && !isErrorStep ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {isErrorStep ? "Connection failed" : step.label}
                  </p>

                  {/* Sub-label for download progress */}
                  {isActive && i === 1 && subLabel && (
                    <p className="mt-0.5 text-xs text-primary font-medium">{subLabel}</p>
                  )}

                  <AnimatePresence>
                    {(isActive || isErrorStep) && (
                      <motion.p
                        initial={prefersReduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-1 text-xs text-muted-foreground overflow-hidden"
                      >
                        {isErrorStep
                          ? errorMessage || "Something went wrong connecting to Epic."
                          : step.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error actions */}
      {isError && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="max-w-xs text-sm text-muted-foreground">
            {errorMessage || "Failed to connect to Epic MyChart."}
          </p>
          <Button onClick={handleRetry}>Try Again</Button>
        </div>
      )}

      {/* Sync errors (partial failures) */}
      {!isError &&
        epicStatus &&
        !epicStatus.syncing &&
        epicStatus.syncProgress?.errors &&
        epicStatus.syncProgress.errors.length > 0 &&
        displayStep >= 3 && (
          <p className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
            Some categories were unavailable:{" "}
            {epicStatus.syncProgress.errors.join(", ")}
          </p>
        )}
    </div>
  );
}

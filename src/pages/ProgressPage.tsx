import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ShieldCheck,
  BrainCircuit,
  CircleCheckBig,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientStatus } from "@/hooks/usePatientStatus";
import { useAuth } from "@/context/AuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { PatientStatus } from "@/types/api";

const STEPS = [
  {
    label: "Accessing medical records",
    description: "Securely connecting to health information exchanges\u2026",
    icon: Search,
  },
  {
    label: "Securely storing your information",
    description: "Downloading and encrypting your health documents\u2026",
    icon: ShieldCheck,
  },
  {
    label: "Preparing your health insights",
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

function statusToStep(status: PatientStatus["status"] | null): number {
  switch (status) {
    case "downloading":
      return 1;
    case "processing":
      return 2;
    case "ready":
    case "partial":
      return 3;
    default:
      return 0;
  }
}

export function ProgressPage() {
  const status = usePatientStatus();
  const navigate = useNavigate();
  const { refreshUserState } = useAuth();
  const prefersReduced = useReducedMotion();

  const isFailed = status === "failed";
  const backendStep = isFailed ? 0 : statusToStep(status);

  const [displayStep, setDisplayStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Walk display step forward at minimum pace
  useEffect(() => {
    if (isFailed) return;
    if (backendStep <= displayStep) return;

    timerRef.current = setTimeout(() => {
      setDisplayStep((prev) => prev + 1);
    }, MIN_STEP_MS);

    return () => clearTimeout(timerRef.current);
  }, [backendStep, displayStep, isFailed]);

  // Navigate after ready step is displayed
  useEffect(() => {
    if (displayStep < 3) return;
    if (status !== "ready" && status !== "partial") return;

    const timeout = setTimeout(async () => {
      if (status === "ready") {
        await refreshUserState();
        navigate("/home");
      }
      // partial: don't auto-navigate — show button
    }, READY_HOLD_MS);

    return () => clearTimeout(timeout);
  }, [displayStep, status, navigate, refreshUserState]);

  const handleContinue = useCallback(async () => {
    await refreshUserState();
    navigate("/home");
  }, [refreshUserState, navigate]);

  const handleDisconnect = useCallback(async () => {
    try {
      await api.post("/api/settings/disconnect");
      await refreshUserState();
      navigate("/connect");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect",
      );
    }
  }, [refreshUserState, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">PHRI</h1>
        <p className="text-sm text-muted-foreground">
          Personal Health Record &amp; Insights
        </p>
      </div>

      <div className="w-full max-w-sm" role="list" aria-label="Progress steps">
        {STEPS.map((step, i) => {
          const isCompleted = !isFailed && displayStep > i;
          const isActive = isFailed ? false : displayStep === i;
          const isFailedStep = isFailed && i === 0;
          const isUpcoming = !isCompleted && !isActive && !isFailedStep;
          const StepIcon = step.icon;

          return (
            <div key={i} role="listitem" aria-current={isActive ? "step" : undefined}>
              {/* Connector line (above step, skip for first) */}
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
                {/* Step circle */}
                <div className="relative flex-shrink-0">
                  {/* Pulse ring for active step */}
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

                {/* Label + description */}
                <div className="pt-2 min-w-0">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      isUpcoming && !isFailedStep ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {isFailedStep ? "Unable to access records" : step.label}
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
                          ? "The health network may be temporarily unavailable."
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

      {/* Terminal action buttons */}
      <div className="mt-10">
        {status === "partial" && displayStep >= 3 && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Some data has arrived. More may still be loading &mdash; you can
              continue now or wait.
            </p>
            <Button onClick={handleContinue}>Continue to Dashboard</Button>
          </div>
        )}

        {isFailed && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Data retrieval failed. Please try connecting again.
            </p>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect &amp; Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

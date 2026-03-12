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
  Minus,
  AlertTriangle,
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
const REVEAL_INTERVAL_MS = 700;

type CompletedCategory = { label: string; count: number };

function epicToStep(
  epicStatus: ReturnType<typeof useEpicStatus>,
  queueDrained: boolean
): number {
  if (!epicStatus) return 0;
  if (epicStatus.syncing && epicStatus.syncProgress) {
    return epicStatus.syncProgress.completed > 0 ? 1 : 0;
  }
  if (!epicStatus.syncing && epicStatus.connected) {
    // Don't advance past step 1 until reveal queue is drained
    return queueDrained ? 3 : 1;
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

  // Queue-based category reveal
  const [revealedCategories, setRevealedCategories] = useState<CompletedCategory[]>([]);
  const queueRef = useRef<CompletedCategory[]>([]);
  const seenLabelsRef = useRef<Set<string>>(new Set());
  const queueDrained = queueRef.current.length === 0;

  // Diff incoming completedCategories against seen, push new items to queue
  useEffect(() => {
    const incoming = epicStatus?.syncProgress?.completedCategories;
    if (!incoming) return;

    for (const cat of incoming) {
      if (!seenLabelsRef.current.has(cat.label)) {
        seenLabelsRef.current.add(cat.label);
        queueRef.current.push(cat);
      }
    }
  }, [epicStatus?.syncProgress?.completedCategories]);

  // Drain queue one item at a time with REVEAL_INTERVAL_MS delay
  useEffect(() => {
    if (isError) return;

    const drain = () => {
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        setRevealedCategories((prev) => [...prev, next]);
      }
    };

    const interval = setInterval(drain, REVEAL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isError]);

  const backendStep = isError ? 0 : epicToStep(epicStatus, queueDrained);
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

  // Auto-scroll the category feed
  const feedEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [revealedCategories.length]);

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

                <div className="pt-2 min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      isUpcoming && !isErrorStep ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {isErrorStep ? "Connection failed" : step.label}
                  </p>

                  {/* Category feed for download step */}
                  {(isActive || isCompleted) && i === 1 && revealedCategories.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
                      <AnimatePresence initial={false}>
                        {revealedCategories.map((cat) => (
                          <motion.div
                            key={cat.label}
                            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-2 text-xs"
                          >
                            {cat.count > 0 ? (
                              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            ) : cat.count === 0 ? (
                              <Minus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            )}
                            <span className={cat.count < 0 ? "text-muted-foreground" : "text-foreground"}>
                              {cat.label}
                            </span>
                            <span className="text-muted-foreground">
                              {cat.count > 0
                                ? `\u2014 ${cat.count} record${cat.count !== 1 ? "s" : ""}`
                                : cat.count === 0
                                  ? "\u2014 no data"
                                  : "\u2014 unavailable"}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={feedEndRef} />
                    </div>
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

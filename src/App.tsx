import { BrowserRouter } from "react-router-dom";
import { LazyMotion, domAnimation } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { HealthDataProvider } from "./context/HealthDataContext";
import { ResourceDetailProvider } from "./context/ResourceDetailContext";
import { UploadProvider } from "./context/UploadContext";
import { ChatProvider } from "./context/ChatContext";
import { RebuildProvider } from "./context/RebuildContext";
import { AppRouter } from "./router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <BrowserRouter>
        <AuthProvider>
          <HealthDataProvider>
            <RebuildProvider>
            <UploadProvider>
            <ChatProvider>
              <ResourceDetailProvider>
              <ErrorBoundary>
                <TooltipProvider delayDuration={300}>
                  <AppRouter />
                </TooltipProvider>
              </ErrorBoundary>
              <Toaster />
              </ResourceDetailProvider>
            </ChatProvider>
            </UploadProvider>
            </RebuildProvider>
          </HealthDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </LazyMotion>
  );
}

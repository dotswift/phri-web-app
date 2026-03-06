import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { ResourceDetailProvider } from "./context/ResourceDetailContext";
import { UploadProvider } from "./context/UploadContext";
import { AppRouter } from "./router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LazyMotion features={domAnimation}>
        <BrowserRouter>
          <AuthProvider>
            <UploadProvider>
              <ResourceDetailProvider>
                <ErrorBoundary>
                  <TooltipProvider delayDuration={300}>
                    <AppRouter />
                  </TooltipProvider>
                </ErrorBoundary>
                <Toaster />
              </ResourceDetailProvider>
            </UploadProvider>
          </AuthProvider>
        </BrowserRouter>
      </LazyMotion>
    </ThemeProvider>
  );
}

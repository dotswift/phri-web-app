import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { SandboxProvider } from "./context/SandboxContext";
import { ResourceDetailProvider } from "./context/ResourceDetailContext";
import { AppRouter } from "./router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LazyMotion features={domAnimation}>
        <BrowserRouter>
          <AuthProvider>
            <SandboxProvider>
              <ResourceDetailProvider>
                <ErrorBoundary>
                  <TooltipProvider delayDuration={300}>
                    <AppRouter />
                  </TooltipProvider>
                </ErrorBoundary>
                <Toaster />
              </ResourceDetailProvider>
            </SandboxProvider>
          </AuthProvider>
        </BrowserRouter>
      </LazyMotion>
    </ThemeProvider>
  );
}

import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { SandboxProvider } from "./context/SandboxContext";
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
              <ErrorBoundary>
                <TooltipProvider delayDuration={300}>
                  <AppRouter />
                </TooltipProvider>
              </ErrorBoundary>
              <Toaster />
            </SandboxProvider>
          </AuthProvider>
        </BrowserRouter>
      </LazyMotion>
    </ThemeProvider>
  );
}

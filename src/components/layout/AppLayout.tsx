import { Outlet, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Home,
  Clock,
  Pill,
  Syringe,
  Loader2,
} from "lucide-react";
import { DesktopSidebar } from "@/components/layout/FloatingNav";
import { useUpload } from "@/context/UploadContext";
import { cn } from "@/lib/utils";

const bottomTabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/records/medications/insights", label: "Medications", icon: Pill },
  { to: "/records/immunizations", label: "Immunizations", icon: Syringe },
];

function MobileBottomBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {bottomTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="mb-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Isolated component so useLocation() re-renders don't propagate to AppLayout */
function AnimatedOutlet() {
  const { pathname } = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pathname}>
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}

function UploadBanner() {
  const { state, progress } = useUpload();

  if (state !== "uploading" || !progress) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border bg-card p-3">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="truncate font-medium">{progress.description}</span>
          <span className="ml-2 shrink-0 text-muted-foreground">
            {progress.percent}%
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>

      <DesktopSidebar />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 md:ml-60 mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-6 md:pb-6 md:pt-8 outline-none"
      >
        <UploadBanner />
        <AnimatedOutlet />
      </main>

      <MobileBottomBar />
    </div>
  );
}

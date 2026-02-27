import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Home,
  FolderOpen,
  MessageSquare,
  User,
  LogOut,
  Heart,
  Pill,
  FlaskConical,
  Syringe,
  Stethoscope,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const bottomTabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/records", label: "Records", icon: FolderOpen },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

const recordsSubItems = [
  { to: "/records/conditions", label: "Conditions", icon: Heart },
  { to: "/records/medications", label: "Medications", icon: Pill },
  { to: "/records/lab-results", label: "Lab Results", icon: FlaskConical },
  { to: "/records/immunizations", label: "Immunizations", icon: Syringe },
  { to: "/records/visits", label: "Visits", icon: Stethoscope },
  { to: "/records/documents", label: "Documents", icon: FileText },
  { to: "/records/timeline", label: "Timeline", icon: Clock },
];

function DesktopSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recordsExpanded, setRecordsExpanded] = useState(
    location.pathname.startsWith("/records"),
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isRecordsActive = location.pathname.startsWith("/records");

  return (
    <aside
      className="hidden w-56 flex-col border-r bg-card md:flex"
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between p-4">
        <div>
          <span className="text-lg font-semibold">PHRI</span>
          <p className="text-xs text-muted-foreground">
            Personal Health Record & Insights
          </p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-auto p-2" aria-label="Main navigation">
        {/* Home */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-l-[3px] border-primary bg-accent text-accent-foreground font-semibold"
                : "border-l-[3px] border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <Home className="h-4 w-4" />
          Home
        </NavLink>

        {/* Records with sub-items */}
        <div>
          <button
            onClick={() => setRecordsExpanded(!recordsExpanded)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isRecordsActive
                ? "border-l-[3px] border-primary bg-accent text-accent-foreground font-semibold"
                : "border-l-[3px] border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="flex-1 text-left">Records</span>
            {recordsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          {recordsExpanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
              {recordsSubItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-l-[3px] border-primary bg-accent text-accent-foreground font-semibold"
                : "border-l-[3px] border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-l-[3px] border-primary bg-accent text-accent-foreground font-semibold"
                : "border-l-[3px] border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <User className="h-4 w-4" />
          Profile
        </NavLink>
      </nav>
      <Separator />
      <div className="flex items-center justify-between p-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}

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

export function AppLayout() {
  return (
    <div className="flex h-screen">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>

      <DesktopSidebar />

      <div className="flex flex-1 flex-col">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6 outline-none"
        >
          <AnimatedOutlet />
        </main>
      </div>

      <MobileBottomBar />
    </div>
  );
}

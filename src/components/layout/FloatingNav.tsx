import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Clock,
  Pill,
  Syringe,
  FolderOpen,
  MessageSquare,
  Settings,
  Heart,
  FlaskConical,
  Stethoscope,
  FileText,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/records/medications/insights", label: "Medications", icon: Pill },
  { to: "/records/immunizations", label: "Immunizations", icon: Syringe },
];

const recordsSubItems = [
  { to: "/records/conditions", label: "Conditions", icon: Heart },
  { to: "/records/lab-results", label: "Lab Results", icon: FlaskConical },
  { to: "/records/visits", label: "Visits", icon: Stethoscope },
  { to: "/records/documents", label: "Documents", icon: FileText },
  { to: "/records", label: "All Records", icon: FolderOpen, end: true },
];

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-sidebar-primary -ml-px"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </NavLink>
  );
}

function RecordsSection() {
  const { pathname } = useLocation();
  const isInRecords =
    pathname.startsWith("/records") &&
    !pathname.startsWith("/records/medications") &&
    !pathname.startsWith("/records/immunizations");
  const [open, setOpen] = useState(isInRecords);

  useEffect(() => {
    if (isInRecords) setOpen(true);
  }, [isInRecords]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isInRecords
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <FolderOpen className="size-4 shrink-0" />
        Records
        <ChevronDown
          className={cn(
            "ml-auto size-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {recordsSubItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DesktopSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-4">
        <NavLink to="/home" className="text-base font-bold tracking-tight text-sidebar-foreground">
          PHRI
        </NavLink>
        <p className="text-xs text-sidebar-foreground/50 mt-0.5">
          Personal Health Record & Insights
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
        <RecordsSection />
        <SidebarLink to="/chat" label="Chat" icon={MessageSquare} />
        <SidebarLink to="/settings" label="Settings" icon={Settings} />
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <button
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

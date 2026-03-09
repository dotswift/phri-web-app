import { NavLink } from "react-router-dom";
import {
  Home,
  Clock,
  Pill,
  Syringe,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/records/medications/insights", label: "Medications", icon: Pill },
  { to: "/records/immunizations", label: "Immunizations", icon: Syringe },
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

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-4">
        <NavLink to="/home" className="text-base font-bold tracking-tight text-sidebar-foreground">
          PHRI
        </NavLink>
        <p className="text-xs text-sidebar-foreground/70 mt-0.5">
          Personal Health Record & Insights
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
        <SidebarLink to="/settings" label="Settings" icon={Settings} />
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="px-1">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

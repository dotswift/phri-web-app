import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Clock,
  Pill,
  Syringe,
  FolderOpen,
  Settings,
  Heart,
  FlaskConical,
  Stethoscope,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/records/medications", label: "Medications", icon: Pill },
  { to: "/records/immunizations", label: "Immunizations", icon: Syringe },
];

const recordsSubItems = [
  { to: "/records/conditions", label: "Conditions", icon: Heart },
  { to: "/records/lab-results", label: "Lab Results", icon: FlaskConical },
  { to: "/records/visits", label: "Visits", icon: Stethoscope },
  { to: "/records/documents", label: "Documents", icon: FileText },
];

function NavIconLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink to={to} aria-label={label}>
          {({ isActive }) => (
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "rounded-xl",
                isActive && "bg-accent text-accent-foreground",
              )}
              asChild
            >
              <span>
                <Icon className="size-4" />
              </span>
            </Button>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function RecordsPopover() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isRecordsActive =
    pathname.startsWith("/records") &&
    !pathname.startsWith("/records/medications") &&
    !pathname.startsWith("/records/immunizations");

  // Close popover on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "rounded-xl",
                isRecordsActive && "bg-accent text-accent-foreground",
              )}
              aria-label="Records"
            >
              <FolderOpen className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Records</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-48 p-2">
        <nav className="flex flex-col gap-0.5" aria-label="Record categories">
          {recordsSubItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
          <Separator className="my-1" />
          <NavLink
            to="/records"
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <FolderOpen className="size-4" />
            All Records
          </NavLink>
        </nav>
      </PopoverContent>
    </Popover>
  );
}

export function FloatingNav() {
  return (
    <nav
      className="fixed top-4 right-4 z-50 hidden md:flex items-center gap-0.5 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg px-2 py-1.5"
      aria-label="Main navigation"
    >
      {navItems.map((item) => (
        <NavIconLink key={item.to} {...item} />
      ))}
      <RecordsPopover />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <NavIconLink to="/settings" label="Settings" icon={Settings} />
    </nav>
  );
}

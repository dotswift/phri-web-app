import { Shield, Lock, BadgeCheck } from "lucide-react";

const BADGES = [
  { icon: Shield, label: "HIPAA Compliant" },
  { icon: Lock, label: "256-bit Encryption" },
  { icon: BadgeCheck, label: "SOC 2 Certified" },
] as const;

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {BADGES.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

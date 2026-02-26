import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * 3-tier destructive action confirmation:
 * - Tier 1 (default): Simple confirm/cancel dialog
 * - Tier 2 (destructive=true): Consequence description, safe action autofocused
 * - Tier 3 (requireTyping): Item counts, type to confirm, role="alertdialog"
 */
interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  /** When set, user must type this exact string to confirm (Tier 3). */
  requireTyping?: string;
  /** Optional item count to display for Tier 3 destructive actions. */
  itemCount?: number;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive,
  requireTyping,
  itemCount,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);

  const canConfirm = requireTyping ? typed === requireTyping : true;

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      setOpen(false);
      setTyped("");
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTyped("");
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent
        role={requireTyping ? "alertdialog" : undefined}
        aria-describedby="confirm-dialog-desc"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription id="confirm-dialog-desc">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {itemCount !== undefined && (
          <p className="text-sm font-medium text-destructive">
            This will affect {itemCount} item{itemCount !== 1 ? "s" : ""}.
          </p>
        )}
        {requireTyping && (
          <div className="mt-2">
            <label
              htmlFor="confirm-typing-input"
              className="mb-1 block text-sm text-muted-foreground"
            >
              Type <strong>{requireTyping}</strong> to confirm:
            </label>
            <Input
              id="confirm-typing-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTyping}
              aria-required="true"
              aria-invalid={typed.length > 0 && typed !== requireTyping}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel autoFocus={destructive && !requireTyping}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={destructive ? "destructive" : "default"}
              disabled={!canConfirm || loading}
              onClick={handleConfirm}
            >
              {loading ? "Please wait..." : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

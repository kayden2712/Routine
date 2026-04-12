import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xac nhan',
  onConfirm,
  variant = 'warning',
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] rounded-[12px] p-0 font-[var(--font-body)]" showCloseButton={false}>
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning-bg)]">
            <AlertTriangle size={24} className="text-[var(--color-warning)]" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[var(--color-text-primary)]">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--color-text-secondary)]">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-[12px] border-t border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huy
          </Button>
          <Button
            variant={isDanger ? 'destructive' : 'default'}
            className={isDanger ? 'bg-[var(--color-error)] text-white hover:bg-[#B91C1C]' : undefined}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

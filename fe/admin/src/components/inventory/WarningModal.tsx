import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

export function WarningModal({ open, onOpenChange, title, description }: WarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--color-error)]">
            <AlertTriangle size={18} />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Da hieu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

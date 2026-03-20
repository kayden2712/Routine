import { ReceiptText } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export function InvoicesPage() {
  return (
    <EmptyState
      icon={ReceiptText}
      title="Hoa don"
      description="Danh sach hoa don chi tiet dang duoc trien khai."
    />
  );
}

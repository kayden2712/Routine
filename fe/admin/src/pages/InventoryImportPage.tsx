import { useEffect } from 'react';
import { StockReceiptWorkspace } from '@/components/inventory/StockReceiptWorkspace';

export function InventoryImportPage() {
  useEffect(() => {
    document.title = 'Phieu nhap kho | Routine';
  }, []);

  return <StockReceiptWorkspace mode="import" />;
}

import { useEffect } from 'react';
import { StockReceiptWorkspace } from '@/components/inventory/StockReceiptWorkspace';

export function InventoryExportPage() {
  useEffect(() => {
    document.title = 'Phieu xuat kho | Routine';
  }, []);

  return <StockReceiptWorkspace mode="export" />;
}

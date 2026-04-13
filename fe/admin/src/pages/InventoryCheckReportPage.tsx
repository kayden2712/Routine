import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DiscrepancyReport } from '@/components/inventory/DiscrepancyReport';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { inventoryApi } from '@/lib/inventoryApi';
import type { InventoryCheckItem, InventoryDiscrepancyReport } from '@/types';

export function InventoryCheckReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<InventoryDiscrepancyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const stocktakeId = Number(searchParams.get('stocktakeId'));
  const checkDate = searchParams.get('checkDate') ?? '';

  useEffect(() => {
    document.title = 'Bao cao chenh lech | Routine';
    if (!Number.isFinite(stocktakeId) || stocktakeId <= 0) {
      toast.error('Thieu thong tin phien kiem kho');
      return;
    }

    void loadReport(stocktakeId);
  }, [stocktakeId]);

  const loadReport = async (id: number) => {
    setLoading(true);
    try {
      const data = await inventoryApi.getInventoryDiscrepancyReport(id);
      setReport(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tai bao cao chenh lech');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (item: InventoryCheckItem, action: 'CONFIRM' | 'RECHECK') => {
    if (!report) return;

    try {
      await inventoryApi.confirmInventoryCheck({
        stocktakeId: report.stocktakeId,
        itemId: item.itemId,
        action,
      });

      await loadReport(report.stocktakeId);
      toast.success(action === 'CONFIRM' ? 'Da xac nhan san pham' : 'Da danh dau can kiem lai');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the cap nhat xac nhan kiem ke');
    }
  };

  const backToCheckPage = () => {
    navigate(`/inventory/check${checkDate ? `?checkDate=${checkDate}` : ''}`);
  };

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
            Bao cao chenh lech
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {report ? `Phien ${report.stocktakeCode} - Ngay ${report.checkDate}` : 'Dang tai bao cao...'}
          </p>
        </div>

        <Button variant="outline" onClick={backToCheckPage}>
          <ArrowLeft size={16} />
          Quay lai kiem kho
        </Button>
      </section>

      {loading ? <p className="text-sm text-[var(--color-text-secondary)]">Dang tai...</p> : null}

      <DiscrepancyReport
        report={report}
        onConfirm={(item) => void handleReportAction(item, 'CONFIRM')}
        onRecheck={(item) => void handleReportAction(item, 'RECHECK')}
      />
    </div>
  );
}

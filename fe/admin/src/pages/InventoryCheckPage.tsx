import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { InventoryCheckList } from '@/components/inventory/InventoryCheckList';
import { WarningModal } from '@/components/inventory/WarningModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { inventoryApi } from '@/lib/inventoryApi';
import type { InventoryCheckItem, InventoryCheckListData } from '@/types';

interface PendingSubmit {
  item: InventoryCheckItem;
  actualQty: number;
  note?: string;
}

export function InventoryCheckPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const getTodayIso = () => new Date().toISOString().slice(0, 10);
  const listSectionRef = useRef<HTMLDivElement | null>(null);
  const [checkData, setCheckData] = useState<InventoryCheckListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('checkDate') ?? getTodayIso());
  const [submittingItemId, setSubmittingItemId] = useState<number | null>(null);
  const [draftActual, setDraftActual] = useState<Record<number, string>>({});
  const [draftNote, setDraftNote] = useState<Record<number, string>>({});
  const [pendingSubmit, setPendingSubmit] = useState<PendingSubmit | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningText, setWarningText] = useState('');

  useEffect(() => {
    document.title = 'Kiem ke kho | Routine';
    void loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (checkDate: string) => {
    setLoading(true);
    try {
      const list = await inventoryApi.getInventoryCheckItems(checkDate);
      setCheckData(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tai du lieu kiem ke');
    } finally {
      setLoading(false);
    }
  };

  const checkedProgress = useMemo(() => {
    if (!checkData || checkData.items.length === 0) {
      return '0/0';
    }

    const checked = checkData.items.filter((item) => item.actualQty != null).length;
    return `${checked}/${checkData.items.length}`;
  }, [checkData]);

  const handleSubmitClick = (item: InventoryCheckItem) => {
    if (!checkData) return;

    const actualRaw = draftActual[item.itemId] ?? (item.actualQty != null ? String(item.actualQty) : '');
    if (actualRaw.trim() === '') {
      toast.error('Vui long nhap so luong thuc te');
      return;
    }

    const actualQty = Number(actualRaw);
    if (!Number.isFinite(actualQty) || actualQty < 0) {
      toast.error('So luong thuc te phai lon hon hoac bang 0');
      return;
    }

    setPendingSubmit({
      item,
      actualQty,
      note: (draftNote[item.itemId] ?? item.note ?? '').trim() || undefined,
    });
  };

  const handleConfirmSubmit = async () => {
    if (!checkData || !pendingSubmit) {
      return;
    }

    setSubmittingItemId(pendingSubmit.item.itemId);

    try {
      const updated = await inventoryApi.submitInventoryCheck({
        stocktakeId: checkData.stocktakeId,
        itemId: pendingSubmit.item.itemId,
        actualQty: pendingSubmit.actualQty,
        note: pendingSubmit.note,
      });

      setCheckData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) => (item.itemId === updated.itemId ? updated : item)),
        };
      });

      if (updated.warning) {
        setWarningText(
          `San pham ${updated.sku} co do lech lon (${updated.discrepancy}). Vui long kiem tra lai truoc khi xac nhan.`,
        );
        setWarningOpen(true);
      } else {
        toast.success('Da luu thong tin kiem kho');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the submit kiem ke');
    } finally {
      setSubmittingItemId(null);
      setPendingSubmit(null);
    }
  };

  const jumpToCheckList = () => {
    listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openDiscrepancyReport = () => {
    if (!checkData) {
      toast.error('Khong co phien kiem kho de xem bao cao');
      return;
    }

    navigate(`/inventory/check/report?stocktakeId=${checkData.stocktakeId}&checkDate=${selectedDate}`);
  };

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">Kiem ke kho</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {checkData ? `Ngay ${checkData.checkDate} - Phien ${checkData.stocktakeCode} - Tien do ${checkedProgress}` : 'Dang tai du lieu...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={jumpToCheckList}>
            Danh sach kiem kho
          </Button>
          <Button variant="outline" onClick={openDiscrepancyReport} disabled={!checkData}>
            Bao cao chenh lech
          </Button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button variant="outline" onClick={() => void loadData(selectedDate)} disabled={loading}>
            <ClipboardCheck size={16} />
            {loading ? 'Dang tai...' : 'Tai phien theo ngay'}
          </Button>
        </div>
      </section>

      <div ref={listSectionRef}>
        {checkData ? (
          <InventoryCheckList
            items={checkData.items}
            draftActual={draftActual}
            draftNote={draftNote}
            submittingItemId={submittingItemId}
            onActualChange={(itemId, value) => setDraftActual((prev) => ({ ...prev, [itemId]: value }))}
            onNoteChange={(itemId, value) => setDraftNote((prev) => ({ ...prev, [itemId]: value }))}
            onSubmit={handleSubmitClick}
          />
        ) : null}
      </div>

      <Dialog open={Boolean(pendingSubmit)} onOpenChange={(open) => {
        if (!open) {
          setPendingSubmit(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xac nhan luu</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Luu so luong thuc te {pendingSubmit?.actualQty} cho {pendingSubmit?.item.name}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingSubmit(null)}>Huy</Button>
            <Button onClick={() => void handleConfirmSubmit()}>Xac nhan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WarningModal
        open={warningOpen}
        onOpenChange={setWarningOpen}
        title="Phat hien chenh lech lon"
        description={warningText}
      />
    </div>
  );
}

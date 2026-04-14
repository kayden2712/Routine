import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { InventoryCheckList } from '@/components/inventory/InventoryCheckList';
import { WarningModal } from '@/components/inventory/WarningModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { inventoryApi } from '@/lib/inventoryApi';
import type { InventoryCheckItem, InventoryCheckListData, InventoryCheckSession } from '@/types';

export function InventoryCheckPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const getTodayIso = () => new Date().toISOString().slice(0, 10);
  const [checkData, setCheckData] = useState<InventoryCheckListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionListOpen, setSessionListOpen] = useState(false);
  const [sessions, setSessions] = useState<InventoryCheckSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('checkDate') ?? getTodayIso());
  const [submittingItemId, setSubmittingItemId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [draftActual, setDraftActual] = useState<Record<number, string>>({});
  const [draftNote, setDraftNote] = useState<Record<number, string>>({});
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

  const allItemsChecked = useMemo(() => {
    if (!checkData || checkData.items.length === 0) {
      return false;
    }
    return checkData.items.every((item) => item.actualQty != null);
  }, [checkData]);

  const isReadOnly = checkData?.status !== 'DANG_KIEM';

  const handleSubmitClick = async (item: InventoryCheckItem) => {
    if (!checkData) return;
    if (isReadOnly) {
      toast.error('Phieu da duyet, khong the chinh sua');
      return;
    }

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

    setSubmittingItemId(item.itemId);

    try {
      const updated = await inventoryApi.submitInventoryCheck({
        stocktakeId: checkData.stocktakeId,
        itemId: item.itemId,
        actualQty,
        note: (draftNote[item.itemId] ?? item.note ?? '').trim() || undefined,
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
    }
  };

  const approveCurrentStocktake = async () => {
    if (!checkData) return;
    setApproving(true);
    try {
      const updated = await inventoryApi.approveInventoryCheck({
        stocktakeId: checkData.stocktakeId,
      });
      setCheckData(updated);
      toast.success('Da duyet phieu kiem kho va khoa chinh sua');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the duyet phieu kiem kho');
    } finally {
      setApproving(false);
    }
  };

  const getSessionStatusLabel = (status: InventoryCheckSession['status']) => {
    if (status === 'HOAN_THANH') return 'Hoan thanh';
    if (status === 'HUY') return 'Da huy';
    return 'Dang kiem';
  };

  const getSessionEvaluationLabel = (evaluation: InventoryCheckSession['evaluation']) => {
    if (evaluation === 'DU') return 'Du';
    if (evaluation === 'THUA') return 'Thua';
    if (evaluation === 'THIEU') return 'Thieu';
    return 'Chua kiem';
  };

  const openSessionList = async () => {
    setSessionListOpen(true);
    setLoadingSessions(true);
    try {
      const data = await inventoryApi.getInventoryCheckSessions();
      setSessions(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tai danh sach phieu kiem kho');
    } finally {
      setLoadingSessions(false);
    }
  };

  const openSession = async (checkDate: string) => {
    setSelectedDate(checkDate);
    setSessionListOpen(false);
    await loadData(checkDate);
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
          <Button onClick={() => void approveCurrentStocktake()} disabled={!checkData || isReadOnly || !allItemsChecked || approving}>
            {approving ? 'Dang duyet...' : 'Duyet phieu'}
          </Button>
          <Button variant="secondary" onClick={() => void openSessionList()}>
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

      {checkData ? (
        <InventoryCheckList
          items={checkData.items}
          draftActual={draftActual}
          draftNote={draftNote}
          submittingItemId={submittingItemId}
          readOnly={isReadOnly}
          onActualChange={(itemId, value) => setDraftActual((prev) => ({ ...prev, [itemId]: value }))}
          onNoteChange={(itemId, value) => setDraftNote((prev) => ({ ...prev, [itemId]: value }))}
          onSubmit={(item) => void handleSubmitClick(item)}
        />
      ) : null}

      <Dialog open={sessionListOpen} onOpenChange={setSessionListOpen}>
        <DialogContent className="w-[98vw] max-w-[1800px]">
          <DialogHeader>
            <DialogTitle>Danh sach phieu kiem kho theo ngay</DialogTitle>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#F7F6F4] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-3 text-left">Ngay</th>
                  <th className="px-3 py-3 text-left">Ma phieu</th>
                  <th className="px-3 py-3 text-left">Tien do</th>
                  <th className="px-3 py-3 text-left">Trang thai</th>
                  <th className="px-3 py-3 text-left">Danh gia</th>
                  <th className="px-3 py-3 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {loadingSessions ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[var(--color-text-secondary)]">
                      Dang tai danh sach...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[var(--color-text-secondary)]">
                      Chua co phieu kiem kho
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.stocktakeId} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-3">{session.checkDate}</td>
                      <td className="px-3 py-3">{session.stocktakeCode}</td>
                      <td className="px-3 py-3">
                        {session.checkedItems}/{session.totalItems}
                      </td>
                      <td className="px-3 py-3">{getSessionStatusLabel(session.status)}</td>
                      <td className="px-3 py-3">{getSessionEvaluationLabel(session.evaluation)}</td>
                      <td className="px-3 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => void openSession(session.checkDate)}>
                          Mo phieu
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

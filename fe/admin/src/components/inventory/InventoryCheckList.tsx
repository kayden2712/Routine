import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InventoryCheckItem } from '@/types';

interface InventoryCheckListProps {
  items: InventoryCheckItem[];
  draftActual: Record<number, string>;
  draftNote: Record<number, string>;
  submittingItemId: number | null;
  onActualChange: (itemId: number, value: string) => void;
  onNoteChange: (itemId: number, value: string) => void;
  onSubmit: (item: InventoryCheckItem) => void;
}

function getRowClass(item: InventoryCheckItem): string {
  if (item.warning) {
    return 'bg-[var(--color-error-bg)]/40';
  }
  if (item.discrepancy != null && item.discrepancy !== 0) {
    return 'bg-[var(--color-warning-bg)]/40';
  }
  if (item.actualQty != null && item.discrepancy === 0) {
    return 'bg-[var(--color-success-bg)]/40';
  }
  return '';
}

function getStatusLabel(item: InventoryCheckItem): string {
  if (item.status === 'WARNING') return 'Canh bao';
  if (item.status === 'MATCH') return 'Khop';
  if (item.status === 'DISCREPANCY') return 'Lech';
  if (item.status === 'CONFIRMED') return 'Da xac nhan';
  if (item.status === 'RECHECK_REQUIRED') return 'Can kiem lai';
  return 'Cho kiem';
}

export function InventoryCheckList({
  items,
  draftActual,
  draftNote,
  submittingItemId,
  onActualChange,
  onNoteChange,
  onSubmit,
}: InventoryCheckListProps) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[#F7F6F4] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            <th className="px-3 py-3 text-left">San pham</th>
            <th className="px-3 py-3 text-left">SKU</th>
            <th className="px-3 py-3 text-left">So luong he thong</th>
            <th className="px-3 py-3 text-left">So luong thuc te</th>
            <th className="px-3 py-3 text-left">Do lech</th>
            <th className="px-3 py-3 text-left">Trang thai</th>
            <th className="px-3 py-3 text-left">Ghi chu</th>
            <th className="px-3 py-3 text-right">Thao tac</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const actualValue = draftActual[item.itemId] ?? (item.actualQty != null ? String(item.actualQty) : '');
            const noteValue = draftNote[item.itemId] ?? item.note ?? '';
            const canSubmit = actualValue.trim() !== '';

            return (
              <tr key={item.itemId} className={`border-b border-[var(--color-border)] last:border-b-0 ${getRowClass(item)}`}>
                <td className="px-3 py-3 font-medium text-[var(--color-text-primary)]">{item.name}</td>
                <td className="px-3 py-3 text-[var(--color-text-secondary)]">{item.sku}</td>
                <td className="px-3 py-3 text-[var(--color-text-secondary)]">{item.systemQty}</td>
                <td className="px-3 py-3">
                  <Input
                    value={actualValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        onActualChange(item.itemId, value);
                      }
                    }}
                    placeholder="Nhap so thuc te"
                    className="h-8"
                  />
                </td>
                <td className="px-3 py-3 text-[var(--color-text-secondary)]">{item.discrepancy ?? '-'}</td>
                <td className="px-3 py-3 text-[var(--color-text-secondary)]">{getStatusLabel(item)}</td>
                <td className="px-3 py-3">
                  <Input
                    value={noteValue}
                    onChange={(event) => onNoteChange(item.itemId, event.target.value)}
                    placeholder="Ghi chu"
                    className="h-8"
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <Button
                    size="sm"
                    onClick={() => onSubmit(item)}
                    disabled={!canSubmit || submittingItemId === item.itemId}
                  >
                    <CheckCircle2 size={14} />
                    {submittingItemId === item.itemId ? 'Dang gui...' : 'Luu'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

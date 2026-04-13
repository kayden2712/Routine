import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryCheckItem, InventoryDiscrepancyReport } from '@/types';

interface DiscrepancyReportProps {
  report: InventoryDiscrepancyReport | null;
  onConfirm: (item: InventoryCheckItem) => void;
  onRecheck: (item: InventoryCheckItem) => void;
}

function exportCsv(report: InventoryDiscrepancyReport): void {
  const rows = report.items
    .filter((item) => item.discrepancy != null && item.discrepancy !== 0)
    .map((item) => [
      item.sku,
      item.name,
      item.systemQty,
      item.actualQty ?? '',
      item.discrepancy ?? '',
      item.warning ? 'CANH BAO' : 'LECH',
    ]);

  const header = ['SKU', 'Ten san pham', 'So luong he thong', 'So luong thuc te', 'Do lech', 'Trang thai'];
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bao-cao-chenh-lech-${report.stocktakeCode}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportPdf(report: InventoryDiscrepancyReport): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const discrepancies = report.items.filter((item) => item.discrepancy != null && item.discrepancy !== 0);

  doc.setFontSize(14);
  doc.text(`Bao cao chenh lech ton kho - ${report.stocktakeCode}`, 40, 50);
  doc.setFontSize(10);
  doc.text(`Tong: ${report.totalItems} | Da kiem: ${report.checkedItems} | Canh bao: ${report.warningItems}`, 40, 68);

  autoTable(doc, {
    startY: 84,
    head: [['SKU', 'San pham', 'He thong', 'Thuc te', 'Do lech', 'Trang thai']],
    body: discrepancies.map((item) => [
      item.sku,
      item.name,
      String(item.systemQty),
      String(item.actualQty ?? ''),
      String(item.discrepancy ?? ''),
      item.warning ? 'CANH BAO' : 'LECH',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60, 60, 60] },
  });

  doc.save(`bao-cao-chenh-lech-${report.stocktakeCode}.pdf`);
}

export function DiscrepancyReport({ report, onConfirm, onRecheck }: DiscrepancyReportProps) {
  if (!report) {
    return null;
  }

  const discrepancies = report.items.filter((item) => item.discrepancy != null && item.discrepancy !== 0);

  return (
    <section className="space-y-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-[var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
            Bao cao chenh lech
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tong {report.totalItems} san pham, {report.discrepancyItems} san pham lech, {report.warningItems} canh bao.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCsv(report)}>
            <Download size={14} />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportPdf(report)}>
            <FileText size={14} />
            PDF
          </Button>
        </div>
      </div>

      {discrepancies.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Khong co chenh lech.</p>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[#F7F6F4] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">San pham</th>
                <th className="px-3 py-2 text-left">He thong</th>
                <th className="px-3 py-2 text-left">Thuc te</th>
                <th className="px-3 py-2 text-left">Do lech</th>
                <th className="px-3 py-2 text-left">Trang thai</th>
                <th className="px-3 py-2 text-right">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.map((item) => (
                <tr
                  key={item.itemId}
                  className={`border-b border-[var(--color-border)] last:border-b-0 ${
                    item.warning ? 'bg-[var(--color-error-bg)]/40' : 'bg-[var(--color-warning-bg)]/40'
                  }`}
                >
                  <td className="px-3 py-2">{item.sku}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.systemQty}</td>
                  <td className="px-3 py-2">{item.actualQty}</td>
                  <td className="px-3 py-2 font-medium">{item.discrepancy}</td>
                  <td className="px-3 py-2">{item.warning ? 'CANH BAO' : 'LECH'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onConfirm(item)}>
                        Xac nhan
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onRecheck(item)}>
                        Kiem lai
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { formatVND } from '@/lib/utils';
import { inventoryApi } from '@/lib/inventoryApi';
import { supplierApi } from '@/lib/supplierApi';
import { useProductStore } from '@/store/productStore';
import type {
  ExportReason,
  ExportReceipt,
  ImportReceipt,
  SupplierListResponse,
} from '@/types';

type ReceiptMode = 'import' | 'export';

interface ReceiptLine {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
}

interface StockReceipt {
  id: number;
  code: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  note?: string;
  supplierName?: string;
  exportReason?: ExportReason;
  lines: ReceiptLine[];
}

interface StockReceiptWorkspaceProps {
  mode: ReceiptMode;
}

const EXPORT_REASON_LABELS: Record<ExportReason, string> = {
  BAN_HANG: 'Ban hang',
  CHUYEN_KHO: 'Chuyen kho',
  HONG_THAT_THOAT: 'Hong that thoat',
  KHAC: 'Khac',
};

function mapImportReceipt(receipt: ImportReceipt): StockReceipt {
  return {
    id: receipt.id,
    code: receipt.maPhieuNhap,
    status: receipt.trangThai,
    createdAt: receipt.ngayNhap,
    note: receipt.ghiChu,
    supplierName: receipt.nhaCungCap?.tenNcc,
    lines: receipt.chiTietList.map((line) => ({
      productId: line.product.id,
      productCode: line.product.code,
      productName: line.product.name,
      quantity: line.soLuongNhap,
    })),
  };
}

function mapExportReceipt(receipt: ExportReceipt): StockReceipt {
  return {
    id: receipt.id,
    code: receipt.maPhieuXuat,
    status: receipt.trangThai,
    createdAt: receipt.ngayXuat,
    note: receipt.ghiChu,
    exportReason: receipt.lyDoXuat,
    lines: receipt.chiTietList.map((line) => ({
      productId: line.product.id,
      productCode: line.product.code,
      productName: line.product.name,
      quantity: line.soLuongXuat,
    })),
  };
}

export function StockReceiptWorkspace({ mode }: StockReceiptWorkspaceProps) {
  const [searchParams] = useSearchParams();
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const hasAppliedPrefill = useRef(false);

  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [exportReason, setExportReason] = useState<ExportReason>('BAN_HANG');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [lineQuantity, setLineQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [draftLines, setDraftLines] = useState<ReceiptLine[]>([]);

  useEffect(() => {
    void loadData();
  }, [mode]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchProducts();

      if (mode === 'import') {
        const [supplierData, receiptData] = await Promise.all([
          supplierApi.getActive(),
          inventoryApi.getImportReceipts({ page: 0, size: 100 }),
        ]);
        setSuppliers(supplierData);
        setReceipts((receiptData.content ?? []).map(mapImportReceipt));
      } else {
        const receiptData = await inventoryApi.getExportReceipts({ page: 0, size: 100 });
        setSuppliers([]);
        setReceipts((receiptData.content ?? []).map(mapExportReceipt));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tai du lieu phieu kho');
    } finally {
      setLoading(false);
    }
  };

  const productMap = useMemo(() => {
    const map = new Map<number, (typeof products)[number]>();
    products.forEach((item) => {
      const id = Number(item.id);
      if (!Number.isNaN(id)) {
        map.set(id, item);
      }
    });
    return map;
  }, [products]);

  const resetDraft = () => {
    setSupplierId('');
    setExportReason('BAN_HANG');
    setSelectedProductId('');
    setLineQuantity('1');
    setDraftLines([]);
    setNote('');
  };

  useEffect(() => {
    if (hasAppliedPrefill.current) {
      return;
    }

    const shouldOpenCreate = searchParams.get('create') === '1';
    const productIdParam = Number(searchParams.get('productId'));
    const hasProductParam = Number.isFinite(productIdParam) && productIdParam > 0;

    if (!shouldOpenCreate && !hasProductParam) {
      return;
    }

    if (shouldOpenCreate) {
      setOpenCreate(true);
    }

    if (hasProductParam && productMap.has(productIdParam)) {
      setSelectedProductId(String(productIdParam));
      setLineQuantity('1');
    }

    hasAppliedPrefill.current = true;
  }, [productMap, searchParams]);

  const addLine = () => {
    const productId = Number(selectedProductId);
    const qty = Number(lineQuantity);
    if (!productId || Number.isNaN(productId)) {
      toast.error('Vui long chon san pham');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('So luong phai lon hon 0');
      return;
    }

    const product = productMap.get(productId);
    if (!product) {
      toast.error('San pham khong ton tai');
      return;
    }

    const parsedQty = Math.floor(qty);
    const currentDraftQty = draftLines.find((line) => line.productId === productId)?.quantity ?? 0;
    if (mode === 'export' && product.stock < currentDraftQty + parsedQty) {
      toast.error(`Khong du ton kho cho ${product.name}`);
      return;
    }

    const existedIndex = draftLines.findIndex((line) => line.productId === productId);
    if (existedIndex >= 0) {
      const next = [...draftLines];
      next[existedIndex] = {
        ...next[existedIndex],
        quantity: next[existedIndex].quantity + parsedQty,
      };
      setDraftLines(next);
      return;
    }

    setDraftLines((prev) => [
      ...prev,
      {
        productId,
        productCode: product.code,
        productName: product.name,
        quantity: parsedQty,
      },
    ]);
  };

  const createReceipt = async () => {
    if (draftLines.length === 0) {
      toast.error('Phieu can it nhat 1 dong san pham');
      return;
    }

    if (mode === 'import' && !supplierId) {
      toast.error('Vui long chon nha cung cap');
      return;
    }

    try {
      if (mode === 'import') {
        const created = await inventoryApi.createImportReceipt({
          ngayNhap: new Date().toISOString(),
          supplierId: Number(supplierId),
          ghiChu: note.trim() || undefined,
          chiTietList: draftLines.map((line) => {
            const product = productMap.get(line.productId);
            const giaNhap = product?.costPrice && product.costPrice > 0 ? product.costPrice : 1;
            return {
              productId: line.productId,
              soLuongNhap: line.quantity,
              giaNhap,
            };
          }),
        });
        setReceipts((prev) => [mapImportReceipt(created), ...prev]);
      } else {
        const created = await inventoryApi.createExportReceipt({
          ngayXuat: new Date().toISOString(),
          lyDoXuat: exportReason,
          ghiChu: note.trim() || undefined,
          chiTietList: draftLines.map((line) => ({
            productId: line.productId,
            soLuongXuat: line.quantity,
          })),
        });
        setReceipts((prev) => [mapExportReceipt(created), ...prev]);
      }

      setOpenCreate(false);
      resetDraft();
      await fetchProducts();
      toast.success(mode === 'import' ? 'Tao phieu nhap thanh cong' : 'Tao phieu xuat thanh cong');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tao phieu kho');
    }
  };

  const cancelDraft = async (receiptId: number) => {
    try {
      const updated = mode === 'import'
        ? mapImportReceipt(await inventoryApi.cancelImportReceipt(receiptId))
        : mapExportReceipt(await inventoryApi.cancelExportReceipt(receiptId));

      setReceipts((prev) => prev.map((item) => (item.id === receiptId ? updated : item)));
      toast.success(mode === 'import' ? 'Da huy phieu nhap' : 'Da huy phieu xuat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the huy phieu');
    }
  };

  const confirmReceipt = async (receipt: StockReceipt) => {
    if (receipt.status !== 'DRAFT') {
      return;
    }

    if (mode === 'export') {
      for (const line of receipt.lines) {
        const product = productMap.get(line.productId);
        if (!product || product.stock < line.quantity) {
          toast.error(`Ton kho khong du cho ${line.productName}`);
          return;
        }
      }
    }

    try {
      const updated = mode === 'import'
        ? mapImportReceipt(await inventoryApi.confirmImportReceipt(receipt.id))
        : mapExportReceipt(await inventoryApi.confirmExportReceipt(receipt.id));

      setReceipts((prev) => prev.map((item) => (item.id === receipt.id ? updated : item)));
      await fetchProducts();
      toast.success(mode === 'import' ? 'Da xac nhan phieu nhap' : 'Da xac nhan phieu xuat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the xac nhan phieu');
    }
  };

  const title = mode === 'import' ? 'Phieu Nhap Kho' : 'Phieu Xuat Kho';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-[20px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus size={14} />
          {mode === 'import' ? 'Tao phieu nhap' : 'Tao phieu xuat'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[#F7F6F4] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              <th className="px-4 py-3">Ma phieu</th>
              <th className="px-4 py-3">Ngay tao</th>
              <th className="px-4 py-3">Mat hang</th>
              <th className="px-4 py-3">Tong so luong</th>
              <th className="px-4 py-3">Trang thai</th>
              <th className="px-4 py-3 text-right">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                  <ClipboardList className="mx-auto mb-2" size={18} />
                  {loading ? 'Dang tai du lieu...' : 'Chua co phieu nao'}
                </td>
              </tr>
            ) : (
              receipts.map((receipt) => {
                const totalQty = receipt.lines.reduce((sum, line) => sum + line.quantity, 0);
                return (
                  <tr key={receipt.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{receipt.code}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {new Date(receipt.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {mode === 'import'
                        ? receipt.supplierName ?? receipt.lines.length
                        : receipt.exportReason
                          ? EXPORT_REASON_LABELS[receipt.exportReason]
                          : receipt.lines.length}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{totalQty}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
                        style={{
                          backgroundColor:
                            receipt.status === 'CONFIRMED'
                              ? 'var(--color-success-bg)'
                              : receipt.status === 'CANCELLED'
                                ? 'var(--color-danger-bg)'
                                : 'var(--color-warning-bg)',
                          color:
                            receipt.status === 'CONFIRMED'
                              ? 'var(--color-success)'
                              : receipt.status === 'CANCELLED'
                                ? 'var(--color-danger)'
                                : 'var(--color-warning)',
                        }}
                      >
                        {receipt.status === 'CONFIRMED'
                          ? 'Da xac nhan'
                          : receipt.status === 'CANCELLED'
                            ? 'Da huy'
                            : 'Dang nhap'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {receipt.status === 'DRAFT' ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => void confirmReceipt(receipt)}>
                              <CheckCircle2 size={14} />
                              Xac nhan
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => void cancelDraft(receipt.id)}>
                              <Trash2 size={14} />
                              Huy
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Hoan tat</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={openCreate} onOpenChange={(open) => {
        setOpenCreate(open);
        if (!open) {
          resetDraft();
        }
      }}>
        <DialogContent className="w-[min(860px,95vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>{mode === 'import' ? 'Tao phieu nhap kho' : 'Tao phieu xuat kho'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {mode === 'import' ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Nha cung cap</p>
                <Select value={supplierId} onValueChange={(value) => setSupplierId(value ?? '')}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Chon nha cung cap" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.maNcc} - {supplier.tenNcc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Ly do xuat</p>
                <Select value={exportReason} onValueChange={(value) => setExportReason(value as ExportReason)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPORT_REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_130px_auto]">
              <Select value={selectedProductId} onValueChange={(value) => setSelectedProductId(value ?? '')}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Chon san pham" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.code} - {product.name} ({mode === 'export' ? `Ton: ${product.stock}` : formatVND(product.costPrice)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                inputMode="numeric"
                value={lineQuantity}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setLineQuantity(value);
                  }
                }}
                placeholder="So luong"
              />
              <Button variant="outline" onClick={addLine}>Them dong</Button>
            </div>

            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chu (tuy chon)" />

            <div className="max-h-[260px] overflow-auto rounded-[8px] border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[#F7F6F4] text-xs uppercase text-[var(--color-text-muted)]">
                    <th className="px-3 py-2 text-left">San pham</th>
                    <th className="px-3 py-2 text-left">So luong</th>
                    <th className="px-3 py-2 text-right">Xoa</th>
                  </tr>
                </thead>
                <tbody>
                  {draftLines.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-[var(--color-text-muted)]">Chua co dong hang nao</td>
                    </tr>
                  ) : (
                    draftLines.map((line) => (
                      <tr key={line.productId} className="border-b border-[var(--color-border)] last:border-b-0">
                        <td className="px-3 py-2">
                          {line.productCode} - {line.productName}
                        </td>
                        <td className="px-3 py-2">{line.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDraftLines((prev) => prev.filter((item) => item.productId !== line.productId))}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Huy</Button>
            <Button onClick={() => void createReceipt()}>{mode === 'import' ? 'Luu phieu nhap' : 'Luu phieu xuat'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

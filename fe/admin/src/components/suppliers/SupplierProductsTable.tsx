import type { SupplierProductResponse } from '@/lib/productSupplierApi';

interface SupplierProductsTableProps {
  products: SupplierProductResponse[];
  loading?: boolean;
}

export function SupplierProductsTable({ products, loading = false }: SupplierProductsTableProps) {
  const formatCurrency = (value: number | undefined) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải...</p>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        This supplier has no product records yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Product Code</th>
            <th className="px-3 py-2">Product Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Current Price</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Purchase Orders</th>
            <th className="px-3 py-2">Total Purchased Qty</th>
            <th className="px-3 py-2">Average Purchase Price</th>
            <th className="px-3 py-2">Last Purchase</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
        {products.map((product) => (
          <tr key={product.productId}>
            <td className="px-3 py-2 font-medium">{product.productCode}</td>
            <td className="px-3 py-2">{product.productName}</td>
            <td className="px-3 py-2">{product.categoryName}</td>
            <td className="px-3 py-2">{formatCurrency(product.currentPrice)}</td>
            <td className="px-3 py-2">
              <span className={product.currentStock > 0 ? 'text-green-700' : 'text-red-700'}>{product.currentStock}</span>
            </td>
            <td className="px-3 py-2">{product.totalPurchaseOrders}</td>
            <td className="px-3 py-2 font-medium">{product.totalQuantityPurchased}</td>
            <td className="px-3 py-2">{formatCurrency(product.avgPurchasePrice)}</td>
            <td className="px-3 py-2 text-xs text-gray-600">
                {product.lastPurchaseDate ? (
                  <>
                    <div>{new Date(product.lastPurchaseDate).toLocaleDateString('vi-VN')}</div>
                    <div>{formatCurrency(product.lastPurchasePrice)}</div>
                  </>
                ) : (
                  <span>Not available</span>
                )}
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}

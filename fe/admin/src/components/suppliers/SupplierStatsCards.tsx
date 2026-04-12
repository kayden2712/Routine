import type { SupplierProductStatsResponse } from '@/lib/productSupplierApi';

interface SupplierStatsCardsProps {
  stats: SupplierProductStatsResponse;
}

export function SupplierStatsCards({ stats }: SupplierStatsCardsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
    },
    {
      title: 'Total Purchase Orders',
      value: stats.totalPurchaseOrders,
    },
    {
      title: 'Total Purchased Quantity',
      value: stats.totalQuantityPurchased.toLocaleString('vi-VN'),
    },
    {
      title: 'Total Purchase Value',
      value: formatCurrency(stats.totalPurchaseValue),
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(stats.avgOrderValue),
    },
    {
      title: 'Active vs Inactive Products',
      value: `${stats.activeProducts} / ${stats.totalProducts}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => (
        <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

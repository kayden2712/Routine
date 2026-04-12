interface StatusBadgeProps {
  status: string;
  variant: 'order' | 'product' | 'stock';
}

function orderBadge(status: string) {
  const normalized = status.toLowerCase();
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Cho xu ly', bg: 'var(--color-accent-light)', color: 'var(--color-accent)' },
    confirmed: { label: 'Da xac nhan', bg: '#E8F3FF', color: '#1D4ED8' },
    packing: { label: 'Chuan bi hang', bg: '#EEF2FF', color: '#4F46E5' },
    ready_to_ship: { label: 'San sang giao', bg: '#ECFEFF', color: '#0E7490' },
    in_transit: { label: 'Dang giao', bg: '#E0F2FE', color: '#0369A1' },
    out_for_delivery: { label: 'Dang phat', bg: '#DBEAFE', color: '#1E40AF' },
    delivered: { label: 'Da giao', bg: '#DCFCE7', color: '#166534' },
    completed: { label: 'Hoan thanh', bg: '#DCFCE7', color: '#15803D' },
    paid: { label: 'Da thanh toan', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    cancel_requested: { label: 'Yeu cau huy', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    cancelled: { label: 'Da huy', bg: '#F3F2F0', color: 'var(--color-text-secondary)' },
    return_requested: { label: 'Yeu cau hoan', bg: '#FFF7ED', color: '#C2410C' },
    return_approved: { label: 'Da duyet hoan', bg: '#FEF3C7', color: '#92400E' },
    return_rejected: { label: 'Tu choi hoan', bg: '#FEE2E2', color: '#991B1B' },
    return_received: { label: 'Da nhan hang hoan', bg: '#F5F3FF', color: '#5B21B6' },
    refund_pending: { label: 'Cho hoan tien', bg: '#EFF6FF', color: '#1D4ED8' },
    refunded: { label: 'Da hoan tien', bg: '#ECFDF5', color: '#047857' },
    failed_delivery: { label: 'Giao that bai', bg: '#FFE4E6', color: '#BE123C' },
  };

  return map[normalized] ?? {
    label: 'Da huy',
    bg: '#F3F2F0',
    color: 'var(--color-text-secondary)',
  };
}

function productBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active') {
    return {
      label: 'Dang ban',
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
    };
  }

  if (normalized === 'out_of_stock') {
    return {
      label: 'Het hang',
      bg: 'var(--color-error-bg)',
      color: 'var(--color-error)',
    };
  }

  return {
    label: 'Tam an',
    bg: '#F3F2F0',
    color: 'var(--color-text-secondary)',
  };
}

function stockBadge(status: string) {
  const stock = Number(status);
  if (!Number.isFinite(stock) || stock <= 0) {
    return {
      label: 'Het hang',
      bg: 'var(--color-error-bg)',
      color: 'var(--color-error)',
    };
  }

  if (stock <= 10) {
    return {
      label: 'Sap het',
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
    };
  }

  return {
    label: 'Con hang',
    bg: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  };
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const config =
    variant === 'order' ? orderBadge(status) : variant === 'product' ? productBadge(status) : stockBadge(status);

  return (
    <span
      className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

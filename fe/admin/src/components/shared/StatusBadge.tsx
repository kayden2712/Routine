interface StatusBadgeProps {
  status: string;
  variant: 'order' | 'product' | 'stock';
}

function orderBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'paid') {
    return {
      label: 'Da thanh toan',
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
    };
  }

  if (normalized === 'pending') {
    return {
      label: 'Cho xu ly',
      bg: 'var(--color-accent-light)',
      color: 'var(--color-accent)',
    };
  }

  return {
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

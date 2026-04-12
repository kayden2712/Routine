import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface KPICardProps {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export function KPICard({ label, value, delta, icon: Icon, iconBg, iconColor }: KPICardProps) {
  return (
    <article className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[13px] text-[var(--color-text-secondary)]">{label}</p>
          <p className="font-[var(--font-display)] text-[28px] font-bold leading-none text-[var(--color-text-primary)]">
            {value}
          </p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>

      {delta ? (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: delta.positive ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
            color: delta.positive ? 'var(--color-success)' : 'var(--color-error)',
          }}
        >
          {delta.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta.value}
        </span>
      ) : null}
    </article>
  );
}

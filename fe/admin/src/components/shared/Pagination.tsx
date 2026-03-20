import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

function getVisiblePages(current: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (current >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [current - 2, current - 1, current, current + 1, current + 2];
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);
  const visiblePages = getVisiblePages(safePage, totalPages);
  const showLeading = visiblePages[0] > 1;
  const showTrailing = visiblePages[visiblePages.length - 1] < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Hien thi {start}-{end} / {total} ket qua
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Trang truoc"
        >
          <ChevronLeft size={14} />
        </Button>

        {showLeading ? (
          <>
            <Button variant="outline" size="sm" onClick={() => onChange(1)}>
              1
            </Button>
            <span className="px-1 text-[var(--color-text-muted)]">
              <MoreHorizontal size={14} />
            </span>
          </>
        ) : null}

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onChange(pageNumber)}
            className={cn(
              'inline-flex h-7 min-w-7 items-center justify-center rounded-[8px] border border-[var(--color-border)] px-2 text-sm font-medium transition-colors',
              pageNumber === safePage
                ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                : 'bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]',
            )}
          >
            {pageNumber}
          </button>
        ))}

        {showTrailing ? (
          <>
            <span className="px-1 text-[var(--color-text-muted)]">
              <MoreHorizontal size={14} />
            </span>
            <Button variant="outline" size="sm" onClick={() => onChange(totalPages)}>
              {totalPages}
            </Button>
          </>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

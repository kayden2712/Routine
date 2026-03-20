import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterBar?: ReactNode;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: EmptyStateConfig;
  enableSelection?: boolean;
  bulkActions?: ReactNode | ((selectedRows: T[]) => ReactNode);
  pageSize?: number;
}

function getCellValue<T extends object>(row: T, key: string): unknown {
  if (!(key in row)) {
    return undefined;
  }
  return row[key as keyof T];
}

function resolveBulkActions<T>(
  bulkActions: DataTableProps<T>['bulkActions'],
  selectedRows: T[],
): ReactNode {
  if (typeof bulkActions === 'function') {
    return bulkActions(selectedRows);
  }
  return bulkActions ?? null;
}

export function DataTable<T extends object>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Tim kiem...',
  filterBar,
  onRowClick,
  isLoading = false,
  emptyState,
  enableSelection = false,
  bulkActions,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchText, setSearchText] = useState('');
  const [selection, setSelection] = useState<Record<string, boolean>>({});

  const filteredData = useMemo(() => {
    if (!searchKey || !searchText.trim()) {
      return data;
    }

    const normalized = searchText.trim().toLowerCase();
    return data.filter((item) => {
      const value = getCellValue(item, searchKey);
      if (value == null) {
        return false;
      }
      return String(value).toLowerCase().includes(normalized);
    });
  }, [data, searchKey, searchText]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection: selection,
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: (updater) => {
      setSelection((prev) =>
        typeof updater === 'function'
          ? (updater(prev) as Record<string, boolean>)
          : (updater as Record<string, boolean>),
      );
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row: Row<T>) => row.original);
  const selectedCount = selectedRows.length;
  const pagination = table.getState().pagination;

  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-3">
        {searchKey ? (
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 min-w-[220px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
        ) : null}
        {filterBar}
      </div>

      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          selectedCount > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-accent-light)]">
          <div className="flex h-12 items-center justify-between px-4">
            <p className="text-sm font-medium text-[var(--color-accent)]">{selectedCount} da chon</p>
            <div className="flex items-center gap-2">{resolveBulkActions(bulkActions, selectedRows)}</div>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-[#F7F6F4]">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-2 border-[var(--color-border)] hover:bg-transparent">
              {enableSelection ? (
                <TableHead className="h-[52px] w-12 px-3 text-center">
                  <input
                    type="checkbox"
                    aria-label="Chon tat ca"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                    className="h-4 w-4 cursor-pointer rounded border-[var(--color-border-strong)]"
                  />
                </TableHead>
              ) : null}
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortState = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-[52px] px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]',
                      canSort && 'cursor-pointer select-none',
                    )}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort ? (
                        sortState === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : sortState === 'desc' ? (
                          <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )
                      ) : null}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className="h-[52px]">
                {enableSelection ? (
                  <TableCell className="h-[52px] px-3">
                    <div className="h-4 w-4 animate-pulse rounded bg-[var(--color-border)]" />
                  </TableCell>
                ) : null}
                {columns.map((_, cellIndex) => (
                  <TableCell key={`skeleton-cell-${cellIndex}`} className="h-[52px] px-3">
                    <div className="h-4 w-full animate-pulse rounded bg-[var(--color-border)]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="h-[52px] border-b border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[#FAFAF9]"
                onClick={() => onRowClick?.(row.original)}
              >
                {enableSelection ? (
                  <TableCell className="h-[52px] px-3 text-center" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="Chon dong"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                      className="h-4 w-4 cursor-pointer rounded border-[var(--color-border-strong)]"
                    />
                  </TableCell>
                ) : null}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="h-[52px] px-3 text-[14px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + (enableSelection ? 1 : 0)} className="p-0">
                <EmptyState
                  icon={emptyState?.icon ?? ArrowUpDown}
                  title={emptyState?.title ?? 'Khong tim thay du lieu'}
                  description={emptyState?.description ?? 'Thu dieu chinh bo loc hoac tu khoa tim kiem.'}
                  action={emptyState?.action}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        page={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        total={filteredData.length}
        onChange={(page: number) => table.setPageIndex(page - 1)}
      />
    </div>
  );
}

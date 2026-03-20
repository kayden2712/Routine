import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: ReactNode;
}

const pageMeta: Record<string, { title: string; breadcrumb?: string[] }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: ['Tong quan'] },
  '/pos': { title: 'Tao hoa don', breadcrumb: ['Ban hang'] },
  '/products': { title: 'San pham', breadcrumb: ['Quan ly hang hoa'] },
  '/customers': { title: 'Khach hang', breadcrumb: ['Quan ly khach hang'] },
  '/inventory': { title: 'Kho hang', breadcrumb: ['Van hanh'] },
  '/staff': { title: 'Nhan vien', breadcrumb: ['Van hanh'] },
  '/reports': { title: 'Bao cao', breadcrumb: ['Thong ke'] },
  '/settings': { title: 'Cai dat', breadcrumb: ['He thong'] },
  '/invoices': { title: 'Hoa don', breadcrumb: ['Tai chinh'] },
};

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? { title: 'Routine' };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="ml-[240px] flex h-screen min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} breadcrumb={meta.breadcrumb} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

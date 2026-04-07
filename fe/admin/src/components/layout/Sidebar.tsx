import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  Warehouse,
  Gift,
  Truck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import routineLogo from '@/assets/routine-logo-word.png';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const roleSections: Record<UserRole, NavSection[]> = {
  manager: [
    {
      label: 'Tong quan',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Tao hoa don', to: '/pos', icon: ShoppingCart },
      ],
    },
    {
      label: 'Van hanh',
      items: [
        { label: 'San pham', to: '/products', icon: Package },
        { label: 'Khach hang', to: '/customers', icon: Users },
        { label: 'Khuyen mai', to: '/promotions', icon: Gift },
        { label: 'Nha cung cap', to: '/suppliers', icon: Truck },
        { label: 'Don hang online', to: '/online-orders', icon: Receipt },
        { label: 'Kho hang', to: '/inventory', icon: Warehouse },
        { label: 'Phieu nhap kho', to: '/inventory/import-receipts', icon: Receipt },
        { label: 'Phieu xuat kho', to: '/inventory/export-receipts', icon: Receipt },
        { label: 'Nhan vien', to: '/staff', icon: UserCog },
      ],
    },
    {
      label: 'He thong',
      items: [
        { label: 'Bao cao', to: '/reports', icon: BarChart3 },
        { label: 'Cai dat', to: '/settings', icon: Settings },
      ],
    },
  ],
  sales: [
    {
      label: 'Ban hang',
      items: [
        { label: 'Tao hoa don', to: '/pos', icon: ShoppingCart },
        { label: 'San pham', to: '/products', icon: Package },
        { label: 'Khach hang', to: '/customers', icon: Users },
        { label: 'Khuyen mai', to: '/promotions', icon: Gift },
        { label: 'Cai dat', to: '/settings', icon: Settings },
      ],
    },
  ],
  warehouse: [
    {
      label: 'Kho',
      items: [
        { label: 'Kho hang', to: '/inventory', icon: Warehouse },
        { label: 'Phieu nhap kho', to: '/inventory/import-receipts', icon: Receipt },
        { label: 'Phieu xuat kho', to: '/inventory/export-receipts', icon: Receipt },
        { label: 'San pham', to: '/products', icon: Package },
        { label: 'Cai dat', to: '/settings', icon: Settings },
      ],
    },
  ],
  accountant: [
    {
      label: 'Tai chinh',
      items: [
        { label: 'Bao cao', to: '/reports', icon: BarChart3 },
        { label: 'Hoa don', to: '/invoices', icon: Receipt },
        { label: 'Don hang online', to: '/online-orders', icon: Receipt },
        { label: 'Cai dat', to: '/settings', icon: Settings },
      ],
    },
  ],
};

const roleLabelMap: Record<UserRole, string> = {
  manager: 'Quan ly',
  sales: 'Ban hang',
  warehouse: 'Kho',
  accountant: 'Ke toan',
};

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-screen w-[240px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="px-6 py-5">
        <img src={routineLogo} alt="Routine" className="h-9 w-auto" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {roleSections[user.role].map((section) => (
          <section key={section.label} className="mb-4">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {section.label}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'mx-2 flex h-11 items-center gap-[10px] rounded-[8px] px-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors',
                      'hover:bg-[#F7F6F4] hover:text-[var(--color-text-primary)]',
                      isActive &&
                        'bg-[var(--color-accent-light)] text-[var(--color-accent)] [&_svg]:text-[var(--color-accent)]',
                    )
                  }
                >
                  <item.icon size={18} className="text-[var(--color-text-secondary)]" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </section>
        ))}
      </div>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <div className="mb-2 flex items-center gap-3 rounded-[10px] bg-[var(--color-bg)] p-2.5">
          <Avatar>
            <AvatarFallback className="font-medium text-[var(--color-text-primary)]">
              {user.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{user.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{roleLabelMap[user.role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-10 w-full justify-start gap-2 text-[var(--color-text-secondary)]"
          onClick={logout}
        >
          <LogOut size={16} />
          Dang xuat
        </Button>
      </div>
    </aside>
  );
}

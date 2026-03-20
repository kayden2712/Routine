import { Bell, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';

interface TopbarProps {
  title: string;
  breadcrumb?: string[];
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const notificationCount = 3;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:px-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 ? (
          <p className="mb-0.5 text-xs text-[var(--color-text-muted)]">{breadcrumb.join(' / ')}</p>
        ) : null}
        <h1 className="font-[var(--font-display)] text-[20px] font-semibold leading-none text-[var(--color-text-primary)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
          aria-label="Thong bao"
        >
          <Bell size={18} />
          {notificationCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-error)]" />
          ) : null}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-10 items-center gap-2 rounded-full px-2 text-[var(--color-text-primary)]"
              />
            }
          >
            <Avatar>
              <AvatarFallback>{user?.avatarInitials ?? 'RU'}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:block">{user?.name ?? 'Nguoi dung'}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user?.email ?? 'routine@example.com'}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={16} />
              Ho so
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut size={16} />
              Dang xuat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

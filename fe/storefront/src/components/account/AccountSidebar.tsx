import type { LucideIcon } from 'lucide-react'
import { LogOut } from 'lucide-react'
import type { AccountTab } from '@/types/account'

interface AccountSidebarProps {
  initials: string
  email: string
  navItems: Array<{ id: AccountTab; label: string; icon: LucideIcon }>
  activeTab: AccountTab
  onTabChange: (tab: AccountTab) => void
  onLogout: () => void
}

export function AccountSidebar({ initials, email, navItems, activeTab, onTabChange, onLogout }: AccountSidebarProps) {
  return (
    <aside className="rounded-[16px] border border-[#E8E3D9] bg-white p-4 text-[#2A2A28] shadow-[0_8px_24px_rgba(19,22,28,0.05)]">
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E2DDD2] bg-[#F6F3EE] text-sm font-semibold text-[#31302C]">
          {initials}
        </div>
        <p className="mt-3 max-w-full truncate text-[13px] text-[#5F5B52]">{email}</p>
      </div>

      <div className="my-4 h-px bg-[#ECE7DC]" />

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const active = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex h-10 w-full items-center gap-2 rounded-[10px] px-3 text-sm transition-colors ${
                active
                  ? 'bg-[#F2EEE6] text-[#1F1E1A]'
                  : 'text-[#555047] hover:bg-[#F7F3EC] hover:text-[#1F1E1A]'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="my-4 h-px bg-[#ECE7DC]" />

      <button
        type="button"
        onClick={onLogout}
        className="flex h-10 w-full items-center gap-2 rounded-[10px] px-3 text-sm text-[#555047] transition-colors hover:bg-[#F7F3EC] hover:text-[#1F1E1A]"
      >
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </button>
    </aside>
  )
}

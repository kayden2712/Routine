import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calculator,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import routineLogo from '@/assets/routine-logo-word.png';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

const roleHome: Record<UserRole, string> = {
  manager: '/dashboard',
  sales: '/pos',
  warehouse: '/inventory',
  accountant: '/reports',
};

interface RoleOption {
  role: UserRole;
  label: string;
  icon: LucideIcon;
}

const roleOptions: RoleOption[] = [
  { role: 'manager', label: 'Quan ly', icon: LayoutDashboard },
  { role: 'sales', label: 'Nhan vien ban hang', icon: ShoppingCart },
  { role: 'warehouse', label: 'Nhan vien kho', icon: Warehouse },
  { role: 'accountant', label: 'Ke toan', icon: Calculator },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login, authError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    document.title = 'Dang nhap | Routine';
  }, []);

  const home = useMemo(() => (user ? roleHome[user.role] : '/dashboard'), [user]);

  if (isAuthenticated && user) {
    return <Navigate to={home} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const safeEmail = email.trim();
    const safePassword = password.trim();

    if (!safeEmail || !safePassword) {
      setHasError(true);
      return;
    }

    setHasError(false);
    setLoading(true);
    try {
      await login(safeEmail, safePassword, role);
      navigate(roleHome[role], { replace: true });
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <section className="flex w-[45%] flex-col justify-between bg-[#1A1A18] p-16">
        <div>
          <img src={routineLogo} alt="Routine" className="h-10 w-auto" />
          <p className="mt-2 text-[13px] text-[#6B6863]">Hệ thống quản lý của hàng</p>
        </div>

        <div className="flex items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.15">
              <path d="M60 72H140" />
              <path d="M100 72V60C100 52 107 46 114 46" />
              <path d="M72 72L60 95H84L72 72Z" />
              <path d="M100 72L88 108H112L100 72Z" />
              <path d="M128 72L116 102H140L128 72Z" />
              <path d="M60 95H84" />
              <path d="M88 108H112" />
              <path d="M116 102H140" />
            </g>
          </svg>
        </div>

        <p className="text-[14px] italic text-[#6B6863]">Bán hàng thông minh - Quản lý hiệu quả</p>
      </section>

      <section className="flex w-[55%] items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-[400px]">
          <header className="mb-10">
            <h2 className="font-[var(--font-display)] text-[28px] font-semibold text-[var(--color-text-primary)]">Đăng nhập</h2>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">Nhập thông tin truy cập hệ thống</p>
          </header>

          <form noValidate onSubmit={submit} className="space-y-4">
            <div>
              <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-muted)]">Vai trò của bạn</p>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((option) => {
                  const active = role === option.role;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setRole(option.role)}
                      className={cn(
                        'flex h-11 items-center gap-2 rounded-[8px] border-[1.5px] px-4 text-left text-[14px] font-medium transition-all duration-150 ease-in',
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                          : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]',
                      )}
                    >
                      <Icon size={16} className={active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} />
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-primary)]">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nhanvien@routine.vn"
                  className="h-11 w-full rounded-[8px] border-[1.5px] border-[var(--color-border)] bg-white pl-10 pr-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-all duration-150 focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-primary)]">
                Mat khau
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-[8px] border-[1.5px] border-[var(--color-border)] bg-white pl-10 pr-10 text-[14px] text-[var(--color-text-primary)] outline-none transition-all duration-150 focus:border-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {hasError ? (
              <div className="animate-[slideFadeIn_0.2s_ease] rounded-[8px] border border-[#FECACA] bg-[var(--color-error-bg)] px-[14px] py-[10px] text-[14px] text-[var(--color-error)]">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{authError || 'Email hoặc mật khẩu không đúng'}</span>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--color-accent)] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[var(--color-accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="mt-6 border-t border-[var(--color-border)] pt-6 text-center">
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Quản lý nhân viên được thực hiện trong mục Nhan vien sau khi đăng nhập.
              </p>
            </div>
          </form>

          <style>{`
            @keyframes slideFadeIn {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </section>
    </div>
  );
}

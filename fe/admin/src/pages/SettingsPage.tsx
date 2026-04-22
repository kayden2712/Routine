import { useMemo, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePasswordApi } from '@/lib/backendApi';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/authStore';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isStrongPassword =
    newPassword.length >= 8
    && /[A-Z]/.test(newPassword)
    && /[a-z]/.test(newPassword)
    && /\d/.test(newPassword)
    && /[^A-Za-z0-9]/.test(newPassword);

  const passwordHint = useMemo(() => {
    if (newPassword.length === 0) return 'Mật khẩu mới tối thiểu 8 ký tự.';
    if (newPassword.length < 8) return 'Mật khẩu mới chưa đủ độ dài tối thiểu.';
    if (!isStrongPassword) return 'Cần đủ chữ hoa, chữ thường, số và ký tự đặc biệt.';
    return 'Mật khẩu mới hợp lệ.';
  }, [isStrongPassword, newPassword]);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!isStrongPassword) {
      toast.error('Mật khẩu mới phải đủ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setIsSaving(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Đổi mật khẩu thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đổi mật khẩu thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="font-[var(--font-display)] text-[22px] font-semibold text-[var(--color-text-primary)]">Bảo mật tài khoản</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Tài khoản: {user?.email ?? 'N/A'}</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">{passwordHint}</p>

          <div className="pt-1">
            <Button className="gap-2" onClick={handleChangePassword} disabled={isSaving}>
              <KeyRound size={16} />
              {isSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

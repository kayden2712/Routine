import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AtSign,
  Calculator,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  ShoppingCart,
  ShieldCheck,
  UserCircle,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RegisterFormData {
  // Step 1
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  // Step 2
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  address: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  // Step 3
  role: UserRole | null;
  termsAccepted: boolean;
}

interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
  permissions: string[];
}

type ErrorRecord = Partial<Record<keyof RegisterFormData, string>>;

// ============================================================================
// ROLE OPTIONS
// ============================================================================

const roleOptions: RoleOption[] = [
  {
    id: 'manager',
    label: 'Quản lý',
    description: 'Toàn quyền truy cập hệ thống',
    icon: LayoutDashboard,
    permissions: ['Xem báo cáo', 'Quản lý nhân viên', 'Quản lý sản phẩm', 'Tất cả tính năng'],
  },
  {
    id: 'sales',
    label: 'Nhân viên bán hàng',
    description: 'Tạo hóa đơn và quản lý khách hàng',
    icon: ShoppingCart,
    permissions: ['Tạo hóa đơn', 'Xem sản phẩm', 'Quản lý khách hàng'],
  },
  {
    id: 'warehouse',
    label: 'Nhân viên kho',
    description: 'Quản lý hàng hóa và tồn kho',
    icon: Warehouse,
    permissions: ['Nhập/xuất hàng', 'Xem tồn kho', 'Tạo phiếu nhập'],
  },
  {
    id: 'accountant',
    label: 'Kế toán',
    description: 'Báo cáo tài chính và hóa đơn',
    icon: Calculator,
    permissions: ['Xem báo cáo', 'Xuất dữ liệu', 'Xem hóa đơn'],
  },
];

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { label: 'Thông tin tài khoản', icon: KeyRound },
    { label: 'Thông tin cá nhân', icon: UserCircle },
    { label: 'Vai trò & xác nhận', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index}>
            <div className="flex items-center gap-3">
              {/* Step Dot */}
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150',
                  isCompleted && 'bg-[#16A34A]',
                  isActive && 'bg-[#2D6BE4]',
                  !isActive && !isCompleted && 'border border-[#3A3A37] bg-[#2E2E2B]',
                )}
              >
                {isCompleted ? (
                  <Check size={12} className="text-white" />
                ) : isActive ? (
                  <span className="text-[11px] font-semibold text-white">{index + 1}</span>
                ) : (
                  <span className="text-[11px] text-[#6B6863]">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-[13px] transition-all duration-150',
                  isActive ? 'font-medium text-white' : 'text-[#6B6863]',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="ml-3 mt-0 h-5 border-l border-dashed border-[#3A3A37]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// BRAND PANEL COMPONENT
// ============================================================================

function BrandPanel({ currentStep }: StepIndicatorProps) {
  return (
    <section className="fixed left-0 top-0 flex h-screen w-[42%] flex-col justify-between bg-[#1A1A18] p-16">
      <div>
        <h1 className="font-[var(--font-display)] text-[24px] font-bold tracking-[0.12em] text-white">ROUTINE</h1>
        <p className="mt-2 text-[13px] text-[#6B6863]">Hệ thống quản lý cửa hàng</p>
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

      <div className="space-y-10">
        <StepIndicator currentStep={currentStep} />
        <p className="text-[14px] italic text-[#6B6863]">Bán hàng thông minh - quản lý hiệu quả</p>
      </div>
    </section>
  );
}

// ============================================================================
// STEP 1 - ACCOUNT INFORMATION
// ============================================================================

interface Step1Props {
  formData: RegisterFormData;
  errors: ErrorRecord;
  onChange: (field: keyof RegisterFormData, value: string) => void;
  onFieldBlur?: (field: keyof RegisterFormData) => void;
}

function Step1({ formData, errors, onChange, onFieldBlur }: Step1Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordScore = (() => {
    let score = 0;
    if (formData.password.length >= 8) score++;
    if (/[A-Z]/.test(formData.password)) score++;
    if (/[0-9]/.test(formData.password)) score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) score++;
    return score;
  })();

  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.07em] text-[#6B6863]">Thông tin đăng nhập</p>

        {/* Email */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
            Email <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A09D99]" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              onBlur={() => onFieldBlur?.('email')}
              placeholder="nhanvien@routine.vn"
              className={cn(
                'h-11 w-full rounded-[8px] border-[1.5px] bg-white pl-10 pr-3 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                errors.email ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
              )}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.email}</p>}
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
            Tên đăng nhập <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <AtSign size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A09D99]" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => onChange('username', e.target.value)}
              onBlur={() => onFieldBlur?.('username')}
              placeholder="vd: tranducanh"
              className={cn(
                'h-11 w-full rounded-[8px] border-[1.5px] bg-white pl-10 pr-3 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                errors.username ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
              )}
            />
          </div>
          {errors.username ? (
            <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.username}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-[#6B6863]">Dùng để đăng nhập, không thể thay đổi sau</p>
          )}
        </div>

        {/* Password & Confirm Password Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Password */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
              Mật khẩu <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A09D99]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => onChange('password', e.target.value)}
                onBlur={() => onFieldBlur?.('password')}
                placeholder="Ít nhất 8 ký tự"
                className={cn(
                  'h-11 w-full rounded-[8px] border-[1.5px] bg-white pl-10 pr-10 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                  errors.password ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A09D99]"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.password}</p>}

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-[3px] flex-1 rounded-[2px] transition-all duration-200',
                        i < passwordScore
                          ? passwordScore === 1
                            ? 'bg-[#DC2626]'
                            : passwordScore === 2
                              ? 'bg-[#D97706]'
                              : passwordScore === 3
                                ? 'bg-[#2D6BE4]'
                                : 'bg-[#16A34A]'
                          : 'bg-[#E8E6E3]',
                      )}
                    />
                  ))}
                </div>
                <p
                  className={cn(
                    'text-[11px] font-medium',
                    passwordScore === 1
                      ? 'text-[#DC2626]'
                      : passwordScore === 2
                        ? 'text-[#D97706]'
                        : passwordScore === 3
                          ? 'text-[#2D6BE4]'
                          : 'text-[#16A34A]',
                  )}
                >
                  {passwordScore === 0 && 'Nhập mật khẩu'}
                  {passwordScore === 1 && 'Rất yếu'}
                  {passwordScore === 2 && 'Yếu'}
                  {passwordScore === 3 && 'Trung bình'}
                  {passwordScore === 4 && 'Mạnh'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
              Xác nhận mật khẩu <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A09D99]" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => onChange('confirmPassword', e.target.value)}
                onBlur={() => onFieldBlur?.('confirmPassword')}
                placeholder="Nhập lại mật khẩu"
                className={cn(
                  'h-11 w-full rounded-[8px] border-[1.5px] bg-white pl-10 pr-10 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                  errors.confirmPassword ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A09D99]"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.confirmPassword}</p>}

            {/* Requirement Checklist */}
            {formData.confirmPassword && (
              <div className="mt-2 space-y-1.5">
                <RequirementItem
                  label="Mật khẩu khớp nhau"
                  met={passwordsMatch}
                />
                <RequirementItem label="Ít nhất 8 ký tự" met={formData.password.length >= 8} />
                <RequirementItem
                  label="Có ký tự đặc biệt"
                  met={/[^A-Za-z0-9]/.test(formData.password)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RequirementItemProps {
  label: string;
  met: boolean;
}

function RequirementItem({ label, met }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full transition-all duration-150',
          met ? 'bg-[#16A34A]' : 'bg-[#E8E6E3]',
        )}
      />
      <span className="text-[11px] text-[#6B6863]">{label}</span>
    </div>
  );
}

// ============================================================================
// STEP 2 - PERSONAL INFORMATION
// ============================================================================

interface Step2Props {
  formData: RegisterFormData;
  errors: ErrorRecord;
  onChange: (field: keyof RegisterFormData, value: string | File | null) => void;
  onFieldBlur?: (field: keyof RegisterFormData) => void;
}

function Step2({ formData, errors, onChange, onFieldBlur }: Step2Props) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      onChange('avatarFile', file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        onChange('avatarPreview', preview);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.07em] text-[#6B6863]">Thông tin cá nhân</p>

        {/* Họ & Tên */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
              Họ <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              onBlur={() => onFieldBlur?.('firstName')}
              placeholder="Nguyễn"
              className={cn(
                'h-11 w-full rounded-[8px] border-[1.5px] bg-white px-3 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                errors.firstName ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
              )}
            />
            {errors.firstName && <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.firstName}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
              Tên <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              onBlur={() => onFieldBlur?.('lastName')}
              placeholder="Văn A"
              className={cn(
                'h-11 w-full rounded-[8px] border-[1.5px] bg-white px-3 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                errors.lastName ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
              )}
            />
            {errors.lastName && <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.lastName}</p>}
          </div>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">
            Số điện thoại <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A09D99]" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              onBlur={() => onFieldBlur?.('phone')}
              placeholder="0912 345 678"
              className={cn(
                'h-11 w-full rounded-[8px] border-[1.5px] bg-white pl-10 pr-3 text-[14px] text-[#1A1A18] outline-none transition-all duration-150',
                errors.phone ? 'border-[#DC2626]' : 'border-[#E8E6E3] focus:border-[#2D6BE4]',
              )}
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-[11px] text-[#DC2626]">{errors.phone}</p>}
        </div>

        {/* Birth Date */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">Ngày sinh</label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => onChange('birthDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="h-11 w-full rounded-[8px] border-[1.5px] border-[#E8E6E3] bg-white px-3 text-[14px] text-[#1A1A18] outline-none transition-all duration-150 focus:border-[#2D6BE4]"
          />
          <p className="mt-1.5 text-[11px] text-[#6B6863]">Tuỳ chọn — dùng để tính ngày sinh nhật</p>
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A18]">Địa chỉ</label>
          <textarea
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Số nhà, đường, phường/xã..."
            rows={2}
            className="w-full rounded-[8px] border-[1.5px] border-[#E8E6E3] bg-white px-3 py-2 text-[14px] text-[#1A1A18] outline-none transition-all duration-150 focus:border-[#2D6BE4]"
          />
          <p className="mt-1.5 text-[11px] text-[#6B6863]">Tuỳ chọn</p>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#1A1A18]">Ảnh đại diện</label>
          <div className="mb-2 flex justify-center">
            {formData.avatarPreview ? (
              <img
                src={formData.avatarPreview}
                alt="Avatar preview"
                className="h-[100px] w-[100px] rounded-full border-[1.5px] border-[#E8E6E3] object-cover"
              />
            ) : (
              <label
                htmlFor="avatar-input"
                className="flex h-[100px] w-[100px] cursor-pointer items-center justify-center rounded-[12px] border-2 border-dashed border-[#E8E6E3] bg-white transition-all duration-150 hover:border-[#2D6BE4] hover:bg-[#F7F6F4]"
              >
                <div className="flex flex-col items-center justify-center">
                  <Camera size={24} className="text-[#A09D99]" />
                  <span className="mt-1 text-[12px] text-[#A09D99]">Ảnh đại diện</span>
                </div>
              </label>
            )}
            <input
              id="avatar-input"
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <p className="text-[11px] text-[#6B6863]">Tuỳ chọn</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3 - ROLE & CONFIRMATION
// ============================================================================

interface Step3Props {
  formData: RegisterFormData;
  errors: ErrorRecord;
  onChange: (field: keyof RegisterFormData, value: UserRole | boolean) => void;
  onEditClick: () => void;
}

function Step3({ formData, errors, onChange, onEditClick }: Step3Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.07em] text-[#6B6863]">Vai trò trong hệ thống</p>

        {/* Role Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {roleOptions.map((role) => {
            const isSelected = formData.role === role.id;
            const Icon = role.icon;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onChange('role', role.id)}
                className={cn(
                  'rounded-[10px] border-[1.5px] p-4 text-left transition-all duration-150',
                  isSelected
                    ? 'border-[#2D6BE4] bg-[#EEF3FD]'
                    : 'border-[#E8E6E3] bg-white hover:border-[#D8D4CF]',
                )}
              >
                {/* Header: Icon + Label + Radio */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      isSelected ? 'bg-[#2D6BE4]' : 'bg-[#F7F6F4]',
                    )}>
                      <Icon size={18} className={isSelected ? 'text-white' : 'text-[#6B6863]'} />
                    </div>
                    <span className="text-[14px] font-medium text-[#1A1A18]">{role.label}</span>
                  </div>
                  <div className={cn(
                    'h-5 w-5 rounded-full border-[2px] transition-all duration-150',
                    isSelected ? 'border-[#2D6BE4] bg-[#2D6BE4]' : 'border-[#E8E6E3]',
                  )}>
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-1.5 text-[12px] text-[#6B6863]">{role.description}</p>

                {/* Permissions */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {role.permissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-full border border-[#E8E6E3] bg-[#F7F6F4] px-2 py-0.5 text-[10px] font-medium text-[#6B6863]"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {errors.role && <p className="mb-4 text-[11px] text-[#DC2626]">{errors.role}</p>}

        {/* Review Summary */}
        <div className="mb-6 rounded-[12px] bg-[#F7F6F4] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-[#1A1A18]">Xem lại thông tin</h3>
            <button
              type="button"
              onClick={onEditClick}
              className="flex items-center gap-1.5 text-[12px] text-[#2D6BE4] hover:underline"
            >
              <Pencil size={14} />
              Chỉnh sửa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryItem label="Email" value={formData.email} />
            <SummaryItem label="Tên đăng nhập" value={formData.username} />
            <SummaryItem label="Họ tên" value={`${formData.firstName} ${formData.lastName}`} />
            <SummaryItem label="Số điện thoại" value={formData.phone} />
            <SummaryItem label="Ngày sinh" value={formData.birthDate || '—'} />
            <SummaryItem
              label="Vai trò"
              value={roleOptions.find((r) => r.id === formData.role)?.label || '—'}
            />
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="mb-6 flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={formData.termsAccepted}
            onChange={(e) => onChange('termsAccepted', e.target.checked)}
            className="mt-1 h-5 w-5 cursor-pointer rounded border-[1.5px] border-[#E8E6E3] accent-[#2D6BE4]"
          />
          <label htmlFor="terms" className="cursor-pointer text-[13px] text-[#6B6863]">
            Tôi đồng ý với{' '}
            <a href="#" className="text-[#2D6BE4] hover:underline">
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#" className="text-[#2D6BE4] hover:underline">
              Chính sách bảo mật
            </a>{' '}
            của hệ thống Routine.
          </label>
        </div>

        {errors.termsAccepted && <p className="mb-4 text-[11px] text-[#DC2626]">{errors.termsAccepted}</p>}
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: string;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <p className="text-[11px] text-[#6B6863]">{label}</p>
      <p className="text-[13px] font-medium text-[#1A1A18]">{value}</p>
    </div>
  );
}

// ============================================================================
// MAIN REGISTER PAGE
// ============================================================================

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    address: '',
    avatarFile: null,
    avatarPreview: null,
    role: null,
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<ErrorRecord>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Đăng ký | Routine';
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleFieldChange = (field: keyof RegisterFormData, value: string | File | null | boolean | UserRole) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: ErrorRecord = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 4 ký tự';
    } else if (!/^[a-z0-9_]+$/i.test(formData.username)) {
      newErrors.username = 'Chỉ dùng chữ cái, số và dấu gạch dưới';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    const passwordScore = (() => {
      let score = 0;
      if (formData.password.length >= 8) score++;
      if (/[A-Z]/.test(formData.password)) score++;
      if (/[0-9]/.test(formData.password)) score++;
      if (/[^A-Za-z0-9]/.test(formData.password)) score++;
      return score;
    })();

    if (passwordScore < 2) {
      newErrors.password = 'Mật khẩu không đủ mạnh';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ErrorRecord = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Họ là bắt buộc';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Tên là bắt buộc';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: ErrorRecord = {};

    if (!formData.role) {
      newErrors.role = 'Vui lòng chọn vai trò';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'Bạn phải đồng ý với điều khoản';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (): void => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setErrors({});
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      setErrors({});
    }
  };

  const handleBack = (): void => {
    setStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 2000));

    // Simulate success
    setFormData({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      address: '',
      avatarFile: null,
      avatarPreview: null,
      role: null,
      termsAccepted: false,
    });
    setErrors({});
    setIsLoading(false);

    // Navigate to login with toast message
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">
      <BrandPanel currentStep={step} />

      <section className="ml-[42%] flex min-h-screen w-[58%] flex-col bg-white">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-10">
          <div className="mx-auto max-w-[500px]">
            {/* Header */}
            <header className="mb-8">
              {step === 1 && (
                <>
                  <h2 className="font-[var(--font-display)] text-[28px] font-semibold text-[#1A1A18]">
                    Tạo tài khoản mới
                  </h2>
                  <p className="mt-2 text-[14px] text-[#6B6863]">
                    Bước 1 / 3 — Thiết lập thông tin đăng nhập
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-[var(--font-display)] text-[28px] font-semibold text-[#1A1A18]">
                    Thông tin nhân viên
                  </h2>
                  <p className="mt-2 text-[14px] text-[#6B6863]">
                    Bước 2 / 3 — Nhập thông tin cá nhân
                  </p>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-[var(--font-display)] text-[28px] font-semibold text-[#1A1A18]">
                    Phân vai trò & xác nhận
                  </h2>
                  <p className="mt-2 text-[14px] text-[#6B6863]">
                    Bước 3 / 3 — Chọn quyền truy cập hệ thống
                  </p>
                </>
              )}

              {/* Progress Bar */}
              <div className="mt-6 flex gap-[6px]">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-[3px] flex-1 rounded-[2px] transition-all duration-300',
                      i < step ? 'bg-[#2D6BE4]' : 'bg-[#E8E6E3]',
                    )}
                  />
                ))}
              </div>
            </header>

            {/* Form Content */}
            <form onSubmit={step === 3 ? handleSubmit : undefined}>
              {step === 1 && (
                <Step1
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                />
              )}

              {step === 2 && (
                <Step2
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                />
              )}

              {step === 3 && (
                <Step3
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                  onEditClick={() => {
                    setStep(1);
                    setErrors({});
                  }}
                />
              )}
            </form>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-[#E8E6E3] bg-white px-8 py-6">
          <div className="mx-auto max-w-[500px]">
            <div className="mb-4 flex items-center gap-4">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-[#6B6863] transition-all duration-150 hover:text-[#1A1A18]"
                >
                  ← Quay lại
                </button>
              )}

              <div className="flex-1" />

              {step < 3 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-[8px] bg-[#2D6BE4] px-4 py-2 text-[14px] font-medium text-white transition-all duration-150 hover:bg-[#1E50C0] active:scale-[0.98]"
                >
                  Tiếp tục →
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.termsAccepted || !formData.role}
                  className={cn(
                    'flex h-11 w-full items-center justify-center gap-2 rounded-[8px] text-[14px] font-medium transition-all duration-150',
                    isLoading || !formData.termsAccepted || !formData.role
                      ? 'cursor-not-allowed bg-[#2D6BE4] opacity-40 text-white'
                      : 'bg-[#2D6BE4] text-white hover:bg-[#1E50C0] active:scale-[0.98]',
                  )}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isLoading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div className="border-t border-[#E8E6E3] pt-4 text-center">
              <p className="text-[13px] text-[#6B6863]">
                Đã có tài khoản?{' '}
                <a href="/login" className="font-medium text-[#2D6BE4] hover:underline">
                  Đăng nhập ngay
                </a>
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </section>
    </div>
  );
}

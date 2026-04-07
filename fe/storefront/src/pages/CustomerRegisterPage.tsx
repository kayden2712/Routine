import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import routineLogo from '@/assets/routine-logo-word.png'
import { Button } from '@/components/ui/button'
import { useCustomerAuthStore } from '@/store/customerAuthStore'

export const CustomerRegisterPage = () => {
  const navigate = useNavigate()
  const register = useCustomerAuthStore((state) => state.register)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isValidPhone = (value: string) => /^0\d{9,10}$/.test(value)
  const isStrongPassword = (value: string) =>
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)

  const normalizeAuthError = (raw: string) => {
    if (!raw) {
      return ''
    }

    if (raw.includes('Validation failed')) {
      return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại email, số điện thoại và mật khẩu.'
    }

    if (raw.includes('Invalid email format')) {
      return 'Email không hợp lệ. Ví dụ đúng: tung@gmail.com'
    }

    if (raw.includes('Phone number is already registered')) {
      return 'Số điện thoại này đã được đăng ký.'
    }

    if (raw.includes('Email is already registered')) {
      return 'Email này đã được đăng ký.'
    }

    return raw
  }

  return (
    <section className="flex min-h-[calc(100vh-170px)] items-center justify-center py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/8 bg-[#242422] p-9">
        <div className="flex justify-center text-white">
          <img src={routineLogo} alt="Routine by OZ homeland" className="h-14 w-auto" />
        </div>
        <h1 className="mt-5 text-center text-[22px] font-semibold text-white">Đăng ký</h1>
        <p className="mb-7 mt-2 text-center text-[14px] text-white/50">Tạo tài khoản khách hàng mới</p>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[12px] text-white/35">Đăng ký bằng email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form
          noValidate
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')

            if (!fullName.trim()) {
              setError('Vui lòng nhập họ và tên.')
              return
            }

            if (!isValidEmail(email.trim())) {
              setError('Email không hợp lệ. Ví dụ đúng: tung@gmail.com')
              return
            }

            if (!isValidPhone(phone.trim())) {
              setError('Số điện thoại không hợp lệ (bắt đầu bằng 0, 10-11 số).')
              return
            }

            if (!isStrongPassword(password)) {
              setError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.')
              return
            }

            if (!acceptTerms) {
              setError('Vui lòng đồng ý điều khoản để tiếp tục.')
              return
            }

            const normalizedEmail = email.trim().toLowerCase()
            const normalizedPhone = phone.trim()
            const success = await register(fullName.trim(), normalizedEmail, password, normalizedPhone)
            if (success) {
              navigate('/tai-khoan')
              return
            }

            const latestError = useCustomerAuthStore.getState().authError
            setError(normalizeAuthError(latestError) || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
          }}
        >
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Họ và tên"
              className="h-11 w-full rounded-lg border border-white/30 bg-white/12 pl-10 pr-3 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="ten@gmail.com"
              className="h-11 w-full rounded-lg border border-white/30 bg-white/12 pl-10 pr-3 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
            />
          </div>

          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="So dien thoai"
              className="h-11 w-full rounded-lg border border-white/30 bg-white/12 pl-10 pr-3 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className="h-11 w-full rounded-lg border border-white/30 bg-white/12 pl-10 pr-10 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <p className="text-[12px] text-white/45">
            Mật khẩu phải gồm ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-[12px] text-white/70">
            <p className="text-[13px] font-medium text-white">Điều khoản và bảo mật</p>
            <p className="mt-1 leading-5 text-white/55">
              Khi tạo tài khoản, bạn đồng ý sử dụng dịch vụ theo các nguyên tắc an toàn và minh bạch của Routine.
            </p>

            <div className="mt-3 space-y-2">
              <details className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
                <summary className="cursor-pointer list-none font-medium text-white/80">
                  Điều khoản sử dụng
                </summary>
                <ul className="mt-2 space-y-1 leading-5 text-white/55">
                  <li>• Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
                  <li>• Không sử dụng tài khoản cho mục đích gian lận hoặc gây ảnh hưởng hệ thống.</li>
                  <li>• Routine có thể cập nhật điều khoản khi cần để cải thiện dịch vụ.</li>
                </ul>
              </details>

              <details className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
                <summary className="cursor-pointer list-none font-medium text-white/80">
                  Chính sách bảo mật
                </summary>
                <ul className="mt-2 space-y-1 leading-5 text-white/55">
                  <li>• Chúng tôi chỉ thu thập thông tin cần thiết để tạo và vận hành tài khoản.</li>
                  <li>• Thông tin cá nhân được sử dụng cho đơn hàng, chăm sóc và hỗ trợ khách hàng.</li>
                  <li>• Dữ liệu của bạn được bảo vệ theo các biện pháp kỹ thuật và kiểm soát truy cập phù hợp.</li>
                </ul>
              </details>
            </div>
          </div>

          <label className="mt-1 flex items-start gap-2 text-[12px] text-white/50">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border border-white/30 bg-transparent accent-white"
            />
            <span>
              Tôi đã đọc, hiểu và đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Routine.
            </span>
          </label>

          <Button type="submit" className="h-11 w-full rounded-lg bg-white text-[#1A1A18] hover:bg-white/90">
            Đăng ký
          </Button>

          {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
        </form>

        <p className="mt-5 text-center text-[13px] text-white/50">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-white transition-opacity hover:opacity-90">
            Đăng nhập
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/san-pham" className="inline-flex items-center text-[13px] text-white/40 transition-colors hover:text-white">
            Tiếp tục không cần đăng ký <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

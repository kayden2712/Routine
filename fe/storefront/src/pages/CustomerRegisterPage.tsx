import { useState } from 'react'
import { ArrowRight, Facebook, Lock, Mail, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import routineLogo from '@/assets/routine-logo-word.png'
import { Button } from '@/components/ui/button'
import { useCustomerAuthStore } from '@/store/customerAuthStore'

export const CustomerRegisterPage = () => {
  const navigate = useNavigate()
  const register = useCustomerAuthStore((state) => state.register)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')

  return (
    <section className="flex min-h-[calc(100vh-170px)] items-center justify-center py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/8 bg-[#242422] p-9">
        <div className="flex justify-center text-white">
          <img src={routineLogo} alt="Routine by OZ homeland" className="h-14 w-auto" />
        </div>
        <h1 className="mt-5 text-center text-[22px] font-semibold text-white">Đăng ký</h1>
        <p className="mb-7 mt-2 text-center text-[14px] text-white/50">Tạo tài khoản khách hàng mới</p>

        <div className="space-y-2.5">
          <button
            type="button"
            className="inline-flex h-[42px] w-full items-center justify-center rounded-lg bg-[#1877F2] text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Facebook size={16} className="mr-2" />
            Đăng ký với Facebook
          </button>
          <button
            type="button"
            className="inline-flex h-[42px] w-full items-center justify-center rounded-lg border border-white/12 bg-white/6 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#EA4335]">
              G
            </span>
            Đăng ký với Google
          </button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[12px] text-white/35">hoặc đăng ký bằng email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            if (!acceptTerms) {
              setError('Vui lòng đồng ý điều khoản để tiếp tục.')
              return
            }

            const success = await register(fullName, email, password)
            if (success) {
              navigate('/tai-khoan')
              return
            }

            setError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
          }}
        >
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Họ và tên"
              className="rf-input h-11 w-full rounded-lg pl-10 pr-3 text-sm"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="rf-input h-11 w-full rounded-lg pl-10 pr-3 text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Mật khẩu"
              className="rf-input h-11 w-full rounded-lg pl-10 pr-3 text-sm"
            />
          </div>

          <label className="mt-1 flex items-start gap-2 text-[12px] text-white/50">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border border-white/30 bg-transparent accent-white"
            />
            <span>
              Tôi đồng ý với{' '}
              <a href="#" className="text-white/80 underline underline-offset-2">
                Điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a href="#" className="text-white/80 underline underline-offset-2">
                Chính sách bảo mật
              </a>
              .
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

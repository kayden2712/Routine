import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import routineLogo from '@/assets/routine-logo-word.png'
import { Button } from '@/components/ui/button'
import { useCustomerAuthStore } from '@/store/customerAuthStore'

export const CustomerLoginPage = () => {
  const navigate = useNavigate()
  const login = useCustomerAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="flex min-h-[calc(100vh-170px)] items-center justify-center py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/8 bg-[#242422] p-9">
        <div className="flex justify-center text-white">
          <img src={routineLogo} alt="Routine by OZ homeland" className="h-14 w-auto" />
        </div>
        <h1 className="mt-5 text-center text-[22px] font-semibold text-white">Đăng nhập</h1>
        <p className="mb-7 mt-2 text-center text-[14px] text-white/50">Chào mừng trở lại</p>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[12px] text-white/35">Đăng nhập bằng email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form
          noValidate
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            const success = await login(email, password)
            if (success) {
              navigate('/tai-khoan')
              return
            }

            setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.')
          }}
        >
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
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

          <div className="text-right">
            <button type="button" className="text-[12px] text-white/50 transition-colors hover:text-white">
              Quên mật khẩu?
            </button>
          </div>

          <Button type="submit" className="h-11 w-full rounded-lg bg-white text-[#1A1A18] hover:bg-white/90">
            Đăng nhập
          </Button>

          {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
        </form>

        <p className="mt-5 text-center text-[13px] text-white/50">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-white transition-opacity hover:opacity-90">
            Đăng ký ngay
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

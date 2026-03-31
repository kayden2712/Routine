import { useState } from 'react'
import { ArrowRight, Facebook, Lock, Mail } from 'lucide-react'
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

  return (
    <section className="flex min-h-[calc(100vh-170px)] items-center justify-center py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/8 bg-[#242422] p-9">
        <div className="flex justify-center text-white">
          <img src={routineLogo} alt="Routine by OZ homeland" className="h-14 w-auto" />
        </div>
        <h1 className="mt-5 text-center text-[22px] font-semibold text-white">Đăng nhập</h1>
        <p className="mb-7 mt-2 text-center text-[14px] text-white/50">Chào mừng trở lại</p>

        <div className="space-y-2.5">
          <button
            type="button"
            className="inline-flex h-[42px] w-full items-center justify-center rounded-lg bg-[#1877F2] text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Facebook size={16} className="mr-2" />
            Tiếp tục với Facebook
          </button>
          <button
            type="button"
            className="inline-flex h-[42px] w-full items-center justify-center rounded-lg border border-white/12 bg-white/6 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#EA4335]">
              G
            </span>
            Tiếp tục với Google
          </button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[12px] text-white/35">hoặc đăng nhập bằng email</span>
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
              type="password"
              placeholder="Mật khẩu"
              className="h-11 w-full rounded-lg border border-white/30 bg-white/12 pl-10 pr-3 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
            />
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

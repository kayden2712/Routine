import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { formatVnd } from '@/lib/utils'

export const OrderSuccessPage = () => {
  const location = useLocation()
  const summary = (location.state ?? {}) as {
    orderCode?: string
    subtotal?: number
    shippingFee?: number
    total?: number
  }

  const orderCode = summary.orderCode ?? '#ORD2024001'
  const subtotal = summary.subtotal ?? 739500
  const shippingFee = summary.shippingFee ?? 30000
  const total = summary.total ?? subtotal + shippingFee

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-8 py-20 text-center">
      <style>{`
        @keyframes rf-check-circle {
          0% { stroke-dashoffset: 220; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes rf-check-mark {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes rf-check-fill {
          0% { fill: transparent; }
          100% { fill: #16A34A; }
        }
      `}</style>

      <svg viewBox="0 0 100 100" className="h-24 w-24" role="img" aria-label="Đặt hàng thành công">
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="#FFFFFF"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray="220"
          strokeDashoffset="220"
          style={{ animation: 'rf-check-circle 700ms ease forwards, rf-check-fill 350ms ease 700ms forwards' }}
        />
        <path
          d="M34 50l10 10 22-22"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="48"
          strokeDashoffset="48"
          style={{ animation: 'rf-check-mark 420ms ease 860ms forwards' }}
        />
      </svg>

      <h1 className="mt-6 font-display text-[28px] font-bold text-[var(--text-primary)]">Đặt hàng thành công!</h1>
      <p className="mt-2 text-[14px] text-[var(--text-secondary)]">Mã đơn hàng: {orderCode}</p>

      <div className="mt-7 w-full max-w-[540px] rounded-[12px] bg-[#242422] p-5 text-left">
        <p className="text-xs font-semibold tracking-[0.08em] text-white/45">TÓM TẮT ĐƠN HÀNG</p>
        <div className="mt-4 space-y-2.5 text-sm text-white/70">
          <div className="flex items-center justify-between">
            <span>Tạm tính</span>
            <span>{formatVnd(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Phí giao hàng</span>
            <span>{formatVnd(shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-white">
            <span>Tổng thanh toán</span>
            <span className="font-semibold">{formatVnd(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-[540px] flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="h-11 rounded-[8px] border-white/25 px-6 text-[14px]">
          <Link to="/tai-khoan">Xem đơn hàng</Link>
        </Button>
        <Button asChild className="h-11 rounded-[8px] px-6 text-[14px]">
          <Link to="/san-pham">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    </section>
  )
}


import { useNavigate } from 'react-router-dom'
import { formatVnd } from '@/lib/utils'
import { orderStatusClassMap, orderStatusLabelMap } from '@/lib/orderStatus'
import type { AccountOrder } from '@/types/account'

interface AccountOrderCardProps {
  order: AccountOrder
  onBuyAgain: (order: AccountOrder) => void
}

export function AccountOrderCard({ order, onBuyAgain }: AccountOrderCardProps) {
  const navigate = useNavigate()

  return (
    <article className="overflow-hidden rounded-[16px] border border-[#E8E3D9] bg-white p-4 shadow-[0_4px_14px_rgba(18,20,26,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(18,20,26,0.08)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[28px] font-semibold leading-none text-[#2B2924]">{order.id.replace('#', '')}</p>
          <p className="mt-1 text-sm text-[#7A756C]">Ngày {order.date}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${orderStatusClassMap[order.status]}`}>
          {orderStatusLabelMap[order.status]}
        </span>
        <p className="text-[30px] font-semibold leading-none text-[#2B2924]">{formatVnd(order.total)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {order.items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="h-[66px] w-[66px] overflow-hidden rounded-[10px] border border-[#E5DED1] bg-[#F5F2EC]"
          >
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          </div>
        ))}
        {order.items.length > 3 ? (
          <div className="flex h-[66px] min-w-[66px] items-center justify-center rounded-[10px] border border-[#E5DED1] bg-[#F5F2EC] px-2">
            <span className="text-sm font-semibold text-[#676158]">+{order.items.length - 3} sản phẩm</span>
          </div>
        ) : null}
      </div>

      <div className="my-3 grid grid-cols-1 gap-1.5 border-y border-[#ECE6DB] py-3 text-sm text-[#5A5247] sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="flex items-center justify-between">
          <span>Giá gốc</span>
          <span>{formatVnd(order.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Giảm giá</span>
          <span>{formatVnd(order.discount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Phí vận chuyển</span>
          <span>{formatVnd(order.shippingFee)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate(`/account/order/${order.orderId}`)}
          className="inline-flex h-10 min-w-[132px] items-center justify-center rounded-full border border-[#A9A193] bg-white px-4 text-sm font-semibold text-[#3B372F] transition-colors hover:bg-[#F6F2EA]"
        >
          Xem chi tiết
        </button>
        <button
          type="button"
          onClick={() => onBuyAgain(order)}
          className="inline-flex h-10 min-w-[138px] items-center justify-center rounded-full border border-black bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1A1A1A]"
        >
          Mua lại
        </button>
      </div>
    </article>
  )
}

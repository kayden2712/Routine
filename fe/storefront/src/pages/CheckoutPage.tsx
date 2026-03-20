import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn, formatVnd } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const getSubtotal = useCartStore((state) => state.getSubtotal)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    district: '',
    city: '',
    note: '',
  })
  const [activeSection, setActiveSection] = useState<'contact' | 'delivery' | 'payment'>('contact')
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'fast'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('cod')

  const shippingFee = deliveryMethod === 'fast' ? 45000 : 30000
  const subtotal = getSubtotal()
  const fallbackSubtotal = 739500
  const effectiveSubtotal = subtotal || fallbackSubtotal
  const total = effectiveSubtotal + shippingFee

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const inputClassName =
    'h-11 w-full rounded-[8px] border border-white/12 bg-white/6 px-[14px] text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-white/40 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]'

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="rounded-[12px] bg-[#242422] p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setActiveSection((prev) => (prev === 'contact' ? 'delivery' : 'contact'))}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">
                1
              </span>
              <h1 className="font-display text-[20px] text-white">Thông tin giao hàng</h1>
            </div>
            <span className="text-xs text-white/50">{activeSection === 'contact' ? 'Thu gọn' : 'Mở'}</span>
          </button>

          {activeSection === 'contact' ? (
            <div className="mt-5 grid gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-white/60">Họ và tên</label>
                <input
                  className={inputClassName}
                  placeholder="Nhập họ và tên"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/60">
                    Số điện thoại
                  </label>
                  <input
                    className={inputClassName}
                    placeholder="Nhập số điện thoại"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/60">Email</label>
                  <input
                    className={inputClassName}
                    placeholder="email@domain.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-white/60">Địa chỉ</label>
                <input
                  className={inputClassName}
                  placeholder="Số nhà, tên đường"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/60">Quận / Huyện</label>
                  <input
                    className={inputClassName}
                    placeholder="Quận / Huyện"
                    value={form.district}
                    onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/60">Tỉnh / Thành phố</label>
                  <input
                    className={inputClassName}
                    placeholder="Tỉnh / Thành phố"
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-white/60">Ghi chú</label>
                <textarea
                  className="min-h-24 w-full rounded-[8px] border border-white/12 bg-white/6 px-[14px] py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-white/40 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                  placeholder="Ghi chú cho đơn hàng"
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[12px] bg-[#242422] p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setActiveSection((prev) => (prev === 'delivery' ? 'payment' : 'delivery'))}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">
                2
              </span>
              <h2 className="font-display text-[20px] text-white">Phương thức giao hàng</h2>
            </div>
            <span className="text-xs text-white/50">{activeSection === 'delivery' ? 'Thu gọn' : 'Mở'}</span>
          </button>

          {activeSection === 'delivery' ? (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('standard')}
                className={cn(
                  'flex w-full items-center justify-between rounded-[10px] border bg-[#242422] p-4 text-left transition-colors',
                  deliveryMethod === 'standard'
                    ? 'border-[1.5px] border-white bg-white/4'
                    : 'border-white/10',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">Giao hàng tiêu chuẩn</p>
                  <p className="mt-1 text-xs text-white/50">2-4 ngày làm việc</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white">{formatVnd(30000)}</span>
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                      deliveryMethod === 'standard' ? 'border-white' : 'border-white/35',
                    )}
                  >
                    {deliveryMethod === 'standard' ? (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('fast')}
                className={cn(
                  'flex w-full items-center justify-between rounded-[10px] border bg-[#242422] p-4 text-left transition-colors',
                  deliveryMethod === 'fast' ? 'border-[1.5px] border-white bg-white/4' : 'border-white/10',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">Giao hàng nhanh</p>
                  <p className="mt-1 text-xs text-white/50">Nhận trong ngày tại nội thành</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white">{formatVnd(45000)}</span>
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                      deliveryMethod === 'fast' ? 'border-white' : 'border-white/35',
                    )}
                  >
                    {deliveryMethod === 'fast' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                  </span>
                </div>
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-[12px] bg-[#242422] p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setActiveSection((prev) => (prev === 'payment' ? 'contact' : 'payment'))}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">
                3
              </span>
              <h2 className="font-display text-[20px] text-white">Phương thức thanh toán</h2>
            </div>
            <span className="text-xs text-white/50">{activeSection === 'payment' ? 'Thu gọn' : 'Mở'}</span>
          </button>

          {activeSection === 'payment' ? (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={cn(
                  'flex w-full items-center justify-between rounded-[10px] border bg-[#242422] p-4 text-left transition-colors',
                  paymentMethod === 'cod' ? 'border-[1.5px] border-white bg-white/4' : 'border-white/10',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">Thanh toán khi nhận hàng (COD)</p>
                  <p className="mt-1 text-xs text-white/50">Kiểm tra hàng trước khi thanh toán</p>
                </div>
                <span
                  className={cn(
                    'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                    paymentMethod === 'cod' ? 'border-white' : 'border-white/35',
                  )}
                >
                  {paymentMethod === 'cod' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={cn(
                  'flex w-full items-center justify-between rounded-[10px] border bg-[#242422] p-4 text-left transition-colors',
                  paymentMethod === 'bank' ? 'border-[1.5px] border-white bg-white/4' : 'border-white/10',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">Chuyển khoản ngân hàng</p>
                  <p className="mt-1 text-xs text-white/50">Xác nhận tự động sau khi thanh toán</p>
                </div>
                <span
                  className={cn(
                    'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                    paymentMethod === 'bank' ? 'border-white' : 'border-white/35',
                  )}
                >
                  {paymentMethod === 'bank' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="h-fit rounded-[12px] bg-[#242422] p-5">
        <h2 className="font-display text-[20px] text-white">Tóm tắt đơn hàng</h2>
        <p className="mt-1.5 text-sm text-white/60">{itemCount || 1} sản phẩm</p>

        <div className="mt-4 space-y-2.5 text-sm text-white/70">
          <div className="flex items-center justify-between">
            <span>Tạm tính</span>
            <span>{formatVnd(effectiveSubtotal)}</span>
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

        <div className="mt-5 rounded-[10px] border border-white/10 bg-white/3 p-3 text-xs text-white/60">
          {items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.slice(0, 3).map((item) => (
                <li key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center justify-between">
                  <span className="max-w-[200px] truncate">{item.name}</span>
                  <span>x{item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Đơn mẫu áp dụng cho giao diện demo storefront.</p>
          )}
        </div>

        <Button
          className="mt-5 h-[52px] w-full rounded-[8px] text-[15px] font-semibold"
          onClick={() => {
            if (!form.fullName || !form.phone || !form.address || !form.city || !form.district) {
              return
            }
            clearCart()
            navigate('/order-success')
          }}
        >
          Đặt hàng ({formatVnd(total)})
        </Button>
      </aside>
    </div>
  )
}

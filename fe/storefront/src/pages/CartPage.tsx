import { Heart, Lock, Minus, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { applyPromotionCodeApi, checkApplicablePromotionsApi, fetchPromotionByCodeApi, type StorefrontPromotion } from '@/lib/backendApi'
import { formatVnd } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'

type CartPromotionType = 'GIAM_PHAN_TRAM' | 'GIAM_TIEN' | 'TANG_QUA'

interface AppliedPromotionState {
  code: string
  name: string
  type: CartPromotionType
  discountAmount: number
  message: string
}

export const CartPage = () => {
  const navigate = useNavigate()
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const getSubtotal = useCartStore((state) => state.getSubtotal)

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotionState | null>(null)
  const [promoError, setPromoError] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [availablePromotions, setAvailablePromotions] = useState<StorefrontPromotion[]>([])
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false)

  const subtotal = getSubtotal()
  const totalProducts = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items])
  const promoDiscount = appliedPromotion?.discountAmount ?? 0
  const total = Math.max(0, subtotal - promoDiscount)

  const freeShippingTarget = 1000000
  const remainingForFreeShipping = Math.max(0, freeShippingTarget - subtotal)
  const shippingProgress = Math.min(100, (subtotal / freeShippingTarget) * 100)

  const productIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => Number.parseInt(item.productId, 10))
            .filter((id) => Number.isFinite(id)),
        ),
      ),
    [items],
  )

  useEffect(() => {
    if (!productIds.length) {
      setAvailablePromotions([])
      return
    }

    let stillMounted = true

    const fetchApplicablePromotions = async () => {
      setIsLoadingPromotions(true)

      try {
        const response = await checkApplicablePromotionsApi({
          orderAmount: subtotal,
          productIds,
        })

        if (stillMounted) {
          setAvailablePromotions(response.applicablePromotions ?? [])
        }
      } catch {
        if (stillMounted) {
          setAvailablePromotions([])
        }
      } finally {
        if (stillMounted) {
          setIsLoadingPromotions(false)
        }
      }
    }

    void fetchApplicablePromotions()

    return () => {
      stillMounted = false
    }
  }, [productIds, subtotal])

  const handleApplyPromotion = async (incomingCode?: string) => {
    const code = (incomingCode ?? promoCode).trim().toUpperCase()

    if (!code) {
      setAppliedPromotion(null)
      setPromoError('')
      return
    }

    setPromoCode(code)

    setIsApplyingPromo(true)
    setPromoError('')

    try {
      const promotion = await fetchPromotionByCodeApi(code)
      const result = await applyPromotionCodeApi({
        promotionCode: code,
        orderAmount: subtotal,
        productIds,
      })

      if (!result.applicable) {
        setAppliedPromotion(null)
        setPromoError(result.message || 'Mã giảm giá chưa áp dụng được cho giỏ hàng hiện tại.')
        return
      }

      setAppliedPromotion({
        code,
        name: promotion.name,
        type: promotion.type,
        discountAmount: Number(result.discountAmount ?? 0),
        message: result.message || 'Áp dụng ưu đãi thành công.',
      })
    } catch (error) {
      setAppliedPromotion(null)
      setPromoError(error instanceof Error ? error.message : 'Không thể áp dụng mã giảm giá lúc này.')
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const formatPromotionSummary = (promotion: StorefrontPromotion): string => {
    if (promotion.type === 'GIAM_PHAN_TRAM') {
      const value = Number(promotion.discountValue ?? 0)
      if (value <= 0) {
        return 'Ưu đãi phần trăm'
      }
      return `Giảm ${value}%`
    }

    if (promotion.type === 'GIAM_TIEN') {
      const value = Number(promotion.discountValue ?? 0)
      if (value <= 0) {
        return 'Ưu đãi tiền mặt'
      }
      return `Giảm ${formatVnd(value)}`
    }

    return 'Ưu đãi quà tặng'
  }

  if (!items.length) {
    return (
      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8">
        <p className="text-sm text-[var(--text-secondary)]">Trang chủ / Giỏ hàng</p>
        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-10 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Giỏ hàng trống</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Khám phá bộ sưu tập mới và thêm sản phẩm bạn yêu thích.</p>
          <Button asChild className="mt-6 h-11 rounded-lg px-6 text-sm font-semibold">
            <Link to="/san-pham">Xem sản phẩm</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8">
      <p className="text-sm text-[var(--text-secondary)]">Trang chủ / Giỏ hàng</p>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[24px] font-semibold text-[var(--text-primary)]">Giỏ hàng ({totalProducts} sản phẩm)</h1>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Link
            to="/san-pham"
            className="mb-4 inline-flex text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            ← Tiếp tục mua sắm
          </Link>

          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={`${item.productId}-${item.size}-${item.color}`}
                className="flex gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5"
              >
                <Link to={`/san-pham/${item.productId}`} className="shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-[100px] w-[80px] rounded-lg bg-[#E8E5E0] object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/san-pham/${item.productId}`}
                      className="block truncate text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--color-accent)]"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                      Màu: {item.color} | Size: {item.size}
                    </p>
                    <p className="mt-2 text-[15px] font-bold text-[var(--text-primary)]">{formatVnd(item.price)}</p>

                    <div className="mt-4 flex items-center gap-4 text-[12px] text-[var(--text-secondary)]">
                      <button
                        type="button"
                        onClick={() => {
                          toggleWishlist(item.productId)
                          removeFromCart(item.productId, item.size, item.color)
                        }}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--text-primary)]"
                      >
                        <Heart size={12} />
                        Lưu vào yêu thích
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.size, item.color)}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--text-primary)]"
                      >
                        <Trash2 size={12} />
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      aria-label="Xóa sản phẩm"
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      <X size={14} />
                    </button>

                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{formatVnd(item.price * item.quantity)}</p>

                    <div className="inline-flex overflow-hidden rounded-md border border-[var(--line-strong)]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className="inline-flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--line-soft)] hover:text-[var(--text-primary)]"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="inline-flex h-8 w-8 items-center justify-center border-x border-[var(--line)] text-[13px] text-[var(--text-primary)]">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        className="inline-flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--line-soft)] hover:text-[var(--text-primary)]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-6 lg:sticky lg:top-20">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Tóm tắt đơn hàng</h2>

          <div className="mt-4 text-[14px]">
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] py-2">
              <span className="text-[var(--text-secondary)]">Tạm tính ({totalProducts} sp):</span>
              <span className="text-[var(--text-primary)]">{formatVnd(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--line-soft)] py-2">
              <span className="text-[var(--text-secondary)]">Phí vận chuyển:</span>
              <span className="font-medium text-[#16A34A]">Miễn phí ✓</span>
            </div>

            {promoDiscount > 0 && (
              <div className="flex items-center justify-between border-b border-[var(--line-soft)] py-2">
                <span className="text-[var(--text-secondary)]">Giảm giá:</span>
                <span className="font-medium text-[#DC2626]">-{formatVnd(promoDiscount)}</span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
              <span className="text-[16px] font-bold text-[var(--text-primary)]">Tổng cộng:</span>
              <span className="text-[16px] font-bold text-[var(--text-primary)]">{formatVnd(total)}</span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] text-[var(--text-secondary)]">
              {remainingForFreeShipping > 0
                ? `Thêm ${formatVnd(remainingForFreeShipping)} để được freeship`
                : 'Bạn đã đủ điều kiện miễn phí vận chuyển'}
            </p>
            <div className="mt-1.5 h-[3px] rounded-[2px] bg-[var(--line-soft)]">
              <div className="h-full rounded-[2px] bg-[var(--text-primary)]" style={{ width: `${shippingProgress}%` }} />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
              placeholder="Mã giảm giá"
              className="rf-input h-10 min-w-0 flex-1 rounded-lg px-3 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleApplyPromotion()}
              disabled={isApplyingPromo || items.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--line-soft)]"
            >
              {isApplyingPromo ? 'Đang áp dụng...' : 'Áp dụng'}
            </button>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">Mã có thể sử dụng</p>

            {isLoadingPromotions ? (
              <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">Đang tìm mã phù hợp...</p>
            ) : availablePromotions.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {availablePromotions.map((promotion) => {
                  const isSelected = promoCode.trim().toUpperCase() === promotion.code.toUpperCase()
                  return (
                    <button
                      key={promotion.id}
                      type="button"
                      onClick={() => {
                        void handleApplyPromotion(promotion.code)
                      }}
                      className={[
                        'rounded-full border px-3 py-1 text-[11px] transition-colors',
                        isSelected
                          ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--surface-elevated)]'
                          : 'border-[var(--line)] text-[var(--text-primary)] hover:bg-[var(--line-soft)]',
                      ].join(' ')}
                    >
                      {promotion.code} • {formatPromotionSummary(promotion)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">Hiện chưa có mã phù hợp với giỏ hàng này.</p>
            )}
          </div>

          {promoError ? (
            <p className="mt-2 text-[12px] text-[#DC2626]">{promoError}</p>
          ) : null}

          {appliedPromotion ? (
            <p className="mt-2 text-[12px] text-[#16A34A]">
              {appliedPromotion.type === 'TANG_QUA'
                ? `Mã ${appliedPromotion.code} đã áp dụng ưu đãi quà tặng: ${appliedPromotion.name}.`
                : `Mã ${appliedPromotion.code} đã áp dụng, giảm ${formatVnd(appliedPromotion.discountAmount)}.`}
            </p>
          ) : null}

          <Button onClick={() => navigate('/checkout')} className="mt-4 h-12 w-full rounded-lg text-[14px] font-semibold">
            Tiến hành thanh toán
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--text-secondary)]">
            <Lock size={12} />
            Thanh toán bảo mật
          </p>
        </aside>
      </div>
    </section>
  )
}


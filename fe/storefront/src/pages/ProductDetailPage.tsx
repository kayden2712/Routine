import { Heart, Minus, Plus, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { findProductByRef, productDetailData } from '@/lib/mockData'
import { formatVnd } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import type { ProductSize } from '@/types/customer.types'

const ratingBars = [92, 78, 44, 16, 8]

export const ProductDetailPage = () => {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const product = useMemo(() => findProductByRef(productId), [productId])

  const addToCart = useCartStore((state) => state.addToCart)
  const isWishlisted = useWishlistStore((state) => state.isWishlisted)
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)

  const details = product ? productDetailData[product.id] : undefined

  const isNumericSize = (product?.sizes[0] ?? '').match(/^\d+$/)
  const baseSizes: ProductSize[] = isNumericSize ? ['28', '29', '30', '31', '32'] : ['XS', 'S', 'M', 'L', 'XL']

  const [size, setSize] = useState<ProductSize | undefined>(product?.sizes[0])
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [activeThumb, setActiveThumb] = useState(0)

  if (!product || !details) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-10 text-center">
        <p className="text-[var(--text-secondary)]">Không tìm thấy sản phẩm.</p>
        <Link to="/san-pham" className="mt-4 inline-block text-sm text-[var(--text-primary)] underline">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : undefined

  const gallery = details.gallery.length ? details.gallery : [product.image]

  const animateFlyToCart = () => {
    const sourceImage = document.getElementById('product-detail-main-image') as HTMLImageElement | null
    const cartButton = document.getElementById('navbar-cart-button')
    if (!sourceImage || !cartButton) {
      return
    }

    const sourceRect = sourceImage.getBoundingClientRect()
    const targetRect = cartButton.getBoundingClientRect()
    const clone = sourceImage.cloneNode(true) as HTMLImageElement

    clone.style.position = 'fixed'
    clone.style.left = `${sourceRect.left}px`
    clone.style.top = `${sourceRect.top}px`
    clone.style.width = `${sourceRect.width}px`
    clone.style.height = `${sourceRect.height}px`
    clone.style.borderRadius = '12px'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '120'
    clone.style.transformOrigin = 'center center'
    clone.style.transition = 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease'

    document.body.appendChild(clone)

    const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)
    const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.08)`
      clone.style.opacity = '0.2'
    })

    window.setTimeout(() => {
      clone.remove()
    }, 700)
  }

  const handleAddToCart = (event?: MouseEvent<HTMLButtonElement>) => {
    if (!size) return

    if (event) {
      event.currentTarget.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(0.95)' },
          { transform: 'scale(1)' },
        ],
        { duration: 220, easing: 'ease-out' },
      )
    }

    animateFlyToCart()

    addToCart({
      product,
      size,
      color: selectedColor,
      quantity,
    })
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8 sm:py-10">
      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--surface-muted)]">
            <img
              id="product-detail-main-image"
              src={gallery[activeThumb] ?? product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {gallery.map((image, index) => {
              const active = activeThumb === index
              return (
                <button
                  key={`${product.id}-${index}`}
                  type="button"
                  onClick={() => setActiveThumb(index)}
                  className={`relative h-[90px] w-[72px] overflow-hidden rounded-lg bg-[var(--surface-muted)] transition ${
                    active ? 'border-2 border-[var(--text-primary)] opacity-100' : 'border border-[var(--line)] opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={image} alt={`${product.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-5">
          <p className="text-xs text-[var(--text-secondary)]">Trang chủ / {product.category}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge value={product.badge} />
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[var(--text-primary)]">
              {product.category.toUpperCase()}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-secondary)]">
              SKU: {details.sku}
            </span>
          </div>

          <h1 className="font-display text-[24px] font-semibold leading-[1.2] text-[var(--text-primary)]">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-1 text-[var(--star)]">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star key={value} size={14} className={value <= Math.round(product.rating) ? 'fill-[var(--star)]' : 'fill-transparent'} />
              ))}
            </div>
            <span>{product.rating.toFixed(1)}/5</span>
            <span>({product.reviewCount} đánh giá)</span>
            <span>· Còn {details.stock} sản phẩm</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-5">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{formatVnd(product.price)}</span>
            {product.oldPrice ? <span className="text-base text-[var(--text-secondary)] line-through">{formatVnd(product.oldPrice)}</span> : null}
            {discountPercent ? <span className="rounded bg-[var(--sale)] px-2 py-0.5 text-[11px] font-bold text-white">-{discountPercent}%</span> : null}
          </div>

          <p className="border-b border-[var(--line)] pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{product.description}</p>

          <div className="space-y-3 border-b border-[var(--line)] pb-5">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Màu sắc: {selectedColor}</p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => {
                const selected = selectedColor === color
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      selected
                        ? 'border-[var(--text-primary)] bg-[var(--surface-elevated)] text-[var(--text-primary)]'
                        : 'border-[var(--line)] text-[var(--text-secondary)] hover:border-[var(--line-strong)]'
                    }`}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 border-b border-[var(--line)] pb-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">Chọn size</p>
              <button type="button" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Hướng dẫn →
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {baseSizes.map((sizeValue) => {
                const available = product.sizes.includes(sizeValue)
                const selected = size === sizeValue
                return (
                  <button
                    key={sizeValue}
                    type="button"
                    disabled={!available}
                    onClick={() => setSize(sizeValue)}
                    className={`relative h-9 rounded-md border px-3.5 text-sm transition ${
                      selected
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--surface-bg)]'
                        : 'border-[var(--line)] bg-transparent text-[var(--text-primary)] hover:border-[var(--line-strong)]'
                    } ${!available ? 'cursor-not-allowed opacity-30' : ''}`}
                  >
                    {sizeValue}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 border-b border-[var(--line)] pb-5">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Số lượng</p>
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--line-strong)]">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex h-10 w-10 items-center justify-center border-r border-[var(--line)] text-[var(--text-primary)] transition hover:bg-[var(--line-soft)]"
              >
                <Minus size={14} />
              </button>
              <span className="flex h-10 w-10 items-center justify-center text-sm text-[var(--text-primary)]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="flex h-10 w-10 items-center justify-center border-l border-[var(--line)] text-[var(--text-primary)] transition hover:bg-[var(--line-soft)]"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={(event) => handleAddToCart(event)} className="h-12 flex-1 rounded-lg">
              Thêm vào giỏ
            </Button>
            <Button
              onClick={(event) => {
                handleAddToCart(event)
                navigate('/checkout')
              }}
              className="h-12 flex-1 rounded-lg"
              variant="outline"
            >
              Mua ngay
            </Button>
            <Button type="button" variant="ghost" onClick={() => toggleWishlist(product.id)} className="h-12 w-12 rounded-lg p-0">
              <Heart size={17} className={isWishlisted(product.id) ? 'fill-current' : ''} />
            </Button>
          </div>

          <div className="space-y-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <Truck size={14} className="text-[var(--text-primary)]" />
              <span>Miễn phí giao hàng toàn quốc cho đơn từ 499.000đ</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <ShieldCheck size={14} className="text-[var(--text-primary)]" />
              <span>Đổi trả trong 7 ngày nếu sản phẩm chưa qua sử dụng</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <RotateCcw size={14} className="text-[var(--text-primary)]" />
              <span>Giao nhanh nội thành 2 giờ, hỗ trợ kiểm hàng</span>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="h-auto w-full justify-start rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] p-1">
            <TabsTrigger value="description" className="rounded-md px-4 py-2 text-sm text-[var(--text-secondary)] data-[state=active]:bg-[var(--surface-muted)] data-[state=active]:text-[var(--text-primary)]">
              Mô tả
            </TabsTrigger>
            <TabsTrigger value="specs" className="rounded-md px-4 py-2 text-sm text-[var(--text-secondary)] data-[state=active]:bg-[var(--surface-muted)] data-[state=active]:text-[var(--text-primary)]">
              Thông số
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-md px-4 py-2 text-sm text-[var(--text-secondary)] data-[state=active]:bg-[var(--surface-muted)] data-[state=active]:text-[var(--text-primary)]">
              Đánh giá ({details.reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>{product.description}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {details.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="specs" className="mt-5 text-sm text-[var(--text-secondary)]">
            <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 sm:grid-cols-2">
              <p>SKU: {details.sku}</p>
              <p>Tồn kho: {details.stock}</p>
              <p>Chất liệu: {details.material}</p>
              <p>Phom dáng: {details.fit}</p>
              <p>Mùa phù hợp: {details.season}</p>
              <p>Bảo quản: {details.care}</p>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-5 space-y-5">
            <div className="grid gap-6 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 md:grid-cols-[220px_1fr]">
              <div>
                <p className="text-5xl font-semibold text-[var(--text-primary)]">{product.rating.toFixed(1)}</p>
                <div className="mt-2 flex items-center gap-1 text-[var(--star)]">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} size={14} className="fill-[var(--star)]" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Từ {product.reviewCount} đánh giá đã xác thực</p>
              </div>

              <div className="space-y-2">
                {ratingBars.map((percent, index) => (
                  <div key={index} className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="w-8">{5 - index}★</span>
                    <div className="h-2 flex-1 rounded-full bg-[var(--line)]">
                      <div className="h-full rounded-full bg-[var(--text-primary)]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {details.reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-sm font-medium text-[var(--text-primary)]">
                    {review.author.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{review.author}</p>
                      <span className="text-xs text-[var(--text-secondary)]">{review.date}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[var(--star)]">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star key={value} size={13} className={value <= review.rating ? 'fill-[var(--star)]' : 'opacity-30'} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{review.comment}</p>
                  </div>
                </div>
              </article>
            ))}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

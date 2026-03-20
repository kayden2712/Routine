import { Heart } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/shared/Badge'
import { RatingStars } from '@/components/shared/RatingStars'
import { Button } from '@/components/ui/button'
import { formatVnd } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import type { Product } from '@/types/customer.types'

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addToCart = useCartStore((state) => state.addToCart)
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)
  const isWishlisted = useWishlistStore((state) => state.isWishlisted)

  const wished = isWishlisted(product.id)

  const animateFlyToCart = () => {
    const sourceImage = document.getElementById(`product-card-image-${product.id}`) as HTMLImageElement | null
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

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.94)' },
        { transform: 'scale(1)' },
      ],
      { duration: 220, easing: 'ease-out' },
    )

    animateFlyToCart()

    addToCart({
      product,
      size: product.sizes[0],
      color: product.colors[0],
    })
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface-bg)] shadow-[0_8px_24px_rgba(26,26,24,0.06)]">
      <div className="relative p-3">
        <img
          id={`product-card-image-${product.id}`}
          src={product.image}
          alt={product.name}
          className="aspect-[4/5] w-full rounded-[12px] object-cover"
        />
        <div className="absolute left-6 top-6">
          <Badge value={product.badge} />
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label="Yêu thích"
          className={`absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center transition-all hover:scale-[1.08] ${
            wished
              ? 'text-[#DB2777]'
              : 'text-[var(--text-primary)]/85 hover:text-[var(--text-primary)]'
          }`}
        >
          <Heart size={17} className={wished ? 'fill-[#F472B6] text-[#DB2777]' : ''} />
        </button>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4 pt-1">
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">{product.category}</p>
        <Link
          to={`/san-pham/${product.id}`}
          className="block min-h-[56px] font-display text-[20px] leading-tight text-[var(--text-primary)] hover:opacity-80"
        >
          {product.name}
        </Link>
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

        <div className="flex items-center gap-2">
          <span className="text-[18px] font-semibold text-[var(--text-primary)]">{formatVnd(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-[var(--text-secondary)] line-through">{formatVnd(product.oldPrice)}</span>
          )}
        </div>

        <Button
          className="mt-auto w-full"
          onClick={handleAddToCart}
        >
          Thêm vào giỏ
        </Button>
      </div>
    </article>
  )
}

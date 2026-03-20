import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories, products } from '@/lib/mockData'

const sizeOrder = ['XS', 'S', 'M', 'L']

const formatPrice = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`

const labelMap: Record<string, string> = {
  new: 'NEW',
  sale: 'SALE',
  bestseller: 'BESTSELLER',
}

export const HomePage = () => {
  const heroProduct = products[0]
  const curatedProducts = products.slice(0, 6)
  const featured = products.slice(0, 3)

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface-bg)]">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.06fr]">
          <div className="relative min-h-[360px] overflow-hidden lg:min-h-[520px]">
            <img
              src={heroProduct.image}
              alt={heroProduct.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 top-0 flex items-center p-8 lg:p-12">
              <div className="max-w-[440px] text-white">
                <h1 className="font-display text-[44px] leading-[1] font-semibold lg:text-[64px]">
                  Phong cách
                  <br />
                  cho cuộc sống
                  <br />
                  “tối giản”
                </h1>

                <p className="mt-5 max-w-[360px] text-[17px] text-white/82">
                  Thời trang chất lượng, thiết kế tinh tế dành cho người Việt năng động.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/san-pham"
                    className="inline-flex h-[46px] items-center rounded-[12px] border border-white/45 px-5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Khám phá ngay <ArrowRight size={16} className="ml-2" />
                  </Link>
                  <Link
                    to="/san-pham"
                    className="inline-flex h-[46px] items-center rounded-[12px] bg-white px-5 text-[15px] font-semibold text-[#1A1A18] transition-opacity hover:opacity-90"
                  >
                    Xem bộ sưu tập
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l border-[var(--line)] bg-[var(--page-bg)] p-6 lg:p-8">
            <h2 className="mb-3 text-[32px] font-semibold text-[var(--text-primary)]">Danh mục</h2>

            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-4">
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-full bg-[var(--text-primary)] px-5 text-[14px] font-medium text-[var(--surface-bg)]"
              >
                Tất cả
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="inline-flex h-10 items-center rounded-full border border-[var(--line)] bg-[var(--surface-bg)] px-4 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--line-soft)]"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {curatedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/san-pham/${product.id}`}
                  className="block rounded-[14px] bg-[var(--surface-bg)] p-3 shadow-[0_8px_24px_rgba(26,26,24,0.06)] transition-transform hover:-translate-y-0.5"
                >
                  <img src={product.image} alt={product.name} className="aspect-[4/5] w-full rounded-[12px] object-cover" />
                  <p className="mt-3 text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">{product.category}</p>
                  <h3 className="mt-1 line-clamp-2 text-[18px] font-medium leading-tight text-[var(--text-primary)]">{product.name}</h3>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[22px] font-semibold text-[var(--text-primary)]">{formatPrice(product.price)}</span>
                    <span className="text-[14px] text-[#8D6A2E]">★ {product.rating.toFixed(1)} ({product.reviewCount})</span>
                  </div>
                  <div className="mt-2.5 flex gap-1.5">
                    {sizeOrder.map((size) => (
                      <span key={size} className="inline-flex h-6 items-center rounded-[6px] border border-[var(--line)] bg-[var(--page-bg)] px-2 text-[11px] text-[var(--text-secondary)]">
                        {size}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border border-[var(--line)] bg-[var(--surface-bg)] p-6 lg:p-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-[32px] font-semibold text-[var(--text-primary)]">Danh mục</h2>
          <Link to="/san-pham" className="text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            Xem tất cả
          </Link>
        </div>

        <div className="mt-2 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2.5">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full bg-[var(--text-primary)] px-5 text-[14px] font-medium text-[var(--surface-bg)]"
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className="inline-flex h-10 items-center rounded-full border border-[var(--line)] bg-[var(--page-bg)] px-5 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--line-soft)]"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border border-[var(--line)] bg-[var(--surface-bg)] p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[32px] font-semibold text-[var(--text-primary)]">Sản phẩm nổi bật</h2>
          <Link to="/san-pham" className="text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            Xem tất cả
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((product) => {
            return (
              <Link key={product.id} to={`/san-pham/${product.id}`} className="block overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface-bg)] transition-transform hover:-translate-y-0.5">
                <div className="relative">
                  <img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
                  {product.badge ? (
                    <span className="absolute left-3 top-3 rounded-[999px] bg-[#1A1A18] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white">
                      {labelMap[product.badge]}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2.5 p-4">
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">{product.category}</p>
                  <h3 className="line-clamp-2 text-[22px] font-medium leading-tight text-[var(--text-primary)]">{product.name}</h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[24px] font-semibold text-[var(--text-primary)]">{formatPrice(product.price)}</span>
                      {product.oldPrice ? <span className="text-[14px] text-[var(--text-secondary)] line-through">{formatPrice(product.oldPrice)}</span> : null}
                    </div>
                    <span className="text-[14px] text-[#8D6A2E]">★ {product.rating.toFixed(1)} ({product.reviewCount})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {sizeOrder.map((size) => (
                      <span key={size} className="inline-flex h-6 items-center rounded-[6px] border border-[var(--line)] bg-[var(--page-bg)] px-2 text-[11px] text-[var(--text-secondary)]">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-4 rounded-[16px] border border-[var(--line)] bg-[#1F1F1B] px-8 py-7 md:flex-row md:items-center">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.1em] text-white/45">ƯU ĐÃI ĐẶC BIỆT</p>
          <h2 className="font-display text-[32px] font-semibold text-white">Sale cuối mùa - Giảm đến 40%</h2>
          <p className="mt-1 text-[14px] text-white/60">Chỉ còn đến hết tháng 3. Hàng có hạn.</p>
        </div>

        <Link
          to="/san-pham"
          className="inline-flex h-11 items-center rounded-[10px] bg-white px-[22px] text-[14px] font-semibold text-[#1A1A18] transition-opacity hover:opacity-90"
        >
          Mua ngay <ArrowRight size={14} className="ml-2" />
        </Link>
      </section>
    </div>
  )
}


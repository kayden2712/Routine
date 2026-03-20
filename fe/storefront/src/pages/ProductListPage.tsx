import { ChevronDown, LayoutGrid, List, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/shared/ProductCard'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { products } from '@/lib/mockData'
import { useWishlistStore } from '@/store/wishlistStore'

const colorMap: Record<string, string> = {
  Trắng: '#FFFFFF',
  Be: '#DDD2BF',
  'Xám nhạt': '#B8B8B8',
  'Nâu khói': '#6D5B4B',
  Đen: '#111111',
  Xám: '#7E7E7E',
  'Kem sữa': '#F1E7D7',
  'Rêu nhạt': '#77815C',
  'Nâu nhạt': '#A58A6B',
  'Xanh đêm': '#1E2A44',
  'Xanh đậm': '#1E3A63',
  'Xanh wash': '#5A7CA0',
  'Xám bạc': '#A6A8AC',
  'Đen wash': '#2B2B2B',
  Navy: '#1E2D4E',
  'Be khói': '#CBB8A1',
  'Nâu cà phê': '#5A3A2E',
  Olive: '#59664B',
  Champagne: '#D4BFA3',
  'Đỏ đô': '#6F1D2A',
}

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '28', '29', '30', '31', '32']

export const ProductListPage = () => {
  const [searchParams] = useSearchParams()
  const group = searchParams.get('group')
  const searchQuery = (searchParams.get('search') ?? '').trim().toLowerCase()
  const saleOnly = searchParams.get('sale') === '1'
  const genderFilter = searchParams.get('gioi-tinh')
  const wishlistOnly = searchParams.get('wishlist') === '1'
  const wishlistedIds = useWishlistStore((state) => state.productIds)

  const isFemaleCategory = (category: string) => category === 'Váy'

  const initialCategories = useMemo(() => {
    if (group === 'ao') {
      return ['Áo sơ mi', 'Áo thun', 'Áo khoác']
    }

    if (group === 'quan') {
      return ['Quần kaki', 'Quần jeans']
    }

    if (group === 'phu-kien') {
      return ['Phụ kiện']
    }

    return [] as string[]
  }, [group])

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [maxPrice, setMaxPrice] = useState(1000000)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('featured')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
    }
    return counts
  }, [])

  const uniqueCategories = useMemo(() => Array.from(categoryCounts.keys()), [categoryCounts])

  const uniqueColors = useMemo(() => {
    const set = new Set<string>()
    for (const product of products) {
      for (const color of product.colors) {
        set.add(color)
      }
    }
    return Array.from(set)
  }, [])

  const uniqueSizes = useMemo(() => {
    const set = new Set<string>()
    for (const product of products) {
      for (const size of product.sizes) {
        set.add(size)
      }
    }
    return sizeOrder.filter((size) => set.has(size))
  }, [])

  const filtered = useMemo(() => {
    const base = products.filter((product) => {
      const bySearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery)
      const bySale = !saleOnly || product.badge === 'sale'
      const byGender =
        !genderFilter ||
        (genderFilter === 'nu' ? isFemaleCategory(product.category) : !isFemaleCategory(product.category))
      const byWishlist = !wishlistOnly || wishlistedIds.includes(product.id)
      const byGroup = initialCategories.length === 0 || initialCategories.includes(product.category)
      const byCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category)
      const byPrice = product.price <= maxPrice
      const byColor = selectedColors.length === 0 || product.colors.some((color) => selectedColors.includes(color))
      const bySize = selectedSizes.length === 0 || product.sizes.some((size) => selectedSizes.includes(size))
      const byRating = selectedRating === null || Math.floor(product.rating) >= selectedRating

      return bySearch && bySale && byGender && byWishlist && byGroup && byCategory && byPrice && byColor && bySize && byRating
    })

    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => a.price - b.price)
    }

    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => b.price - a.price)
    }

    if (sortBy === 'rating') {
      return [...base].sort((a, b) => b.rating - a.rating)
    }

    return base
  }, [genderFilter, initialCategories, maxPrice, saleOnly, searchQuery, selectedCategories, selectedColors, selectedRating, selectedSizes, sortBy, wishlistOnly, wishlistedIds])

  const toggleValue = (values: string[], value: string) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

  const resetFilters = () => {
    setSelectedCategories(initialCategories)
    setMaxPrice(1000000)
    setSelectedColors([])
    setSelectedSizes([])
    setSelectedRating(null)
  }

  useEffect(() => {
    setSelectedCategories(initialCategories)
  }, [initialCategories])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-[84px] h-fit space-y-5 rounded-[14px] border border-[var(--line)] bg-[var(--surface-bg)] p-4">
        <Collapsible defaultOpen>
          <div className="pb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-secondary)]">DANH MỤC</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2.5">
              {uniqueCategories.map((category) => (
                <label key={category} className="flex items-center justify-between gap-2 text-[14px] text-[var(--text-primary)]">
                  <span className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => setSelectedCategories((prev) => toggleValue(prev, category))}
                      className="h-4 w-4 cursor-pointer rounded border border-[var(--line-strong)] bg-transparent accent-[var(--text-primary)]"
                    />
                    {category}
                  </span>
                  <span className="text-[12px] text-[var(--text-secondary)]">({categoryCounts.get(category) ?? 0})</span>
                </label>
              ))}
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="h-px bg-[var(--line)]" />

        <Collapsible defaultOpen>
          <div className="pb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-secondary)]">KHOẢNG GIÁ</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <input
                type="range"
                min={0}
                max={1000000}
                step={10000}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="rf-range h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--range-track)]"
                style={{
                  background: `linear-gradient(to right, var(--range-thumb) ${(maxPrice / 1000000) * 100}%, var(--range-track) ${(maxPrice / 1000000) * 100}%)`,
                }}
              />
              <p className="mt-3 text-[12px] text-[var(--text-secondary)]">0 ₫ - 1.000.000 ₫</p>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="h-px bg-[var(--line)]" />

        <Collapsible defaultOpen>
          <div className="pb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-secondary)]">MÀU SẮC</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 grid grid-cols-3 gap-2">
              {uniqueColors.map((color) => {
                const selected = selectedColors.includes(color)
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setSelectedColors((prev) => toggleValue(prev, color))}
                    className="h-6 w-6 rounded-full"
                    style={{
                      backgroundColor: colorMap[color] ?? '#9CA3AF',
                      boxShadow: selected ? '0 0 0 2px #ffffff, 0 0 0 3px #1A1A18' : 'none',
                    }}
                  />
                )
              })}
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="h-px bg-[var(--line)]" />

        <Collapsible defaultOpen>
          <div className="pb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-secondary)]">SIZE</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 flex flex-wrap gap-2">
              {uniqueSizes.map((size) => {
                const selected = selectedSizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSizes((prev) => toggleValue(prev, size))}
                    className={`inline-flex h-7 items-center rounded-full border px-[10px] text-[12px] font-medium ${
                      selected
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-white'
                        : 'border-[var(--line)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="h-px bg-[var(--line)]" />

        <Collapsible defaultOpen>
          <div className="pb-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-secondary)]">ĐÁNH GIÁ</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setSelectedRating((prev) => (prev === stars ? null : stars))}
                  className={`flex w-full items-center justify-between rounded-md px-1 py-1 text-left ${
                    selectedRating === stars ? 'bg-[var(--line-soft)]' : ''
                  }`}
                >
                  <span className="flex items-center gap-1 text-[13px] text-[var(--text-primary)]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={12}
                        className={idx < stars ? 'fill-[#D97706] text-[#D97706]' : 'text-[var(--line)]'}
                      />
                    ))}
                    <span>{stars} sao</span>
                  </span>
                  <span className="text-[12px] text-[var(--text-secondary)]">({stars + 3})</span>
                </button>
              ))}
            </CollapsibleContent>
          </div>
        </Collapsible>

        <button
          type="button"
          onClick={resetFilters}
          className="text-left text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Xóa bộ lọc
        </button>
      </aside>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[var(--text-secondary)]">Hiển thị {filtered.length} sản phẩm</p>
            {searchQuery ? (
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                Kết quả tìm kiếm cho: <span className="font-medium text-[var(--text-primary)]">"{searchQuery}"</span>
              </p>
            ) : null}
            {saleOnly ? <p className="mt-1 text-[12px] text-[#B91C1C]">Đang lọc: sản phẩm Sale</p> : null}
            {genderFilter === 'nam' ? <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Đang lọc: Đồ nam</p> : null}
            {genderFilter === 'nu' ? <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Đang lọc: Đồ nữ</p> : null}
            {wishlistOnly ? <p className="mt-1 text-[12px] text-[#DB2777]">Đang lọc: sản phẩm đã yêu thích</p> : null}
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Nổi bật</SelectItem>
                <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                aria-label="Grid view"
                className={`transition-colors ${layout === 'grid' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                onClick={() => setLayout('list')}
                aria-label="List view"
                className={`transition-colors ${layout === 'list' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className={layout === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'grid grid-cols-1 gap-4'}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}

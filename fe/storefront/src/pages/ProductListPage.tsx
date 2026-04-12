import { ChevronDown, LayoutGrid, List, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/shared/ProductCard'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchProductsApi } from '@/lib/backendApi'
import { useWishlistStore } from '@/store/wishlistStore'
import type { Product } from '@/types/customer.types'

const colorMap: Record<string, string> = {
  white: '#FFFFFF',
  black: '#111111',
  red: '#C1121F',
  gray: '#7E7E7E',
  navy: '#1E2D4E',
  beige: '#DDD2BF',
  olive: '#59664B',
  blue: '#1E3A63',
  green: '#2F6F4F',
  brown: '#5A3A2E',
}

const sizeOrder = ['M', 'S', 'L', 'XL', 'XXL']

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const normalizeColorKey = (value: string) => {
  const normalized = normalizeText(value)

  if (normalized === 'trang' || normalized === 'white') return 'white'
  if (normalized === 'den' || normalized === 'black') return 'black'
  if (normalized === 'do' || normalized === 'red') return 'red'
  if (normalized === 'xam' || normalized === 'gray' || normalized === 'grey') return 'gray'
  if (normalized === 'be' || normalized === 'beige') return 'beige'
  if (normalized === 'xanh dam' || normalized === 'blue') return 'blue'
  if (normalized === 'xanh la' || normalized === 'green') return 'green'
  if (normalized === 'nau' || normalized === 'brown') return 'brown'

  return normalized
}

const toColorLabel = (key: string) => {
  if (key === 'white') return 'Trắng'
  if (key === 'black') return 'Đen'
  if (key === 'red') return 'Đỏ'
  if (key === 'gray') return 'Xám'
  if (key === 'beige') return 'Be'
  if (key === 'blue') return 'Xanh dương'
  if (key === 'green') return 'Xanh lá'
  if (key === 'brown') return 'Nâu'
  if (key === 'navy') return 'Navy'
  if (key === 'olive') return 'Olive'
  return key
}

const matchesGroup = (category: string, group: string | null, genderFilter?: string | null) => {
  if (!group) {
    return true
  }

  const normalizedCategory = normalizeText(category)
  const isFemale = genderFilter === 'nu'
  const isDressLike = normalizedCategory.includes('vay') || normalizedCategory.includes('dam')

  if (group === 'ao') {
    const isTopLike =
      normalizedCategory.includes('ao') ||
      normalizedCategory.includes('so mi') ||
      normalizedCategory.includes('phong') ||
      normalizedCategory.includes('polo') ||
      normalizedCategory.includes('khoac')

    return isTopLike || (isFemale && isDressLike)
  }

  if (group === 'quan') {
    const isPantsLike =
      normalizedCategory.includes('quan') ||
      normalizedCategory.includes('jean') ||
      normalizedCategory.includes('kaki')

    return isPantsLike || (isFemale && isDressLike)
  }

  if (group === 'phu-kien') {
    return normalizedCategory.includes('phu kien') || normalizedCategory.includes('phukien')
  }

  return true
}

export const ProductListPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [searchParams] = useSearchParams()
  const group = searchParams.get('group')
  const searchQuery = (searchParams.get('search') ?? '').trim().toLowerCase()
  const saleOnly = searchParams.get('sale') === '1'
  const genderFilter = searchParams.get('gioi-tinh')
  const wishlistOnly = searchParams.get('wishlist') === '1'
  const wishlistedIds = useWishlistStore((state) => state.productIds)

  const isFemaleProduct = (product: Product) => {
    if (product.gender) {
      return product.gender === 'female'
    }

    const normalizedCategory = normalizeText(product.category)
    return normalizedCategory.includes('vay') || normalizedCategory.includes('dam')
  }

  const initialCategories = useMemo(() => {
    if (!group) {
      return [] as string[]
    }

    return Array.from(new Set(products.map((product) => product.category))).filter((category) =>
      matchesGroup(category, group, genderFilter),
    )
  }, [genderFilter, group, products])

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [maxPrice, setMaxPrice] = useState(1000000)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('featured')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const loadProducts = async () => {
      const productList = await fetchProductsApi()
      setProducts(productList)
    }

    void loadProducts()
  }, [])

  const scopedProducts = useMemo(() => {
    return products.filter((product) => {
      const bySearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery)
      const bySale = !saleOnly || product.badge === 'sale' || (!!product.oldPrice && product.oldPrice > product.price)
      const byWishlist = !wishlistOnly || wishlistedIds.includes(product.id)
      const byGroup = matchesGroup(product.category, group, genderFilter)

      return bySearch && bySale && byWishlist && byGroup
    })
  }, [genderFilter, group, products, saleOnly, searchQuery, wishlistOnly, wishlistedIds])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of scopedProducts) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
    }
    return counts
  }, [scopedProducts])

  const uniqueCategories = useMemo(
    () => Array.from(categoryCounts.keys()).sort((a, b) => a.localeCompare(b, 'vi')),
    [categoryCounts],
  )

  const colorCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of scopedProducts) {
      const uniqueByProduct = new Set(product.colors.map((color) => normalizeColorKey(color)))
      for (const color of uniqueByProduct) {
        counts.set(color, (counts.get(color) ?? 0) + 1)
      }
    }
    return counts
  }, [scopedProducts])

  const uniqueColors = useMemo(() => Array.from(colorCounts.keys()), [colorCounts])

  const uniqueSizes = useMemo(() => {
    const set = new Set<string>()
    for (const product of scopedProducts) {
      for (const size of product.sizes) {
        set.add(size)
      }
    }
    return sizeOrder.filter((size) => set.has(size))
  }, [scopedProducts])

  const sizeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of scopedProducts) {
      const uniqueByProduct = new Set(product.sizes.filter((size) => sizeOrder.includes(size)))
      for (const size of uniqueByProduct) {
        counts.set(size, (counts.get(size) ?? 0) + 1)
      }
    }
    return counts
  }, [scopedProducts])

  const ratingCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const stars of [5, 4, 3, 2, 1]) {
      counts.set(stars, scopedProducts.filter((product) => Math.floor(product.rating) >= stars).length)
    }
    return counts
  }, [scopedProducts])

  const filtered = useMemo(() => {
    const selectedCategoryKeys = selectedCategories.map((category) => normalizeText(category))
    const selectedColorKeys = selectedColors.map((color) => normalizeColorKey(color))

    const base = scopedProducts.filter((product) => {
      const byGender =
        !genderFilter ||
        (genderFilter === 'nu' ? isFemaleProduct(product) : !isFemaleProduct(product))
      const byCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category)
      const byCategoryNormalized = selectedCategoryKeys.length === 0 || selectedCategoryKeys.includes(normalizeText(product.category))
      const byPrice = product.price <= maxPrice
      const byColor =
        selectedColorKeys.length === 0 ||
        product.colors.some((color) => selectedColorKeys.includes(normalizeColorKey(color)))
      const bySize = selectedSizes.length === 0 || product.sizes.some((size) => selectedSizes.includes(size))
      const byRating = selectedRating === null || Math.floor(product.rating) >= selectedRating

      return byGender && (byCategory || byCategoryNormalized) && byPrice && byColor && bySize && byRating
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
  }, [genderFilter, maxPrice, scopedProducts, selectedCategories, selectedColors, selectedRating, selectedSizes, sortBy])

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

  useEffect(() => {
    const availableCategoryKeys = new Set(uniqueCategories.map((category) => normalizeText(category)))
    const availableColorKeys = new Set(uniqueColors)
    const availableSizes = new Set(uniqueSizes)

    setSelectedCategories((prev) => prev.filter((category) => availableCategoryKeys.has(normalizeText(category))))
    setSelectedColors((prev) => prev.filter((color) => availableColorKeys.has(normalizeColorKey(color))))
    setSelectedSizes((prev) => prev.filter((size) => availableSizes.has(size)))
  }, [uniqueCategories, uniqueColors, uniqueSizes])

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
            <CollapsibleContent className="mt-3 space-y-2">
              {uniqueColors.map((color) => {
                const selected = selectedColors.includes(color)
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setSelectedColors((prev) => toggleValue(prev, color))}
                    className={`flex w-full items-center justify-between rounded-md px-1 py-1 text-left ${
                      selected ? 'bg-[var(--line-soft)]' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{
                          backgroundColor: colorMap[normalizeColorKey(color)] ?? '#9CA3AF',
                          boxShadow: selected ? '0 0 0 2px #ffffff, 0 0 0 3px #1A1A18' : '0 0 0 1px #D1D5DB inset',
                        }}
                      />
                      <span>{toColorLabel(color)}</span>
                    </span>
                    <span className="text-[12px] text-[var(--text-secondary)]">({colorCounts.get(color) ?? 0})</span>
                  </button>
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
                    {size} <span className="ml-1 opacity-75">({sizeCounts.get(size) ?? 0})</span>
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
                  <span className="text-[12px] text-[var(--text-secondary)]">({ratingCounts.get(stars) ?? 0})</span>
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

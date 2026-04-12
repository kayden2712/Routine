import { Heart, Search, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import routineLogo from '@/assets/routine-logo-word.png'
import { useCartStore } from '@/store/cartStore'
import { useCustomerAuthStore } from '@/store/customerAuthStore'
import { useWishlistStore } from '@/store/wishlistStore'

const navItems = [
  { key: 'home', to: '/', label: 'Trang chủ' },
  { key: 'products', to: '/san-pham', label: 'Sản phẩm' },
  { key: 'nam', to: '/san-pham?gioi-tinh=nam', label: 'Đồ nam' },
  { key: 'nu', to: '/san-pham?gioi-tinh=nu', label: 'Đồ nữ' },
  { key: 'sale', to: '/san-pham?sale=1', label: 'Sale', isSale: true },
  { key: 'support', to: '/trung-tam-ho-tro', label: 'Trung tâm hỗ trợ' },
]

const genderGroupItems = [
  { key: 'gender-products', group: '', label: 'Sản phẩm' },
  { key: 'ao', group: 'ao', label: 'Áo' },
  { key: 'quan', group: 'quan', label: 'Quần' },
  { key: 'phukien', group: 'phu-kien', label: 'Phụ kiện' },
]

export const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const cartItems = useCartStore((state) => state.items)
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated)
  const wishlistedCount = useWishlistStore((state) => state.productIds.length)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const cartBadgeCount = cartItems.length
  const isWishlistView = searchParams.get('wishlist') === '1'
  const currentGroup = searchParams.get('group')
  const currentGender = searchParams.get('gioi-tinh')
  const isSaleView = searchParams.get('sale') === '1'
  const hasSearchQuery = Boolean(searchParams.get('search'))
  const genderGroupNavItems = currentGender
    ? genderGroupItems.map((item) => ({
        key: item.key,
        to: item.group
          ? `/san-pham?gioi-tinh=${currentGender}&group=${item.group}`
          : `/san-pham?gioi-tinh=${currentGender}`,
        label: item.label,
      }))
    : []

  const getItemActive = (key: string) => {
    if (key === 'home') return location.pathname === '/'
    if (key === 'support') return location.pathname === '/trung-tam-ho-tro'
    if (key === 'sale') return location.pathname === '/san-pham' && isSaleView
    if (key === 'nam') return location.pathname === '/san-pham' && currentGender === 'nam'
    if (key === 'nu') return location.pathname === '/san-pham' && currentGender === 'nu'
    if (key === 'gender-products') {
      return location.pathname === '/san-pham' && Boolean(currentGender) && !currentGroup
    }
    if (key === 'ao') return location.pathname === '/san-pham' && Boolean(currentGender) && currentGroup === 'ao'
    if (key === 'quan') return location.pathname === '/san-pham' && Boolean(currentGender) && currentGroup === 'quan'
    if (key === 'phukien') return location.pathname === '/san-pham' && Boolean(currentGender) && currentGroup === 'phu-kien'
    if (key === 'products') {
      return (
        location.pathname === '/san-pham' &&
        !currentGroup &&
        !currentGender &&
        !isSaleView &&
        !isWishlistView &&
        !hasSearchQuery
      )
    }

    return false
  }

  const handleSearch = () => {
    if (!searchOpen) {
      setSearchOpen(true)
      return
    }

    const keyword = searchText.trim()
    if (!keyword) {
      navigate('/san-pham')
      return
    }

    navigate(`/san-pham?search=${encodeURIComponent(keyword)}`)
  }

  const handleWishlistView = () => {
    navigate('/san-pham?wishlist=1')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/55 px-6 backdrop-blur">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4">
          <Link to="/" className="inline-flex items-center text-[var(--text-primary)]">
            <img src={routineLogo} alt="Routine by OZ homeland" className="h-14 w-auto" />
          </Link>

          <nav className="hidden items-center justify-center gap-7 xl:flex">
            {navItems.map((item) => {
              const isActive = getItemActive(item.key)
              const className = ('isSale' in item && item.isSale)
                ? `inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                    isActive
                      ? 'border-[#D93A2F] bg-[#D93A2F] text-white'
                      : 'border-[#D93A2F]/45 text-[#D93A2F] hover:border-[#D93A2F] hover:bg-[#D93A2F]/10'
                  }`
                : `relative inline-flex h-9 items-center px-0.5 text-[13px] font-medium transition-colors after:absolute after:-bottom-[3px] after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[var(--text-primary)] after:transition-transform after:duration-200 ${
                    isActive
                      ? 'scale-[1.03] text-[var(--text-primary)] after:scale-100'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] after:scale-0 hover:after:scale-100'
                  }`

              return (
                <Link key={`${item.label}-${item.to}`} to={item.to} className={className}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-3">
            {searchOpen ? (
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                  if (event.key === 'Escape') {
                    setSearchOpen(false)
                    setSearchText('')
                  }
                }}
                placeholder="Tìm sản phẩm..."
                className="h-9 w-44 rounded-md border border-[var(--line)] bg-[var(--surface-bg)] px-3 text-[12px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--line-strong)]"
              />
            ) : null}

            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={handleSearch}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-primary)] transition-all hover:bg-[var(--line-soft)]"
            >
              <Search size={16} />
            </button>

            <button
              type="button"
              aria-label="Yêu thích"
              onClick={handleWishlistView}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-all ${
                isWishlistView
                  ? 'bg-[#FCE7F3] text-[#DB2777]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--line-soft)]'
              }`}
            >
              <Heart size={16} className={isWishlistView ? 'fill-[#F472B6] text-[#DB2777]' : ''} />
              {wishlistedCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EC4899] px-1 text-[9px] font-semibold text-white">
                  {wishlistedCount}
                </span>
              ) : null}
            </button>

            <Link
              to="/gio-hang"
              id="navbar-cart-button"
              aria-label="Giỏ hàng"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-primary)] transition-all hover:bg-[var(--line-soft)]"
            >
              <ShoppingBag size={16} />
              {cartBadgeCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cta-bg)] px-1 text-[9px] font-semibold text-[var(--cta-text)]">
                  {cartBadgeCount}
                </span>
              ) : null}
            </Link>

            <Link
              to={isAuthenticated ? '/tai-khoan' : '/login'}
              className="inline-flex h-[34px] items-center rounded-[8px] px-2.5 text-[12px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--line-soft)]"
            >
              {isAuthenticated ? 'Tài khoản' : 'Đăng nhập'}
            </Link>
          </div>
        </div>

        {currentGender ? (
          <div className="hidden border-t border-[var(--line)] xl:block">
            <nav className="flex h-11 items-center justify-center gap-10">
              {genderGroupNavItems.map((item) => {
                const isActive = getItemActive(item.key)
                return (
                  <Link
                    key={`${item.label}-${item.to}`}
                    to={item.to}
                    className={`relative inline-flex h-9 items-center px-0.5 text-[13px] font-medium transition-colors after:absolute after:-bottom-[2px] after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[var(--text-primary)] after:transition-transform after:duration-200 ${
                      isActive
                        ? 'text-[var(--text-primary)] after:scale-100'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] after:scale-0 hover:after:scale-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}

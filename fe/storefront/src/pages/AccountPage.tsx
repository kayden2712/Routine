import { Heart, Lock, LogOut, Package, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { fetchMyOrdersApi, fetchProductsApi } from '@/lib/backendApi'
import { formatVnd } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useCustomerAuthStore } from '@/store/customerAuthStore'
import { useWishlistStore } from '@/store/wishlistStore'
import type { Product } from '@/types/customer.types'

type AccountTab = 'orders' | 'profile' | 'security'
type OrderStatus = 'shipping' | 'received' | 'cancelled'

interface TrackingStep {
  label: string
  state: 'completed' | 'current' | 'upcoming'
}

interface AccountOrder {
  id: string
  date: string
  status: OrderStatus
  total: number
  items: Array<{ id: string; name: string; image: string }>
  tracking: TrackingStep[]
}

const statusLabelMap: Record<OrderStatus, string> = {
  shipping: 'Đang giao',
  received: 'Đã nhận',
  cancelled: 'Đã hủy',
}

const statusClassMap: Record<OrderStatus, string> = {
  shipping: 'border border-blue-500/30 bg-blue-500/10 text-blue-500',
  received: 'border border-green-500/30 bg-green-500/10 text-green-600',
  cancelled: 'border border-red-500/30 bg-red-500/10 text-red-600',
}

export const AccountPage = () => {
  const navigate = useNavigate()
  const user = useCustomerAuthStore((state) => state.user)
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated)
  const logout = useCustomerAuthStore((state) => state.logout)
  const addToCart = useCartStore((state) => state.addToCart)
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)
  const isWishlisted = useWishlistStore((state) => state.isWishlisted)
  const [activeTab, setActiveTab] = useState<AccountTab>('orders')
  const [searchQuery, setSearchQuery] = useState('')
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null)
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [orderList, productList] = await Promise.all([
        fetchMyOrdersApi(),
        fetchProductsApi(),
      ])

      setProducts(productList)
      setOrders(orderList.map((order) => ({
        id: `#${order.orderNumber}`,
        date: new Intl.DateTimeFormat('vi-VN').format(order.createdAt),
        status: order.status,
        total: order.total,
        items: order.items.map((item) => {
          const product = productList.find((value) => value.id === item.productId)
          return {
            id: item.productId,
            name: item.productName,
            image: product?.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
          }
        }),
        tracking:
          order.status === 'cancelled'
            ? [
                { label: 'Đơn hàng đã đặt', state: 'completed' as const },
                { label: 'Đang xử lý', state: 'current' as const },
                { label: 'Đã hủy', state: 'upcoming' as const },
              ]
            : [
                { label: 'Đơn hàng đã đặt', state: 'completed' as const },
                { label: 'Shop đã xác nhận', state: 'completed' as const },
                { label: 'Đang giao đến bạn', state: order.status === 'shipping' ? 'current' as const : 'completed' as const },
                { label: 'Giao hàng thành công', state: order.status === 'received' ? 'current' as const : 'upcoming' as const },
              ],
      })))
    }

    void loadData()
  }, [])

  if (!isAuthenticated || !user) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-8 text-center">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Tài khoản khách hàng</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Vui lòng đăng nhập để xem thông tin tài khoản và đơn hàng.</p>
        <Button asChild className="mt-5">
          <Link to="/login">Đăng nhập</Link>
        </Button>
      </section>
    )
  }

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')

  const navItems: Array<{ id: AccountTab; label: string; icon: typeof Package }> = [
    { id: 'orders', label: 'Đơn hàng', icon: Package },
    { id: 'profile', label: 'Thông tin', icon: UserRound },
    { id: 'security', label: 'Bảo mật', icon: Lock },
  ]

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return orders

    return orders.filter((order) => {
      const itemNames = order.items.map((item) => item.name).join(' ').toLowerCase()
      return (
        order.id.toLowerCase().includes(normalizedQuery) ||
        order.date.toLowerCase().includes(normalizedQuery) ||
        statusLabelMap[order.status].toLowerCase().includes(normalizedQuery) ||
        itemNames.includes(normalizedQuery)
      )
    })
  }, [orders, searchQuery])

  const trackedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === trackedOrderId) ?? null,
    [filteredOrders, trackedOrderId],
  )

  const handleBuyAgain = (order: AccountOrder) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id)
      if (!product) return

      addToCart({
        product,
        size: product.sizes[0],
        color: product.colors[0],
        quantity: 1,
      })
    })
    navigate('/gio-hang')
  }

  return (
    <section className="mx-auto flex w-full max-w-[1100px] gap-8 py-2">
      <style>{`
        @keyframes rf-pulse-ring {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      <aside className="w-[200px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-sm font-semibold text-[var(--text-primary)]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-[var(--text-primary)]">{user.fullName}</p>
            <p className="truncate text-[13px] text-[var(--text-secondary)]">{user.email}</p>
          </div>
        </div>

        <div className="my-4 h-px bg-[var(--line-soft)]" />

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="my-4 h-px bg-[var(--line-soft)]" />

        <button
          type="button"
          onClick={logout}
          className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        {activeTab === 'orders' ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[260px] flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo mã đơn, ngày hoặc tên sản phẩm"
                  className="rf-input h-10 w-full rounded-lg pl-9 pr-3 text-sm"
                />
              </div>

              {trackedOrder ? (
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  Đang theo dõi <span className="font-semibold text-[var(--text-primary)]">{trackedOrder.id}</span>
                </div>
              ) : null}
            </div>

            {!filteredOrders.length ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
                Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm.
              </div>
            ) : null}

            {filteredOrders.map((order) => (
              <article
                key={order.id}
                className={`mb-3 rounded-xl border bg-[var(--surface-elevated)] p-5 last:mb-0 ${
                  trackedOrderId === order.id ? 'border-[var(--line-strong)]' : 'border-[var(--line)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--text-primary)]">{order.id} · {order.date}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassMap[order.status]}`}>
                    {statusLabelMap[order.status]}
                  </span>
                </div>

                <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="h-11 w-9 overflow-hidden rounded-md border border-white/15 bg-[#E8E5E0]"
                          >
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        <p>{order.items.map((item) => item.name).join(', ')}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {order.items.map((item) => {
                            const wished = isWishlisted(item.id)
                            return (
                              <button
                                key={`${order.id}-${item.id}`}
                                type="button"
                                onClick={() => toggleWishlist(item.id)}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                                  wished
                                    ? 'border-[var(--line-strong)] bg-[var(--surface-muted)] text-[var(--text-primary)]'
                                    : 'border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                              >
                                <Heart size={12} className={wished ? 'fill-current' : ''} />
                                Yêu thích
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-[var(--text-primary)]">
                        Tổng thanh toán: <span className="font-semibold">{formatVnd(order.total)}</span>
                      </p>
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTrackedOrderId(order.id)}
                          className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-4 text-sm text-[var(--text-primary)]"
                        >
                          {trackedOrderId === order.id ? 'Đang theo dõi' : 'Theo dõi'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBuyAgain(order)}
                          className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-4 text-sm font-medium text-[var(--text-primary)]"
                        >
                          Mua lại
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-0.5">
                      {order.tracking.map((step, index) => {
                        const isCompleted = step.state === 'completed'
                        const isCurrent = step.state === 'current'
                        const isLast = index === order.tracking.length - 1
                        return (
                          <div key={`${order.id}-${step.label}`} className="relative flex gap-2.5 pb-4 last:pb-0">
                            <div className="relative flex w-4 justify-center">
                              <span
                                className={`mt-0.5 h-4 w-4 rounded-full ${
                                  isCompleted
                                    ? 'bg-[var(--text-primary)]'
                                    : isCurrent
                                      ? 'bg-[var(--text-primary)]'
                                      : 'bg-[var(--line)]'
                                }`}
                              />
                              {isCurrent ? (
                                <span
                                  className="absolute left-1/2 top-0.5 h-4 w-4 -translate-x-1/2 rounded-full border border-[var(--text-primary)]/70"
                                  style={{ animation: 'rf-pulse-ring 1.5s ease-out infinite' }}
                                />
                              ) : null}
                              {!isLast ? (
                                <span
                                  className={`absolute top-5 h-[calc(100%-10px)] w-px ${
                                    isCompleted
                                      ? 'bg-[var(--text-primary)]'
                                      : 'bg-[var(--line-soft)]'
                                  }`}
                                />
                              ) : null}
                            </div>
                            <p className="text-[13px] text-[var(--text-secondary)]">{step.label}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === 'profile' ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5">
            <h2 className="font-display text-xl text-[var(--text-primary)]">Thông tin tài khoản</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={user.fullName} readOnly className="rf-input rounded-lg px-3 py-2 text-sm" />
              <input value={user.email} readOnly className="rf-input rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        ) : null}

        {activeTab === 'security' ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5">
            <h2 className="font-display text-xl text-[var(--text-primary)]">Bảo mật</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
            <div className="mt-4 max-w-[420px] space-y-2.5">
              <input type="password" placeholder="Mật khẩu hiện tại" className="rf-input w-full rounded-lg px-3 py-2 text-sm" />
              <input type="password" placeholder="Mật khẩu mới" className="rf-input w-full rounded-lg px-3 py-2 text-sm" />
              <Button className="h-10 rounded-lg px-5">Cập nhật mật khẩu</Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}


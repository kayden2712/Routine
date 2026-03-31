import { Lock, Package, Search, UserRound } from 'lucide-react'
import { Client, type StompSubscription } from '@stomp/stompjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountOrderCard } from '@/components/account/AccountOrderCard'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { Button } from '@/components/ui/button'
import { fetchMyOrdersApi, fetchProductsApi } from '@/lib/backendApi'
import { buildAccountTracking, orderStatusLabelMap } from '@/lib/orderStatus'
import { ORDER_STATUS_CHANGED_TOPIC, resolveWebSocketUrl } from '@/lib/websocket'
import { useCartStore } from '@/store/cartStore'
import { useCustomerAuthStore } from '@/store/customerAuthStore'
import type { AccountOrder, AccountTab } from '@/types/account'
import type { Product } from '@/types/customer.types'

function getOrderActivityTime(order: Pick<AccountOrder, 'createdAt' | 'updatedAt'>): Date {
  return order.updatedAt ?? order.createdAt
}

function mapOrdersForAccount(orderList: Awaited<ReturnType<typeof fetchMyOrdersApi>>, productList: Product[]): AccountOrder[] {
  return orderList
    .map((order) => ({
      orderId: order.id,
      id: `#${order.orderNumber}`,
      date: new Intl.DateTimeFormat('vi-VN').format(order.createdAt),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      status: order.status,
      subtotal: order.subtotal ?? 0,
      discount: order.discount ?? 0,
      shippingFee: 0,
      total: order.total,
      notes: order.notes,
      items: order.items.map((item) => {
        const product = productList.find((value) => value.id === item.productId)
        return {
          id: item.productId,
          name: item.productName,
          image: product?.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
        }
      }),
      tracking: buildAccountTracking(order.status),
    }))
    .sort((a, b) => getOrderActivityTime(b).getTime() - getOrderActivityTime(a).getTime())
}

export const AccountPage = () => {
  const user = useCustomerAuthStore((state) => state.user)
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated)
  const logout = useCustomerAuthStore((state) => state.logout)
  const addToCart = useCartStore((state) => state.addToCart)
  const [activeTab, setActiveTab] = useState<AccountTab>('orders')
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const productsRef = useRef<Product[]>([])

  useEffect(() => {
    productsRef.current = products
  }, [products])

  useEffect(() => {
    let isCancelled = false

    const loadInitialData = async () => {
      try {
        const [orderList, productList] = await Promise.all([
          fetchMyOrdersApi(),
          fetchProductsApi(),
        ])

        if (isCancelled) return

        setProducts(productList)
        setOrders(mapOrdersForAccount(orderList, productList))
      } catch (error) {
        console.error('Không thể tải dữ liệu tài khoản:', error)
      }
    }

    void loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'orders') {
      return
    }

    let cancelled = false
    let subscription: StompSubscription | null = null

    const refreshOrders = async () => {
      try {
        const orderList = await fetchMyOrdersApi()
        if (cancelled) return
        setOrders(mapOrdersForAccount(orderList, productsRef.current))
      } catch (error) {
        console.error('Không thể tự cập nhật trạng thái đơn hàng:', error)
      }
    }

    const wsClient = new Client({
      brokerURL: resolveWebSocketUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        subscription = wsClient.subscribe(ORDER_STATUS_CHANGED_TOPIC, () => {
          void refreshOrders()
        })
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body)
      },
    })

    wsClient.activate()

    const handleWindowFocus = () => {
      void refreshOrders()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshOrders()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      subscription?.unsubscribe()
      wsClient.deactivate()
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTab, isAuthenticated])

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

  const navItems = [
    { id: 'orders', label: 'Đơn hàng', icon: Package },
    { id: 'profile', label: 'Thông tin', icon: UserRound },
    { id: 'security', label: 'Bảo mật', icon: Lock },
  ] as const

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return orders

    return orders.filter((order) => {
      const itemNames = order.items.map((item) => item.name).join(' ').toLowerCase()
      return (
        order.id.toLowerCase().includes(normalizedQuery) ||
        order.date.toLowerCase().includes(normalizedQuery) ||
        orderStatusLabelMap[order.status].toLowerCase().includes(normalizedQuery) ||
        itemNames.includes(normalizedQuery)
      )
    })
  }, [orders, searchQuery])

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
  }

  // TODO: Re-enable cancel order UI when ready

  return (
    <section className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <AccountSidebar
          initials={initials}
          email={user.email}
          navItems={[...navItems]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={logout}
        />

        <div className="min-w-0 flex-1">
        {activeTab === 'orders' ? (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-between">
              <h2 className="text-[40px] leading-none tracking-tight text-[#2D2A24]">Lịch sử đơn hàng</h2>
              <div className="relative w-full max-w-[360px]">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  className="h-11 w-full rounded-full border border-[#DDD5C7] bg-white pl-10 pr-10 text-sm text-[#3E3A34] outline-none transition-shadow placeholder:text-[#9A8F7C] focus:ring-2 focus:ring-[#C7B28F]/40"
                />
                <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#A5967D]" />
              </div>
            </div>

            {!filteredOrders.length ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
                Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm.
              </div>
            ) : null}

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <AccountOrderCard key={order.id} order={order} onBuyAgain={handleBuyAgain} />
              ))}
            </div>
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
      </div>
    </section>
  )
}


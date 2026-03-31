import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })))
const ProductListPage = lazy(() => import('@/pages/ProductListPage').then((module) => ({ default: module.ProductListPage })))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const CartPage = lazy(() => import('@/pages/CartPage').then((module) => ({ default: module.CartPage })))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage').then((module) => ({ default: module.OrderSuccessPage })))
const SupportCenterPage = lazy(() => import('@/pages/SupportCenterPage').then((module) => ({ default: module.SupportCenterPage })))
const AccountPage = lazy(() => import('@/pages/AccountPage').then((module) => ({ default: module.AccountPage })))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })))
const CustomerLoginPage = lazy(() => import('@/pages/CustomerLoginPage').then((module) => ({ default: module.CustomerLoginPage })))
const CustomerRegisterPage = lazy(() => import('@/pages/CustomerRegisterPage').then((module) => ({ default: module.CustomerRegisterPage })))

const withSuspense = (element: JSX.Element) => (
  <Suspense fallback={<div className="py-16 text-center text-sm text-[var(--text-secondary)]">Đang tải...</div>}>
    {element}
  </Suspense>
)

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <AnnouncementBar />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'san-pham', element: withSuspense(<ProductListPage />) },
      { path: 'san-pham/:productId', element: withSuspense(<ProductDetailPage />) },
      { path: 'products', element: <Navigate to="/san-pham" replace /> },
      { path: 'products/:productId', element: <Navigate to="/san-pham" replace /> },
      { path: 'gio-hang', element: withSuspense(<CartPage />) },
      { path: 'cart', element: <Navigate to="/gio-hang" replace /> },
      { path: 'checkout', element: withSuspense(<CheckoutPage />) },
      { path: 'order-success', element: withSuspense(<OrderSuccessPage />) },
      { path: 'trung-tam-ho-tro', element: withSuspense(<SupportCenterPage />) },
      { path: 'tai-khoan', element: withSuspense(<AccountPage />) },
      { path: 'account', element: <Navigate to="/tai-khoan" replace /> },
      { path: 'tai-khoan/don-hang/:orderId', element: withSuspense(<OrderDetailPage />) },
      { path: 'account/order/:orderId', element: withSuspense(<OrderDetailPage />) },
      { path: 'login', element: withSuspense(<CustomerLoginPage />) },
      { path: 'register', element: withSuspense(<CustomerRegisterPage />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

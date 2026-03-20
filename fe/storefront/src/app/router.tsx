import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { AccountPage } from '@/pages/AccountPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { CustomerLoginPage } from '@/pages/CustomerLoginPage'
import { CustomerRegisterPage } from '@/pages/CustomerRegisterPage'
import { HomePage } from '@/pages/HomePage'
import { OrderSuccessPage } from '@/pages/OrderSuccessPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { ProductListPage } from '../pages/ProductListPage'
import { SupportCenterPage } from '../pages/SupportCenterPage'

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
      { index: true, element: <HomePage /> },
      { path: 'san-pham', element: <ProductListPage /> },
      { path: 'san-pham/:productId', element: <ProductDetailPage /> },
      { path: 'products', element: <Navigate to="/san-pham" replace /> },
      { path: 'products/:productId', element: <Navigate to="/san-pham" replace /> },
      { path: 'gio-hang', element: <CartPage /> },
      { path: 'cart', element: <Navigate to="/gio-hang" replace /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-success', element: <OrderSuccessPage /> },
      { path: 'trung-tam-ho-tro', element: <SupportCenterPage /> },
      { path: 'tai-khoan', element: <AccountPage /> },
      { path: 'account', element: <Navigate to="/tai-khoan" replace /> },
      { path: 'login', element: <CustomerLoginPage /> },
      { path: 'register', element: <CustomerRegisterPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

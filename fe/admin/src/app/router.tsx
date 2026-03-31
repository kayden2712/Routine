import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RouteErrorBoundary } from '@/components/shared/RouteErrorBoundary';
import { CustomersPage } from '../pages/CustomersPage';
import { DashboardPage } from '../pages/DashboardPage';
import { InventoryPage } from '../pages/InventoryPage';
import { InvoicesPage } from '../pages/InvoicesPage';
import { OnlineOrdersPage } from '../pages/OnlineOrdersPage';
import { LoginPage } from '../pages/LoginPage';
import { POSPage } from '../pages/POSPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StaffPage } from '../pages/StaffPage';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

function getRoleHome(role: UserRole) {
  if (role === 'manager') return '/dashboard';
  if (role === 'sales') return '/pos';
  if (role === 'accountant') return '/reports';
  return '/products';
}

interface GuardProps {
  roles?: UserRole[];
  children: ReactNode;
}

function ProtectedRoute({ roles, children }: GuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleHome(user.role)} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell>
          <Outlet />
        </AppShell>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute roles={['manager']}>
            <DashboardPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/pos',
        element: (
          <ProtectedRoute roles={['sales', 'manager']}>
            <POSPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/products',
        element: (
          <ProtectedRoute roles={['sales', 'manager']}>
            <ProductsPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/customers',
        element: (
          <ProtectedRoute roles={['sales', 'manager']}>
            <CustomersPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute roles={['manager', 'accountant']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/inventory',
        element: (
          <ProtectedRoute roles={['manager', 'warehouse']}>
            <InventoryPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/staff',
        element: (
          <ProtectedRoute roles={['manager']}>
            <StaffPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/invoices',
        element: (
          <ProtectedRoute roles={['manager', 'accountant']}>
            <InvoicesPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/online-orders',
        element: (
          <ProtectedRoute roles={['manager', 'accountant']}>
            <OnlineOrdersPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
]);

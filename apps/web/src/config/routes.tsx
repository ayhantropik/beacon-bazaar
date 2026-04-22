import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import AdminLayout from '@layouts/AdminLayout';
import Spinner from '@components/atoms/Spinner';
import RouteErrorPage from '@components/organisms/ErrorBoundary/RouteErrorPage';

const HomePage = lazy(() => import('@pages/HomePage'));
const MapPage = lazy(() => import('@pages/MapPage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));
const RegisterPage = lazy(() => import('@pages/RegisterPage'));
const StoreDetailPage = lazy(() => import('@pages/StoreDetailPage'));
const ProductDetailPage = lazy(() => import('@pages/ProductDetailPage'));
const SearchResultsPage = lazy(() => import('@pages/SearchResultsPage'));
const CartPage = lazy(() => import('@pages/CartPage'));
const CheckoutPage = lazy(() => import('@pages/CheckoutPage'));
const ProfilePage = lazy(() => import('@pages/ProfilePage'));
const OrdersPage = lazy(() => import('@pages/OrdersPage'));
const GiftPickerPage = lazy(() => import('@pages/GiftPickerPage'));
const DashboardPage = lazy(() => import('@pages/DashboardPage'));
const CreateStorePage = lazy(() => import('@pages/CreateStorePage'));
const OtoListingPage = lazy(() => import('@pages/OtoListingPage'));
const EmlakListingPage = lazy(() => import('@pages/EmlakListingPage'));
const YemekListingPage = lazy(() => import('@pages/YemekListingPage'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));
const VerifyStorePage = lazy(() => import('@pages/VerifyStorePage'));
const AnchorTool = lazy(() => import('@features/indoor-map/components/AnchorTool'));
const FloorOverlay = lazy(() => import('@features/indoor-map/components/FloorOverlay'));
const StoreOverlay = lazy(() => import('@features/indoor-map/components/StoreOverlay'));
const IndoorMapFull = lazy(() => import('@features/indoor-map/components/IndoorMapFull'));
const PolygonEditor = lazy(() => import('@features/indoor-map/components/PolygonEditor'));

// Admin pages
const AdminDashboardPage = lazy(() => import('@pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@pages/admin/AdminUserDetailPage'));
const AdminStoresPage = lazy(() => import('@pages/admin/AdminStoresPage'));
const AdminStoreDetailPage = lazy(() => import('@pages/admin/AdminStoreDetailPage'));
const AdminProductsPage = lazy(() => import('@pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('@pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@pages/admin/AdminOrderDetailPage'));
const AdminAuctionsPage = lazy(() => import('@pages/admin/AdminAuctionsPage'));
const AdminModerationPage = lazy(() => import('@pages/admin/AdminModerationPage'));
const AdminNotificationsPage = lazy(() => import('@pages/admin/AdminNotificationsPage'));
const AdminReportsPage = lazy(() => import('@pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@pages/admin/AdminSettingsPage'));
const AdminSubscriptionsPage = lazy(() => import('@pages/admin/AdminSubscriptionsPage'));
const AdminServicesPage = lazy(() => import('@pages/admin/AdminServicesPage'));

function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner fullScreen />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: (
          <LazyLoad>
            <HomePage />
          </LazyLoad>
        ),
      },
      {
        path: 'store/:slug',
        element: (
          <LazyLoad>
            <StoreDetailPage />
          </LazyLoad>
        ),
      },
      {
        path: 'product/:slug',
        element: (
          <LazyLoad>
            <ProductDetailPage />
          </LazyLoad>
        ),
      },
      {
        path: 'search',
        element: (
          <LazyLoad>
            <SearchResultsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'cart',
        element: (
          <LazyLoad>
            <CartPage />
          </LazyLoad>
        ),
      },
      {
        path: 'checkout',
        element: (
          <LazyLoad>
            <CheckoutPage />
          </LazyLoad>
        ),
      },
      {
        path: 'profile',
        element: (
          <LazyLoad>
            <ProfilePage />
          </LazyLoad>
        ),
      },
      {
        path: 'orders',
        element: (
          <LazyLoad>
            <OrdersPage />
          </LazyLoad>
        ),
      },
      {
        path: 'gift-picker',
        element: (
          <LazyLoad>
            <GiftPickerPage />
          </LazyLoad>
        ),
      },
      {
        path: 'map',
        element: (
          <LazyLoad>
            <MapPage />
          </LazyLoad>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <LazyLoad>
            <DashboardPage />
          </LazyLoad>
        ),
      },
      {
        path: 'oto',
        element: (
          <LazyLoad>
            <OtoListingPage />
          </LazyLoad>
        ),
      },
      {
        path: 'emlak',
        element: (
          <LazyLoad>
            <EmlakListingPage />
          </LazyLoad>
        ),
      },
      {
        path: 'yemek',
        element: (
          <LazyLoad>
            <YemekListingPage />
          </LazyLoad>
        ),
      },
      {
        path: 'polygon-editor',
        element: (
          <LazyLoad>
            <PolygonEditor />
          </LazyLoad>
        ),
      },
      {
        path: 'indoor-map-full',
        element: (
          <LazyLoad>
            <IndoorMapFull />
          </LazyLoad>
        ),
      },
      {
        path: 'store-overlay',
        element: (
          <LazyLoad>
            <StoreOverlay />
          </LazyLoad>
        ),
      },
      {
        path: 'floor-overlay',
        element: (
          <LazyLoad>
            <FloorOverlay />
          </LazyLoad>
        ),
      },
      {
        path: 'anchor-tool',
        element: (
          <LazyLoad>
            <AnchorTool />
          </LazyLoad>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <LazyLoad>
            <VerifyStorePage />
          </LazyLoad>
        ),
      },
      {
        path: 'verify-store',
        element: (
          <LazyLoad>
            <VerifyStorePage />
          </LazyLoad>
        ),
      },
      {
        path: 'dashboard/create-store',
        element: (
          <LazyLoad>
            <CreateStorePage />
          </LazyLoad>
        ),
      },
      {
        path: 'dashboard/edit-store',
        element: (
          <LazyLoad>
            <CreateStorePage />
          </LazyLoad>
        ),
      },
      {
        path: '*',
        element: (
          <LazyLoad>
            <NotFoundPage />
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: 'admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LazyLoad><AdminDashboardPage /></LazyLoad> },
      { path: 'users', element: <LazyLoad><AdminUsersPage /></LazyLoad> },
      { path: 'users/:id', element: <LazyLoad><AdminUserDetailPage /></LazyLoad> },
      { path: 'stores', element: <LazyLoad><AdminStoresPage /></LazyLoad> },
      { path: 'stores/:id', element: <LazyLoad><AdminStoreDetailPage /></LazyLoad> },
      { path: 'products', element: <LazyLoad><AdminProductsPage /></LazyLoad> },
      { path: 'orders', element: <LazyLoad><AdminOrdersPage /></LazyLoad> },
      { path: 'orders/:id', element: <LazyLoad><AdminOrderDetailPage /></LazyLoad> },
      { path: 'auctions', element: <LazyLoad><AdminAuctionsPage /></LazyLoad> },
      { path: 'moderation', element: <LazyLoad><AdminModerationPage /></LazyLoad> },
      { path: 'notifications', element: <LazyLoad><AdminNotificationsPage /></LazyLoad> },
      { path: 'reports', element: <LazyLoad><AdminReportsPage /></LazyLoad> },
      { path: 'services', element: <LazyLoad><AdminServicesPage /></LazyLoad> },
      { path: 'subscriptions', element: <LazyLoad><AdminSubscriptionsPage /></LazyLoad> },
      { path: 'settings', element: <LazyLoad><AdminSettingsPage /></LazyLoad> },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: 'login',
        element: (
          <LazyLoad>
            <LoginPage />
          </LazyLoad>
        ),
      },
      {
        path: 'register',
        element: (
          <LazyLoad>
            <RegisterPage />
          </LazyLoad>
        ),
      },
    ],
  },
]);

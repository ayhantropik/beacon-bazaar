import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import Spinner from '@components/atoms/Spinner';

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
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner fullScreen />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
        path: 'map',
        element: (
          <LazyLoad>
            <MapPage />
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
    element: <AuthLayout />,
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

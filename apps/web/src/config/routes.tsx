import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import Spinner from '@components/atoms/Spinner';

const HomePage = lazy(() => import('@pages/HomePage'));
const MapPage = lazy(() => import('@pages/MapPage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));
const RegisterPage = lazy(() => import('@pages/RegisterPage'));
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

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ShecurityProvider } from './ShecurityProvider';
import { useShecurity } from './shecurity-context';
import { MarketingLayout } from '../components/layout/MarketingLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { Loader } from '../components/ui/Loader';

const Landing = lazy(() => import('../pages/Landing'));
const Features = lazy(() => import('../pages/Features'));
const HowItWorks = lazy(() => import('../pages/HowItWorks'));
const Demo = lazy(() => import('../pages/Demo'));
const Privacy = lazy(() => import('../pages/Privacy'));
const Login = lazy(() => import('../pages/Login'));
const Signup = lazy(() => import('../pages/Signup'));
const Onboarding = lazy(() => import('../pages/Onboarding'));
const Calculator = lazy(() => import('../pages/Calculator'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Contacts = lazy(() => import('../pages/Contacts'));
const Vault = lazy(() => import('../pages/Vault'));
const Settings = lazy(() => import('../pages/Settings'));
const VerifyEvidence = lazy(() => import('../pages/VerifyEvidence'));
const AlertScreen = lazy(() => import('../pages/AlertScreen'));
const NotFound = lazy(() => import('../pages/NotFound'));

function PageFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Loader />
    </div>
  );
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useShecurity();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

function MarketingOutlet() {
  return (
    <LayoutWrapper>
      <MarketingLayout>
        <Outlet />
      </MarketingLayout>
    </LayoutWrapper>
  );
}

function AppOutlet() {
  return (
    <LayoutWrapper>
      <Protected>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </Protected>
    </LayoutWrapper>
  );
}

function BareOutlet() {
  return (
    <LayoutWrapper>
      <Outlet />
    </LayoutWrapper>
  );
}

export function AppRoutes() {
  const router = createBrowserRouter([
    {
      element: <MarketingOutlet />,
      children: [
        { path: '/', element: <Landing /> },
        { path: '/features', element: <Features /> },
        { path: '/how-it-works', element: <HowItWorks /> },
        { path: '/privacy', element: <Privacy /> },
        { path: '/verify', element: <VerifyEvidence /> },
        { path: '/login', element: <Login /> },
        { path: '/signup', element: <Signup /> },
        { path: '/demo', element: <Demo /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    {
      element: <BareOutlet />,
      children: [
        { path: '/onboarding', element: <Onboarding /> },
        { path: '/calculator', element: <Calculator /> },
        { path: '/alert', element: <AlertScreen /> },
      ],
    },
    {
      element: <AppOutlet />,
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/contacts', element: <Contacts /> },
        { path: '/vault', element: <Vault /> },
        { path: '/settings', element: <Settings /> },
      ],
    },
  ]);
  return (
    <ShecurityProvider>
      <RouterProvider router={router} />
    </ShecurityProvider>
  );
}

import { Suspense, lazy } from 'react';
import HomePage from '@/pages/HomePage.jsx';
import CompaniesPage from '@/pages/CompaniesPage.jsx';
import { usePath } from '@/lib/router';

// The admin area is a separate chunk, only loaded when someone visits /admin by URL.
const AdminApp = lazy(() => import('@/features/admin/AdminApp.jsx'));

export default function App() {
  const path = usePath();
  if (/^\/admin(\/|$)/.test(path)) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }
  if (/^\/companies(\/|$)/.test(path)) return <CompaniesPage />;
  return <HomePage />;
}

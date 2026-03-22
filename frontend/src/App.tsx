import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductEdit from './pages/admin/AdminProductEdit';
import AdminLeads from './pages/admin/AdminLeads';
import { getToken } from './api';

function RequireAdmin({ children }: { children: ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/product/:id" element={<ProductPage />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductEdit />} />
        <Route path="products/:id" element={<AdminProductEdit />} />
        <Route path="leads" element={<AdminLeads />} />
      </Route>
    </Routes>
  );
}

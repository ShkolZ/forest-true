import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { ToastProvider } from './hooks/useToast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/layout/AppLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import DashboardProducts from './pages/dashboard/DashboardProducts'
import DashboardUsers from './pages/dashboard/DashboardUsers'
import DashboardOrders from './pages/dashboard/DashboardOrders'
import Spinner from './components/ui/Spinner'

function AppRoutes() {
  const { hydrate, isLoading } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-brand-600">
        <Spinner size={48} />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/products" element={<ProductsPage />} />
      </Route>
      <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route path="/dashboard" element={<Navigate to="/dashboard/products" replace />} />
        <Route path="/dashboard/products" element={<DashboardProducts />} />
        <Route path="/dashboard/users" element={<DashboardUsers />} />
        <Route path="/dashboard/orders" element={<DashboardOrders />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Spinner from './ui/Spinner'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size={48} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/products" replace />
  }

  return children
}

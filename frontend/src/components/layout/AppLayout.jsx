import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import './AppLayout.css'

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuthStore()
  const items = useCartStore((s) => s.items)
  const navigate = useNavigate()
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/products" className="topbar__brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="topbar__logo-icon">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.5" fill="hsla(152, 60%, 45%, 0.15)" />
              <path d="M12 2v20M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="topbar__brand-text">Forest True</span>
          </Link>

          <nav className="topbar__nav">
            {isAdmin && (
              <Link to="/dashboard/products" className="topbar__link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Dashboard
              </Link>
            )}

            <div className="topbar__cart-indicator">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {totalItems > 0 && (
                <span className="topbar__cart-badge">{totalItems}</span>
              )}
            </div>

            <div className="topbar__user">
              <div className="topbar__avatar">
                {user?.id ? user.id.charAt(0).toUpperCase() : 'U'}
              </div>
              <button onClick={handleLogout} className="topbar__logout" title="Logout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

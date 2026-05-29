import { useState, useEffect } from 'react'
import { productsApi } from '../api/products'
import { ordersApi } from '../api/orders'
import { useCartStore } from '../stores/cartStore'
import { useToast } from '../hooks/useToast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import './ProductsPage.css'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore()
  const { addToast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll()
      setProducts(res.data || [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const getItemQuantity = (productId) => {
    const item = items.find((i) => i.productId === productId)
    return item ? item.quantity : 0
  }

  const handleSubmitOrder = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    try {
      await ordersApi.create({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      })
      clearCart()
      addToast('Order submitted successfully!', 'success')
    } catch (err) {
      addToast(err.response?.data || 'Failed to submit order', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="products-page__loading">
        <Spinner size={48} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="products-page__error">
        <p>{error}</p>
        <Button onClick={fetchProducts}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="products-page">
      <div className="products-page__main">
        <div className="products-page__header animate-fade-in-down">
          <div>
            <h1 className="products-page__title">Our Furniture</h1>
            <p className="products-page__subtitle">
              Browse our collection and build your order
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="products-page__empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <p>No products available yet</p>
          </div>
        ) : (
          <div className="products-grid stagger-children">
            {products.map((product) => {
              const qty = getItemQuantity(product.id)
              return (
                <Card key={product.id} hoverable className="product-card">
                  <Card.Image
                    src={product.image_url}
                    alt={product.name}
                    fallback={product.name}
                  />
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Description>
                      {product.description || 'Premium furniture piece'}
                    </Card.Description>
                  </Card.Body>
                  <Card.Footer>
                    {qty === 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => addItem(product)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add to Order
                      </Button>
                    ) : (
                      <div className="product-card__qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, qty - 1)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, qty + 1)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button
                          className="qty-remove"
                          onClick={() => removeItem(product.id)}
                          title="Remove"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </Card.Footer>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart sidebar */}
      {items.length > 0 && (
        <aside className="cart-panel animate-slide-in-right">
          <div className="cart-panel__header">
            <h3 className="cart-panel__title">Your Order</h3>
            <span className="cart-panel__count">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          <div className="cart-panel__items">
            {items.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item__info">
                  <span className="cart-item__name">{item.product.name}</span>
                  <span className="cart-item__qty">Qty: {item.quantity}</span>
                </div>
                <button
                  className="cart-item__remove"
                  onClick={() => removeItem(item.productId)}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-panel__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
            >
              Clear All
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleSubmitOrder}
            >
              Submit Order
            </Button>
          </div>
        </aside>
      )}
    </div>
  )
}

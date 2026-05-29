import { useState, useEffect } from 'react'
import { productsApi } from '../../api/products'
import { useToast } from '../../hooks/useToast'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import './DashboardPage.css'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  {
    key: 'description',
    label: 'Description',
    render: (val) => (
      <span className="table-cell-truncate">{val || '—'}</span>
    ),
  },
  {
    key: 'image_url',
    label: 'Image',
    width: '80px',
    render: (val) =>
      val ? (
        <img src={val} alt="" className="table-cell-thumb" />
      ) : (
        <span className="table-cell-na">—</span>
      ),
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (val) => val ? new Date(val).toLocaleDateString() : '—',
  },
  {
    key: 'actions',
    label: '',
    width: '140px',
    render: (_, row) => null, // filled in dynamically
  },
]

const emptyForm = { name: '', description: '', image_url: '' }

export default function DashboardProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await productsApi.getAll()
      setProducts(res.data || [])
    } catch {
      addToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || '',
      image_url: product.image_url || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, form)
        addToast('Product updated', 'success')
      } else {
        await productsApi.create(form)
        addToast('Product created', 'success')
      }
      setModalOpen(false)
      fetchProducts()
    } catch (err) {
      addToast(err.response?.data || 'Operation failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    try {
      await productsApi.delete(product.id)
      addToast('Product deleted', 'success')
      fetchProducts()
    } catch (err) {
      addToast(err.response?.data || 'Delete failed', 'error')
    }
  }

  const columnsWithActions = COLUMNS.map((col) =>
    col.key === 'actions'
      ? {
          ...col,
          render: (_, row) => (
            <div className="table-actions">
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(row)}>
                <span style={{ color: 'var(--color-danger)' }}>Delete</span>
              </Button>
            </div>
          ),
        }
      : col
  )

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">Products</h1>
          <p className="dashboard-page__subtitle">
            Manage your furniture catalog
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Product
        </Button>
      </div>

      <Table
        columns={columnsWithActions}
        data={products}
        loading={loading}
        emptyMessage="No products yet. Create your first one!"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            id="product-name"
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Oak Dining Table"
            required
          />
          <Input
            id="product-description"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the product"
          />
          <Input
            id="product-image"
            label="Image URL"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          <div className="modal-form__actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

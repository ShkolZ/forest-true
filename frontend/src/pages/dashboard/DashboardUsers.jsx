import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users'
import { useToast } from '../../hooks/useToast'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import './DashboardPage.css'

const COLUMNS = [
  { key: 'username', label: 'Username' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  {
    key: 'created_at',
    label: 'Created',
    render: (val) => val ? new Date(val).toLocaleDateString() : '—',
  },
  {
    key: 'actions',
    label: '',
    width: '140px',
    render: () => null,
  },
]

const emptyForm = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
}

export default function DashboardUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await usersApi.getAll()
      setUsers(res.data || [])
    } catch {
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({
      username: user.username,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingUser) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await usersApi.update(editingUser.id, payload)
        addToast('User updated', 'success')
      } else {
        await usersApi.create(form)
        addToast('User created', 'success')
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      addToast(err.response?.data || 'Operation failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return
    try {
      await usersApi.delete(user.id)
      addToast('User deleted', 'success')
      fetchUsers()
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
          <h1 className="dashboard-page__title">Users</h1>
          <p className="dashboard-page__subtitle">
            Manage user accounts
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add User
        </Button>
      </div>

      <Table
        columns={columnsWithActions}
        data={users}
        loading={loading}
        emptyMessage="No users yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            id="user-username"
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="username"
            required
          />
          <Input
            id="user-password"
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editingUser ? '••••••••' : 'Create a password'}
            required={!editingUser}
          />
          <div className="modal-form__row">
            <Input
              id="user-firstname"
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="John"
              required
            />
            <Input
              id="user-lastname"
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
          <div className="modal-form__actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

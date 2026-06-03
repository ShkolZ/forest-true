import { useState, useEffect, useCallback, type FormEvent } from "react";
import { usersApi } from "../../api/users";
import { useToast } from "../../hooks/useToast";
import { ApiError } from "../../api/client";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import type { Column, User } from "../../types";

const emptyForm = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
};

export default function DashboardUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadUsers = useCallback(async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data || []);
    } catch {
      addToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void (async () => {
      await loadUsers();
    })();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: Partial<typeof form> = { ...form };
        if (!payload.password) delete payload.password;
        await usersApi.update(editingUser.id, payload);
        addToast("User updated", "success");
      } else {
        await usersApi.create(form);
        addToast("User created", "success");
      }
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Operation failed";
      addToast(msg || "Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    const snapshot = users;
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    try {
      await usersApi.delete(user.id);
      addToast("User deleted", "success");
    } catch (err) {
      setUsers(snapshot);
      const msg = err instanceof ApiError ? err.message : "Delete failed";
      addToast(msg || "Delete failed", "error");
    }
  };

  const columns: Column<User>[] = [
    { key: "username", label: "Username" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    {
      key: "created_at",
      label: "Created",
      render: (val) => (val ? new Date(String(val)).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      label: "",
      width: "140px",
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row)}>
            <span className="text-red-600">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-slate-500">Manage user accounts</p>
        </div>
        <Button onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add User
        </Button>
      </div>

      <Table columns={columns} data={users} loading={loading} emptyMessage="No users yet." />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit User" : "Create User"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            label={editingUser ? "New Password (leave blank to keep)" : "Password"}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editingUser ? "••••••••" : "Create a password"}
            required={!editingUser}
          />
          <div className="grid grid-cols-2 gap-3">
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
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

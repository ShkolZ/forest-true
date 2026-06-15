import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
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
      addToast(t("users.failedLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

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
        addToast(t("users.userUpdated"), "success");
      } else {
        await usersApi.create(form);
        addToast(t("users.userCreated"), "success");
      }
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.operationFailed");
      addToast(msg || t("common.operationFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(t("users.confirmDelete", { name: user.username }))) return;
    const snapshot = users;
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    try {
      await usersApi.delete(user.id);
      addToast(t("users.userDeleted"), "success");
    } catch (err) {
      setUsers(snapshot);
      const msg = err instanceof ApiError ? err.message : t("common.deleteFailed");
      addToast(msg || t("common.deleteFailed"), "error");
    }
  };

  const columns: Column<User>[] = [
    { key: "username", label: t("users.username") },
    { key: "first_name", label: t("users.firstName") },
    { key: "last_name", label: t("users.lastName") },
    {
      key: "created_at",
      label: t("common.created"),
      render: (val) =>
        val ? new Date(String(val)).toLocaleDateString(i18n.language) : "—",
    },
    {
      key: "actions",
      label: "",
      width: "140px",
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            {t("common.edit")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row)}>
            <span className="text-red-600">{t("common.delete")}</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("users.title")}</h1>
          <p className="mt-1 text-slate-500">{t("users.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {t("users.addUser")}
        </Button>
      </div>

      <Table columns={columns} data={users} loading={loading} emptyMessage={t("users.empty")} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? t("users.editTitle") : t("users.createTitle")}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="user-username"
            label={t("users.username")}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder={t("users.usernamePlaceholder")}
            required
          />
          <Input
            id="user-password"
            label={editingUser ? t("users.newPassword") : t("users.password")}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editingUser ? t("users.passwordPlaceholderEdit") : t("users.passwordPlaceholderCreate")}
            required={!editingUser}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="user-firstname"
              label={t("users.firstName")}
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder={t("users.firstNamePlaceholder")}
              required
            />
            <Input
              id="user-lastname"
              label={t("users.lastName")}
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder={t("users.lastNamePlaceholder")}
              required
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={submitting}>
              {editingUser ? t("common.saveChanges") : t("users.createUser")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

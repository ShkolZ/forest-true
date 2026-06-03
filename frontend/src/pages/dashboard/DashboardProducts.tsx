import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react";
import { productsApi } from "../../api/products";
import { useToast } from "../../hooks/useToast";
import { ApiError } from "../../api/client";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import type { Column, Product } from "../../types";

const emptyForm = { name: "", description: "" };

function buildFormData(form: typeof emptyForm, file: File | null): FormData {
  const fd = new FormData();
  fd.append("name", form.name);
  fd.append("description", form.description);
  if (file) fd.append("image", file);
  return fd;
}

export default function DashboardProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data || []);
    } catch {
      addToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void (async () => {
      await loadProducts();
    })();
  }, [loadProducts]);

  const resetFileState = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    resetFileState();
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description || "" });
    setImageFile(null);
    setImagePreview(product.image_url || "");
    setModalOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildFormData(form, imageFile);
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        addToast("Product updated", "success");
      } else {
        await productsApi.create(payload);
        addToast("Product created", "success");
      }
      setModalOpen(false);
      resetFileState();
      await loadProducts();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Operation failed";
      addToast(msg || "Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    const snapshot = products;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      await productsApi.delete(product.id);
      addToast("Product deleted", "success");
    } catch (err) {
      setProducts(snapshot);
      const msg = err instanceof ApiError ? err.message : "Delete failed";
      addToast(msg || "Delete failed", "error");
    }
  };

  const columns: Column<Product>[] = [
    { key: "name", label: "Name" },
    {
      key: "description",
      label: "Description",
      render: (val) => (
        <span className="block max-w-xs truncate text-slate-500">
          {String(val ?? "") || "—"}
        </span>
      ),
    },
    {
      key: "image_url",
      label: "Image",
      width: "80px",
      render: (val) =>
        val ? (
          <img src={String(val)} alt="" className="h-10 w-10 rounded-md object-cover" />
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
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
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">Manage your furniture catalog</p>
        </div>
        <Button onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Product
        </Button>
      </div>

      <Table
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products yet. Create your first one!"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-image" className="text-sm font-medium text-slate-700">
              Image
            </label>
            <Input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 h-32 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

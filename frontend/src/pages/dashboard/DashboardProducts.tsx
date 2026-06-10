import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { productsApi } from "../../api/products";
import { detailsApi } from "../../api/details";
import { useToast } from "../../hooks/useToast";
import { ApiError } from "../../api/client";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import type { Column, Product, Detail } from "../../types";

const emptyForm = { name: "", description: "" };
const emptyPartForm = {
  name: "",
  width: "",
  length: "",
  amount: "",
  k_top: false,
  k_left: false,
  k_bottom: false,
  k_right: false,
};

// Edge-banding sides, used for both the form checkboxes and the table summary.
const EDGE_SIDES = [
  { key: "k_top", label: "Top", short: "T" },
  { key: "k_left", label: "Left", short: "L" },
  { key: "k_bottom", label: "Bottom", short: "B" },
  { key: "k_right", label: "Right", short: "R" },
] as const;

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

  // Parts ("details") state. Each product's parts are loaded on demand the
  // first time its row is expanded, then cached in `partsByProduct`.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [partsByProduct, setPartsByProduct] = useState<
    Record<string, Detail[]>
  >({});
  const [partsLoading, setPartsLoading] = useState<Record<string, boolean>>({});
  const [partForm, setPartForm] = useState(emptyPartForm);
  const [addingPart, setAddingPart] = useState(false);

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

  const loadParts = useCallback(
    async (productId: string) => {
      setPartsLoading((m) => ({ ...m, [productId]: true }));
      try {
        const data = await detailsApi.getByProduct(productId);
        setPartsByProduct((m) => ({ ...m, [productId]: data || [] }));
      } catch {
        addToast("Failed to load parts", "error");
      } finally {
        setPartsLoading((m) => ({ ...m, [productId]: false }));
      }
    },
    [addToast],
  );

  const toggleExpand = useCallback(
    (product: Product) => {
      const willExpand = expandedId !== product.id;
      setExpandedId(willExpand ? product.id : null);
      setPartForm(emptyPartForm);
      // Fetch parts the first time this product is opened.
      if (willExpand && partsByProduct[product.id] === undefined) {
        void loadParts(product.id);
      }
    },
    [expandedId, partsByProduct, loadParts],
  );

  const handleAddPart = async (e: FormEvent, productId: string) => {
    e.preventDefault();
    setAddingPart(true);
    try {
      const created = await detailsApi.create({
        product_id: productId,
        name: partForm.name,
        width: Number(partForm.width),
        length: Number(partForm.length),
        k_top: partForm.k_top,
        k_left: partForm.k_left,
        k_bottom: partForm.k_bottom,
        k_right: partForm.k_right,
        amount: Number(partForm.amount),
      });
      setPartsByProduct((m) => ({
        ...m,
        [productId]: [...(m[productId] || []), created],
      }));
      setPartForm(emptyPartForm);
      addToast("Part added", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to add part";
      addToast(msg || "Failed to add part", "error");
    } finally {
      setAddingPart(false);
    }
  };

  const handleDeletePart = async (productId: string, part: Detail) => {
    const snapshot = partsByProduct[productId] || [];
    setPartsByProduct((m) => ({
      ...m,
      [productId]: snapshot.filter((d) => d.id !== part.id),
    }));
    try {
      await detailsApi.delete(part.id);
      addToast("Part removed", "success");
    } catch (err) {
      setPartsByProduct((m) => ({ ...m, [productId]: snapshot }));
      const msg = err instanceof ApiError ? err.message : "Failed to remove part";
      addToast(msg || "Failed to remove part", "error");
    }
  };

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
    {
      key: "expand",
      label: "",
      width: "36px",
      render: (_, row) => (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-slate-400 transition-transform ${
            expandedId === row.id ? "rotate-90" : ""
          }`}
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
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
          <img
            src={String(val)}
            alt=""
            className="h-10 w-10 rounded-md object-cover"
          />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
          >
            <span className="text-red-600">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const renderParts = (product: Product) => {
    const parts = partsByProduct[product.id];
    const loadingParts = partsLoading[product.id];

    return (
      <div className="border-t border-slate-200 px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Parts {parts ? `(${parts.length})` : ""}
        </h3>

        {loadingParts ? (
          <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
            <Spinner size={16} /> Loading parts…
          </div>
        ) : !parts || parts.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">
            No parts yet. Add what this product is made of below.
          </p>
        ) : (
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-4 font-medium">Name</th>
                <th className="py-1.5 pr-4 font-medium">Width</th>
                <th className="py-1.5 pr-4 font-medium">Length</th>
                <th className="py-1.5 pr-4 font-medium">Edges</th>
                <th className="py-1.5 pr-4 font-medium">Amount</th>
                <th className="py-1.5" />
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id} className="border-t border-slate-200">
                  <td className="py-2 pr-4 font-medium text-slate-700">
                    {part.name}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{part.width}</td>
                  <td className="py-2 pr-4 text-slate-600">{part.length}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-1">
                      {EDGE_SIDES.map((side) => (
                        <span
                          key={side.key}
                          title={side.label}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold ${
                            part[side.key]
                              ? "bg-brand-100 text-brand-700"
                              : "bg-slate-100 text-slate-300"
                          }`}
                        >
                          {side.short}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">×{part.amount}</td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePart(product.id, part)}
                    >
                      <span className="text-red-600">Remove</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form
          onSubmit={(e) => handleAddPart(e, product.id)}
          className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4"
        >
          <div className="min-w-40 flex-1">
            <Input
              id={`part-name-${product.id}`}
              label="Part name"
              value={partForm.name}
              onChange={(e) =>
                setPartForm({ ...partForm, name: e.target.value })
              }
              placeholder="e.g. Table leg"
              required
            />
          </div>
          <div className="w-24">
            <Input
              id={`part-width-${product.id}`}
              label="Width"
              type="number"
              min={0}
              value={partForm.width}
              onChange={(e) =>
                setPartForm({ ...partForm, width: e.target.value })
              }
              required
            />
          </div>
          <div className="w-24">
            <Input
              id={`part-length-${product.id}`}
              label="Length"
              type="number"
              min={0}
              value={partForm.length}
              onChange={(e) =>
                setPartForm({ ...partForm, length: e.target.value })
              }
              required
            />
          </div>
          <div className="w-24">
            <Input
              id={`part-amount-${product.id}`}
              label="Amount"
              type="number"
              min={1}
              value={partForm.amount}
              onChange={(e) =>
                setPartForm({ ...partForm, amount: e.target.value })
              }
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Edges</span>
            <div className="flex h-10 items-center gap-3">
              {EDGE_SIDES.map((side) => (
                <label
                  key={side.key}
                  className="flex items-center gap-1.5 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                    checked={partForm[side.key]}
                    onChange={(e) =>
                      setPartForm({ ...partForm, [side.key]: e.target.checked })
                    }
                  />
                  {side.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" loading={addingPart}>
            Add Part
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">Manage your furniture catalog</p>
        </div>
        <Button onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Product
        </Button>
      </div>

      <Table
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={toggleExpand}
        expandedRowId={expandedId}
        renderExpanded={renderParts}
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
            <label
              htmlFor="product-image"
              className="text-sm font-medium text-slate-700"
            >
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

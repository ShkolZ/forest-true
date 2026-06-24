import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api/products";
import { categoriesApi } from "../api/categories";
import { ordersApi } from "../api/orders";
import { useCartStore } from "../stores/cartStore";
import { useToast } from "../hooks/useToast";
import { ApiError } from "../api/client";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import type { Product, Category } from "../types";

// Sentinel for the "All" filter pill — distinct from any real category title.
const ALL_CATEGORIES = "__all__";

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Active category lives in the URL (?category=<title>) so filtered views are
  // shareable, bookmarkable, and survive refresh / back-button navigation.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? ALL_CATEGORIES;
  const selectCategory = useCallback(
    (value: string) => {
      if (value === ALL_CATEGORIES) setSearchParams({});
      else setSearchParams({ category: value });
    },
    [setSearchParams],
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderTitle, setOrderTitle] = useState("");

  const {
    items,
    isOpen,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();
  const { addToast } = useToast();

  // Categories are best-effort and load once: a failure here shouldn't block
  // the storefront, which still renders with just the "All" pill.
  const loadCategories = useCallback(async () => {
    const cats = await categoriesApi.getAll().catch(() => [] as Category[]);
    setCategories(cats || []);
  }, []);

  // Filtering happens server-side: when a category is active we pass its title
  // so the backend returns only that category's products.
  const loadProducts = useCallback(async () => {
    try {
      const category =
        activeCategory === ALL_CATEGORIES ? undefined : activeCategory;
      const data = await productsApi.getAll(category);
      setProducts(data || []);
      setError(null);
    } catch {
      setError(t("storefront.failedLoad"));
    } finally {
      setLoading(false);
    }
  }, [activeCategory, t]);

  useEffect(() => {
    void (async () => {
      await loadCategories();
    })();
  }, [loadCategories]);

  // Refetches whenever the active category changes (loadProducts depends on it).
  useEffect(() => {
    void (async () => {
      await loadProducts();
    })();
  }, [loadProducts]);

  const handleRetry = () => {
    setLoading(true);
    loadProducts();
  };

  const getItemQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0 || !orderTitle.trim()) return;
    setSubmitting(true);
    try {
      await ordersApi.create({
        title: orderTitle.trim(),
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      });
      clearCart();
      closeCart();
      setOrderTitle("");
      addToast(t("storefront.orderSubmitted"), "success");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : t("storefront.failedSubmit");
      addToast(msg || t("storefront.failedSubmit"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-brand-600">
        <Spinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
        <p>{error}</p>
        <Button onClick={handleRetry}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div>
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">
            {t("storefront.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {t("storefront.subtitle")}
          </p>
        </div>

        {categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={() => selectCategory(ALL_CATEGORIES)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === ALL_CATEGORIES
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("storefront.allCategories")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.title)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.title
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          activeCategory === ALL_CATEGORIES ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-20 text-slate-400">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </svg>
              <p>{t("storefront.empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-20 text-slate-400">
              <p>{t("storefront.emptyCategory")}</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-4 sm:gap-5">
            {products.map((product) => {
              const qty = getItemQuantity(product.id);
              const categoryTitle =
                categories.find((c) => c.id === product.category_id)?.title ??
                product.category;
              return (
                <Card key={product.id} hoverable>
                  <Card.Image
                    src={product.image_url}
                    alt={product.name}
                    fallback={product.name}
                  />
                  <Card.Body>
                    {categoryTitle && (
                      <span className="mb-1.5 inline-flex w-fit rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {categoryTitle}
                      </span>
                    )}
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Description>
                      {product.description ||
                        t("storefront.defaultDescription")}
                    </Card.Description>
                  </Card.Body>
                  <Card.Footer>
                    {qty === 0 ? (
                      <Button
                        size="sm"
                        fullWidth
                        onClick={() => addItem(product)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 3v10M3 8h10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        {t("storefront.addToOrder")}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                          onClick={() => updateQuantity(product.id, qty - 1)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M3 7h8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <span className="min-w-8 flex-1 text-center font-semibold text-slate-900">
                          {qty}
                        </span>
                        <button
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                          onClick={() => updateQuantity(product.id, qty + 1)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M7 3v8M3 7h8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                          onClick={() => removeItem(product.id)}
                          title={t("common.remove")}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </Card.Footer>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeCart}
        title={t("storefront.yourOrder")}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              {t("storefront.emptyCart")}
            </p>
          ) : (
            <>
              <span className="self-start rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                {t("storefront.itemsCount", {
                  count: items.reduce((s, i) => s + i.quantity, 0),
                })}
              </span>
              <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-slate-800">
                        {item.product.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t("storefront.qty", { count: item.quantity })}
                      </span>
                    </div>
                    <button
                      className="ml-2 shrink-0 text-slate-400 hover:text-red-600"
                      onClick={() => removeItem(item.productId)}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <Input
            id="order-title"
            label={t("storefront.orderTitle")}
            value={orderTitle}
            onChange={(e) => setOrderTitle(e.target.value)}
            placeholder={t("storefront.orderTitlePlaceholder")}
            required
          />

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={clearCart}>
              {t("storefront.clearAll")}
            </Button>
            <Button
              size="md"
              loading={submitting}
              disabled={!orderTitle.trim() || items.length === 0}
              onClick={handleSubmitOrder}
            >
              {t("storefront.submitOrder")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

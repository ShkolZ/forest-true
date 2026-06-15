import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api/products";
import { ordersApi } from "../api/orders";
import { useCartStore } from "../stores/cartStore";
import { useToast } from "../hooks/useToast";
import { ApiError } from "../api/client";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import type { Product } from "../types";

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderTitle, setOrderTitle] = useState("");

  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const { addToast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data || []);
      setError(null);
    } catch {
      setError(t("storefront.failedLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      });
      clearCart();
      setOrderTitle("");
      addToast(t("storefront.orderSubmitted"), "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("storefront.failedSubmit");
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
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1">
        <div className="animate-fade-in mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{t("storefront.title")}</h1>
          <p className="mt-1 text-slate-500">
            {t("storefront.subtitle")}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-20 text-slate-400">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <p>{t("storefront.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const qty = getItemQuantity(product.id);
              return (
                <Card key={product.id} hoverable>
                  <Card.Image src={product.image_url} alt={product.name} fallback={product.name} />
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Description>
                      {product.description || t("storefront.defaultDescription")}
                    </Card.Description>
                  </Card.Body>
                  <Card.Footer>
                    {qty === 0 ? (
                      <Button size="sm" fullWidth onClick={() => addItem(product)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {t("storefront.addToOrder")}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                          onClick={() => updateQuantity(product.id, qty - 1)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                        <span className="min-w-8 text-center font-semibold text-slate-900">{qty}</span>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                          onClick={() => updateQuantity(product.id, qty + 1)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                          onClick={() => removeItem(product.id)}
                          title={t("common.remove")}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

      {items.length > 0 && (
        <aside className="animate-slide-in-right h-fit w-full shrink-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:w-80">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{t("storefront.yourOrder")}</h3>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {t("storefront.itemsCount", { count: items.reduce((s, i) => s + i.quantity, 0) })}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800">{item.product.name}</span>
                  <span className="text-xs text-slate-500">{t("storefront.qty", { count: item.quantity })}</span>
                </div>
                <button
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => removeItem(item.productId)}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Input
              id="order-title"
              label={t("storefront.orderTitle")}
              value={orderTitle}
              onChange={(e) => setOrderTitle(e.target.value)}
              placeholder={t("storefront.orderTitlePlaceholder")}
              required
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={clearCart}>
              {t("storefront.clearAll")}
            </Button>
            <Button
              size="md"
              loading={submitting}
              disabled={!orderTitle.trim()}
              onClick={handleSubmitOrder}
            >
              {t("storefront.submitOrder")}
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ordersApi } from "../../api/orders";
import { useToast } from "../../hooks/useToast";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import type { Column, Order, OrderItem } from "../../types";

export default function DashboardOrders() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const { addToast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data || []);
    } catch {
      addToast(t("orders.failedLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    void (async () => {
      await loadOrders();
    })();
  }, [loadOrders]);

  const openDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    setItems([]);
    setItemsLoading(true);
    try {
      const data = await ordersApi.getItems(order.id);
      setItems(data || []);
    } catch {
      addToast(t("orders.failedLoadItems"), "error");
    } finally {
      setItemsLoading(false);
    }
  };

  const downloadExcel = async (orderId: string) => {
    try {
      const { url } = await ordersApi.getDownloadUrl(orderId);
      window.open(url, "_blank", "noopener");
    } catch {
      addToast(t("orders.failedDownload"), "error");
    }
  };

  const mono = "font-mono text-xs text-slate-500";

  const columns: Column<Order>[] = [
    {
      key: "title",
      label: t("orders.titleLabel"),
      render: (val) => (
        <span className="font-medium text-slate-800">{String(val ?? "") || "—"}</span>
      ),
    },
    {
      key: "id",
      label: t("orders.orderId"),
      render: (val) => (
        <span className={mono}>{val ? String(val).slice(0, 8) + "…" : "—"}</span>
      ),
    },
    {
      key: "username",
      label: t("orders.user"),
      render: (val) => (
        <span className="text-slate-700">{String(val ?? "") || "—"}</span>
      ),
    },
    {
      key: "excel_url",
      label: t("orders.excel"),
      render: (val, row) =>
        val ? (
          <button
            type="button"
            onClick={() => void downloadExcel(row.id)}
            className="font-medium text-brand-600 hover:underline"
          >
            {t("orders.download")}
          </button>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: "created_at",
      label: t("orders.date"),
      render: (val) =>
        val ? new Date(String(val)).toLocaleDateString(i18n.language) : "—",
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      render: (_, row) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => void openDetails(row)}>
            {t("orders.view")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("orders.title")}</h1>
          <p className="mt-1 text-slate-500">{t("orders.subtitle")}</p>
        </div>
        <Button variant="secondary" onClick={loadOrders}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 11H7.101l.001-.009a4.956 4.956 0 0 1 .752-1.787 5.054 5.054 0 0 1 2.2-1.811c.302-.128.617-.226.938-.291a5.078 5.078 0 0 1 2.018 0 4.978 4.978 0 0 1 2.525 1.361l1.416-1.412a7.036 7.036 0 0 0-2.224-1.501 6.921 6.921 0 0 0-1.315-.408 7.079 7.079 0 0 0-2.819 0 6.94 6.94 0 0 0-1.316.409 7.04 7.04 0 0 0-3.08 2.534 6.978 6.978 0 0 0-1.054 2.505c-.028.135-.043.273-.063.41H2l4 4 4-4zm4 2h2.899l-.001.008a4.976 4.976 0 0 1-2.103 3.138 4.943 4.943 0 0 1-1.787.752 5.073 5.073 0 0 1-2.017 0 4.956 4.956 0 0 1-1.787-.752 5.072 5.072 0 0 1-.74-.61L7.05 16.95a7.032 7.032 0 0 0 2.225 1.5c.424.18.867.317 1.315.408a7.07 7.07 0 0 0 2.818 0 7.031 7.031 0 0 0 4.395-2.945 6.974 6.974 0 0 0 1.053-2.503c.027-.135.043-.273.063-.41H22l-4-4-4 4z" />
          </svg>
          {t("orders.refresh")}
        </Button>
      </div>

      <Table columns={columns} data={orders} loading={loading} emptyMessage={t("orders.empty")} />

      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={t("orders.details")}
        size="md"
      >
        {selectedOrder && (
          <div className="flex flex-col gap-3">
            <Row label={t("orders.titleLabel")}>
              <span className="text-sm font-medium text-slate-800">
                {selectedOrder.title || "—"}
              </span>
            </Row>
            <Row label={t("orders.orderId")}>
              <span className={mono}>{selectedOrder.id}</span>
            </Row>
            <Row label={t("orders.user")}>
              <span className="text-sm font-medium text-slate-800">
                {selectedOrder.username || "—"}
              </span>
            </Row>
            <Row label={t("orders.userId")}>
              <span className={mono}>{selectedOrder.user_id}</span>
            </Row>
            <Row label={t("orders.createdAt")}>
              <span className="text-sm text-slate-700">
                {new Date(selectedOrder.created_at).toLocaleString(i18n.language)}
              </span>
            </Row>
            {selectedOrder.excel_url && (
              <Row label={t("orders.excel")}>
                <button
                  type="button"
                  onClick={() => void downloadExcel(selectedOrder.id)}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {t("orders.downloadFile")}
                </button>
              </Row>
            )}

            <div className="mt-2 border-t border-slate-100 pt-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                {t("orders.items")}
              </h3>
              {itemsLoading ? (
                <p className="text-sm text-slate-400">{t("orders.loadingItems")}</p>
              ) : items.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {item.product_name || (
                          <span className={mono}>
                            {item.product_id.slice(0, 8)}…
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-slate-500">
                        {t("orders.qty", { count: item.quantity })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">{t("orders.noItems")}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      {children}
    </div>
  );
}

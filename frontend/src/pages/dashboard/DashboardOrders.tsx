import { useState, useEffect, useCallback } from "react";
import { ordersApi } from "../../api/orders";
import { useToast } from "../../hooks/useToast";
import { ApiError } from "../../api/client";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import type { Column, Order } from "../../types";

const STATUS_VARIANTS: Record<string, "warning" | "info" | "success" | "danger"> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  cancelled: "danger",
};

const STATUSES = ["pending", "processing", "completed", "cancelled"];

export default function DashboardOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { addToast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data || []);
    } catch {
      addToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void (async () => {
      await loadOrders();
    })();
  }, [loadOrders]);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    const snapshot = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
    );
    setSelectedOrder((cur) => (cur ? { ...cur, status: newStatus } : cur));
    try {
      await ordersApi.update(order.id, { status: newStatus });
      addToast(`Order status updated to "${newStatus}"`, "success");
    } catch (err) {
      setOrders(snapshot);
      const msg = err instanceof ApiError ? err.message : "Update failed";
      addToast(msg || "Update failed", "error");
    }
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const mono = "font-mono text-xs text-slate-500";

  const columns: Column<Order>[] = [
    {
      key: "id",
      label: "Order ID",
      render: (val) => (
        <span className={mono}>{val ? String(val).slice(0, 8) + "…" : "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <Badge variant={STATUS_VARIANTS[String(val)] || "default"}>
          {String(val) || "unknown"}
        </Badge>
      ),
    },
    {
      key: "user_id",
      label: "User",
      render: (val) => (
        <span className={mono}>{val ? String(val).slice(0, 8) + "…" : "—"}</span>
      ),
    },
    {
      key: "excel_url",
      label: "Excel",
      render: (val) =>
        val ? (
          <a
            href={String(val)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-600 hover:underline"
          >
            Download
          </a>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (val) => (val ? new Date(String(val)).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      render: (_, row) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => openDetails(row)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-slate-500">View and manage customer orders</p>
        </div>
        <Button variant="secondary" onClick={loadOrders}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8A6 6 0 11 2.34 5.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </Button>
      </div>

      <Table columns={columns} data={orders} loading={loading} emptyMessage="No orders yet." />

      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Order Details"
        size="md"
      >
        {selectedOrder && (
          <div className="flex flex-col gap-3">
            <Row label="Order ID">
              <span className={mono}>{selectedOrder.id}</span>
            </Row>
            <Row label="Status">
              <Badge variant={STATUS_VARIANTS[selectedOrder.status] || "default"}>
                {selectedOrder.status}
              </Badge>
            </Row>
            <Row label="User ID">
              <span className={mono}>{selectedOrder.user_id}</span>
            </Row>
            <Row label="Created">
              <span className="text-sm text-slate-700">
                {new Date(selectedOrder.created_at).toLocaleString()}
              </span>
            </Row>
            {selectedOrder.excel_url && (
              <Row label="Excel">
                <a
                  href={selectedOrder.excel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-600 hover:underline"
                >
                  Download File
                </a>
              </Row>
            )}

            <div className="mt-2 border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-500">Update Status</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    variant={selectedOrder.status === status ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder, status)}
                    disabled={selectedOrder.status === status}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
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

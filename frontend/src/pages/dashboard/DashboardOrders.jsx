import { useState, useEffect } from "react";
import { ordersApi } from "../../api/orders";
import { useToast } from "../../hooks/useToast";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import "./DashboardPage.css";

const STATUS_VARIANTS = {
  pending: "warning",
  processing: "info",
  completed: "success",
  cancelled: "danger",
};

const COLUMNS = [
  {
    key: "id",
    label: "Order ID",
    render: (val) => (
      <span className="table-cell-mono">
        {val ? val.slice(0, 8) + "…" : "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (val) => (
      <Badge variant={STATUS_VARIANTS[val] || "default"}>
        {val || "unknown"}
      </Badge>
    ),
  },
  {
    key: "user_id",
    label: "User",
    render: (val) => (
      <span className="table-cell-mono">
        {val ? val.slice(0, 8) + "…" : "—"}
      </span>
    ),
  },
  {
    key: "excel_url",
    label: "Excel",
    render: (val) =>
      val ? (
        <a
          href={val}
          target="_blank"
          rel="noreferrer"
          className="table-cell-link"
        >
          Download
        </a>
      ) : (
        <span className="table-cell-na">—</span>
      ),
  },
  {
    key: "created_at",
    label: "Date",
    render: (val) => (val ? new Date(val).toLocaleDateString() : "—"),
  },
  {
    key: "actions",
    label: "",
    width: "100px",
    render: () => null,
  },
];

export default function DashboardOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data || []);
    } catch {
      addToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await ordersApi.update(order.id, { status: newStatus });
      addToast(`Order status updated to "${newStatus}"`, "success");
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data || "Update failed", "error");
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const columnsWithActions = COLUMNS.map((col) =>
    col.key === "actions"
      ? {
          ...col,
          render: (_, row) => (
            <div className="table-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDetails(row)}
              >
                View
              </Button>
            </div>
          ),
        }
      : col,
  );

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">Orders</h1>
          <p className="dashboard-page__subtitle">
            View and manage customer orders
          </p>
        </div>
        <Button variant="secondary" onClick={fetchOrders}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M14 8A6 6 0 11 2.34 5.66"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M2 2v4h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </Button>
      </div>

      <Table
        columns={columnsWithActions}
        data={orders}
        loading={loading}
        emptyMessage="No orders yet."
      />

      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Order Details"
        size="md"
      >
        {selectedOrder && (
          <div className="order-details">
            <div className="order-details__row">
              <span className="order-details__label">Order ID</span>
              <span className="order-details__value table-cell-mono">
                {selectedOrder.id}
              </span>
            </div>
            <div className="order-details__row">
              <span className="order-details__label">Status</span>
              <Badge
                variant={STATUS_VARIANTS[selectedOrder.status] || "default"}
              >
                {selectedOrder.status}
              </Badge>
            </div>
            <div className="order-details__row">
              <span className="order-details__label">User ID</span>
              <span className="order-details__value table-cell-mono">
                {selectedOrder.user_id}
              </span>
            </div>
            <div className="order-details__row">
              <span className="order-details__label">Created</span>
              <span className="order-details__value">
                {new Date(selectedOrder.created_at).toLocaleString()}
              </span>
            </div>
            {selectedOrder.excel_url && (
              <div className="order-details__row">
                <span className="order-details__label">Excel</span>
                <a
                  href={selectedOrder.excel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="table-cell-link"
                >
                  Download File
                </a>
              </div>
            )}

            <div className="order-details__status-actions">
              <span className="order-details__label">Update Status</span>
              <div className="order-details__status-btns">
                {["pending", "processing", "completed", "cancelled"].map(
                  (status) => (
                    <Button
                      key={status}
                      variant={
                        selectedOrder.status === status
                          ? "primary"
                          : "secondary"
                      }
                      size="sm"
                      onClick={() => handleStatusChange(selectedOrder, status)}
                      disabled={selectedOrder.status === status}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

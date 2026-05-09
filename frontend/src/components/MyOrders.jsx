import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, ChevronDown, ChevronUp, X, RefreshCw } from "lucide-react";

const ORDER_PU = "http://192.168.137.103:8083/api";

function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
  const cls =
    map[status?.toLowerCase()] ??
    "bg-slate-700 text-slate-400 border-slate-600";
  return (
    <span
      className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cls}`}
    >
      {status ?? "unknown"}
    </span>
  );
}

export default function MyOrders({ userId, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${ORDER_PU}/orders/${userId}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">My Orders</h2>
              <p className="text-xs text-slate-500">User: {userId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && (
            <p className="text-center text-slate-500 py-10">Loading orders…</p>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
              <Package size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm mt-1">
                Start shopping to see your orders here.
              </p>
            </div>
          )}

          {orders.map((order) => {
            const isOpen = expandedId === order.orderId;
            const total =
              order.items?.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
              ) ??
              order.total ??
              0;

            return (
              <div
                key={order.orderId}
                className="bg-slate-800/60 border border-white/5 rounded-2xl overflow-hidden"
              >
                {/* Order summary row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800 transition-colors text-left"
                  onClick={() => toggleExpand(order.orderId)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Order #{order.orderId}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.timestamp
                          ? new Date(order.timestamp).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                    <StatusBadge status={order.status ? order.status: "confirmed"} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-bold">
                      ${Number(total).toFixed(2)}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-slate-500" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded item list */}
                {isOpen && (
                  <div className="border-t border-white/5 px-5 py-4 space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-slate-300">
                            {item.name ?? item.productId}
                            <span className="text-slate-500 ml-2">
                              x{item.quantity}
                            </span>
                          </span>
                          <span className="text-slate-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No item details available.
                      </p>
                    )}

                    <div className="pt-2 mt-2 border-t border-white/5 flex justify-between text-sm font-semibold">
                      <span className="text-slate-400">Total</span>
                      <span className="text-white">
                        ${Number(total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// src/admin/AdminOrders.js
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatCurrency(n) {
  return `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

const Icon = {
  Utensils: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
  Cake: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/><path d="M7 4h.01M12 4h.01M17 4h.01"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Search: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState("Dine-in");
  const [searchTerm, setSearchTerm] = useState(""); // 👈 Search state

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const { data: raw, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["Confirmed", "Cooking", "Preparing", "Ready", "Delivered"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setOrders([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(raw.map((order) => order.user_id).filter(Boolean))];
    let users = [];

    if (userIds.length > 0) {
      const { data: fetchedUsers } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);
      users = fetchedUsers || [];
    }

    const userMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    setOrders(raw.map((order) => ({
      ...order,
      users: userMap[order.user_id] || null
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase.channel('admin-kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    setUpdating(null);
    fetchOrders();
  };

  const markPaid = async (id) => {
    setUpdating(id);
    await supabase.from("orders").update({ payment_status: "Paid" }).eq("id", id);
    setUpdating(null);
    fetchOrders();
  };

  // 👇 Filter Logic: Apply tab AND search query
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // 1. Filter by Tab
      if (o.reservation_type !== activeTab) return false;

      // 2. Filter by Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (o.users?.full_name || o.name || "").toLowerCase();
        const contact = (o.users?.email || o.contact || "").toLowerCase();
        const idStr = String(o.id);
        
        return name.includes(q) || contact.includes(q) || idStr.includes(q);
      }

      return true;
    });
  }, [orders, activeTab, searchTerm]);

  const renderOrderCard = (order) => {
    const customerName = order.users?.full_name || order.name || "Guest";
    const isCatering = order.reservation_type === "Catering";
    const isBusy = updating === order.id;

    return (
      <div key={order.id} style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardHeaderLeft}>
            <div style={styles.ref}>#{String(order.id).padStart(4, "0")}</div>
            <div>
              <div style={styles.customerName}>{customerName}</div>
              <div style={styles.customerContact}>{order.users?.email || order.contact}</div>
            </div>
          </div>
          <div style={{
            ...styles.statusBadge,
            background: order.status === "Confirmed" ? "#DBEAFE" : "#FFEDD5",
            color: order.status === "Confirmed" ? "#1E40AF" : "#9A3412",
          }}>
            {order.status}
          </div>
        </div>

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Date</span>
            <span style={styles.detailValue}>{formatDate(order.reservation_date)}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Time</span>
            <span style={styles.detailValue}>{formatTime(order.reservation_time)}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Pax</span>
            <span style={styles.detailValue}>{order.pax} pax</span>
          </div>
          {order.table_number && (
             <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Table</span>
              <span style={{...styles.detailValue, color: "#059669"}}>Table {order.table_number}</span>
            </div>
          )}
          {isCatering && order.venue && (
             <div style={{...styles.detailItem, gridColumn: "1 / -1"}}>
              <span style={styles.detailLabel}>Venue</span>
              <span style={styles.detailValue}>{order.venue}</span>
            </div>
          )}
        </div>

        <div style={styles.cartBox}>
          <div style={styles.cartLabel}>Order Items</div>
          {order.cart?.length > 0 ? (
            order.cart.map((item, index) => (
              <div key={index} style={styles.itemRow}>
                <span><strong style={{color:"#1C1917"}}>{item.qty}×</strong> {item.name}</span>
                <span style={styles.itemPrice}>{formatCurrency(item.qty * item.price)}</span>
              </div>
            ))
          ) : (
            <div style={styles.emptyText}>No items found.</div>
          )}
          {order.notes && (
            <div style={styles.notesBox}>
               <strong>Notes:</strong> {order.notes}
            </div>
          )}
        </div>

        <div style={styles.paymentRow}>
           <div>
            <span style={styles.detailLabel}>Total</span>
            <div style={{...styles.detailValue, fontSize: 16}}>{formatCurrency(order.total)}</div>
           </div>
           <div style={{ textAlign: "right" }}>
            <span style={styles.detailLabel}>Payment Status</span>
            <div style={{...styles.detailValue, color: order.payment_status === "Paid" ? "#059669" : "#B45309"}}>
              {order.payment_status || "Pending"}
            </div>
           </div>
        </div>

        <div style={styles.actions}>
          {order.payment_status !== "Paid" && (
            <button
              style={styles.payBtn}
              onClick={() => markPaid(order.id)}
              disabled={isBusy}
            >
              Mark Paid
            </button>
          )}

          {order.status === "Confirmed" && (
            <button
              style={styles.startBtn}
              onClick={() => updateStatus(order.id, isCatering ? "Preparing" : "Cooking")}
              disabled={isBusy}
            >
              Start {isCatering ? "Preparing" : "Cooking"}
            </button>
          )}

          {(order.status === "Cooking" || order.status === "Preparing") && (
            <button
              style={styles.readyBtn}
              onClick={() => updateStatus(order.id, isCatering ? "Delivered" : "Ready")}
              disabled={isBusy}
            >
              Mark {isCatering ? "Delivered" : "Ready"}
            </button>
          )}

          {(order.status === "Ready" || order.status === "Delivered") && (
            <button
              style={styles.completeBtn}
              onClick={() => updateStatus(order.id, "Completed")}
              disabled={isBusy}
            >
              Complete Order
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Kitchen & Fulfillment</h1>
          <p style={styles.subtitle}>Manage confirmed bookings, cooking, and order tracking.</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchOrders}>
          <Icon.Refresh size={14} /> Refresh
        </button>
      </div>

      {/* TOOLBAR (Tabs + Search) */}
      <div style={styles.toolbar}>
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("Dine-in")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "Dine-in" ? styles.tabBtnActive : {}),
            }}
          >
            <Icon.Utensils size={16} /> Dine-in
            <span style={{...styles.tabCount, background: activeTab === "Dine-in" ? "rgba(255,255,255,0.2)" : "#E7E5E4"}}>
              {orders.filter(o => o.reservation_type === "Dine-in").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("Catering")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "Catering" ? styles.tabBtnActive : {}),
            }}
          >
            <Icon.Cake size={16} /> Catering
            <span style={{...styles.tabCount, background: activeTab === "Catering" ? "rgba(255,255,255,0.2)" : "#E7E5E4"}}>
              {orders.filter(o => o.reservation_type === "Catering").length}
            </span>
          </button>
        </div>

        {/* 👇 SEARCH BAR */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon.Search size={18} /></span>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* CONTENT */}
      {loading && orders.length === 0 ? (
        <div style={styles.stateBox}>Loading active orders...</div>
      ) : (
        <div style={styles.grid}>
          {filteredOrders.length === 0 ? (
            <div style={styles.emptyCol}>
              {searchTerm ? "No orders match your search." : `No active ${activeTab.toLowerCase()} orders found.`}
            </div>
          ) : (
            filteredOrders.map(renderOrderCard)
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "40px 48px 60px",
    minHeight: "100vh",
    background: "#FAFAF9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1C1917",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-end", flexWrap: "wrap", gap: 16,
    maxWidth: 1200, margin: "0 auto 24px",
  },
  title: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  subtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  refreshBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  stateBox: {
    display: "flex", justifyContent: "center", alignItems: "center",
    padding: 80, fontSize: 15, color: "#78716C", fontWeight: 600,
  },

  // Toolbar (Tabs + Search)
  toolbar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 16,
    maxWidth: 1200, margin: "0 auto 24px",
  },
  tabContainer: {
    display: "flex", gap: 8,
    padding: "6px", background: "#FFFFFF",
    borderRadius: 12, border: "1px solid #E7E5E4",
  },
  tabBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", background: "transparent",
    border: "none", borderRadius: 8,
    color: "#78716C", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    background: "#1C1917", color: "#FFFFFF",
  },
  tabCount: {
    padding: "2px 8px", borderRadius: 12,
    fontSize: 12, fontWeight: 800, color: "#1C1917",
  },

  // Search Bar
  searchWrap: {
    position: "relative",
    display: "flex", alignItems: "center",
    width: "100%", maxWidth: 320,
  },
  searchIcon: {
    position: "absolute", left: 14, color: "#A8A29E",
    display: "flex", alignItems: "center", pointerEvents: "none",
  },
  searchInput: {
    width: "100%", padding: "12px 14px 12px 42px",
    background: "#FFFFFF", border: "1px solid #D6D3D1",
    borderRadius: 10, color: "#1C1917", fontSize: 14,
    outline: "none", fontFamily: "inherit",
    transition: "border-color 0.15s",
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: 20,
    maxWidth: 1200,
    margin: "0 auto",
    alignItems: "start",
  },
  emptyCol: {
    gridColumn: "1 / -1",
    padding: "60px 0", textAlign: "center",
    fontSize: 15, color: "#A8A29E", fontStyle: "italic",
    background: "#FFFFFF", border: "1px dashed #D6D3D1", borderRadius: 16,
  },

  // Card
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 16,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  cardHeaderLeft: {
    display: "flex", alignItems: "center", gap: 12,
  },
  ref: {
    background: "#1C1917", color: "#FDE68A",
    padding: "6px 10px", borderRadius: 8,
    fontSize: 13, fontWeight: 800,
  },
  customerName: {
    fontSize: 16, fontWeight: 800, color: "#1C1917",
  },
  customerContact: {
    fontSize: 12, color: "#78716C", marginTop: 2,
  },
  statusBadge: {
    fontSize: 11, fontWeight: 800,
    padding: "6px 12px", borderRadius: 20,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },

  detailsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, marginBottom: 16,
    background: "#FAFAF9", padding: "14px 16px",
    borderRadius: 12, border: "1px solid #F5F5F4",
  },
  detailItem: {
    display: "flex", flexDirection: "column", gap: 2,
  },
  detailLabel: {
    fontSize: 10, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  detailValue: {
    fontSize: 13, color: "#1C1917", fontWeight: 700,
  },

  cartBox: {
    border: "1px solid #E7E5E4",
    borderRadius: 12, padding: "16px",
    marginBottom: 16,
  },
  cartLabel: {
    fontSize: 11, fontWeight: 800, color: "#78716C",
    textTransform: "uppercase", letterSpacing: "0.5px",
    marginBottom: 12,
  },
  itemRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, color: "#44403C", padding: "6px 0",
  },
  itemPrice: { color: "#78716C", fontWeight: 500 },
  emptyText: { fontSize: 13, color: "#A8A29E", fontStyle: "italic" },
  notesBox: {
    marginTop: 12, paddingTop: 12,
    borderTop: "1px dashed #E7E5E4",
    fontSize: 13, color: "#B45309", lineHeight: 1.5,
  },

  paymentRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", paddingBottom: 20, marginBottom: 20,
    borderBottom: "1px solid #E7E5E4",
  },

  actions: {
    display: "flex", gap: 10,
  },
  payBtn: {
    flex: 1, padding: "12px", background: "#F0F9FF",
    border: "1px solid #BAE6FD", borderRadius: 8,
    color: "#0369A1", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    transition: "background 0.2s",
  },
  startBtn: {
    flex: 2, padding: "12px", background: "#F97316",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  readyBtn: {
    flex: 2, padding: "12px", background: "#3B82F6",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  completeBtn: {
    flex: 2, padding: "12px", background: "#059669",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
};
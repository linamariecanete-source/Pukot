// src/kitchen/KitchenDashboard.js
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import PeakHourAlert from "../admin/PeakHourAlert";

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

const Icon = {
  Clock: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Logout: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  // 👇 FIXED: Removed the 'loading' variable since it wasn't being rendered
  const [, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["Confirmed", "Cooking", "Preparing", "Ready", "Delivered"])
      .order("created_at", { ascending: true });

    if (!error) setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase.channel("kitchen-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("kitchen");
    navigate("/kitchen/login");
  };

  const incoming = orders.filter(o => o.status === "Confirmed");
  const cooking = orders.filter(o => o.status === "Cooking" || o.status === "Preparing");
  const ready = orders.filter(o => o.status === "Ready" || o.status === "Delivered");

  const renderCard = (order) => {
    const isCatering = order.reservation_type === "Catering";
    const isWalkIn = order.name === "Walk-in Guest";
    const isBusy = updating === order.id;

    return (
      <div key={order.id} style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.ref}>#{String(order.id).padStart(4, "0")}</div>
          <div style={styles.badges}>
            {isWalkIn && <span style={styles.walkinTag}>WALK-IN</span>}
            {isCatering && <span style={styles.cateringTag}>CATERING</span>}
            <span style={styles.timeTag}><Icon.Clock size={12} /> {formatTime(order.reservation_time)}</span>
          </div>
        </div>

        <div style={styles.customer}>
          <strong>{order.name}</strong> · {order.pax} pax
          {order.table_number && <span style={{ color: "#FDE68A" }}> · Table {order.table_number}</span>}
          {order.venue && <div style={styles.venue}>Venue: {order.venue}</div>}
        </div>

        <div style={styles.itemsList}>
          {order.cart?.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <span style={styles.qty}>{item.qty}×</span>
              <span>{item.name}</span>
            </div>
          ))}
          {order.notes && <div style={styles.notes}>Notes: {order.notes}</div>}
        </div>

        {order.status === "Confirmed" && (
          <button style={styles.startBtn} onClick={() => updateStatus(order.id, isCatering ? "Preparing" : "Cooking")} disabled={isBusy}>
            Start {isCatering ? "Preparing" : "Cooking"}
          </button>
        )}
        {(order.status === "Cooking" || order.status === "Preparing") && (
          <button style={styles.readyBtn} onClick={() => updateStatus(order.id, isCatering ? "Delivered" : "Ready")} disabled={isBusy}>
            Mark {isCatering ? "Delivered" : "Ready"}
          </button>
        )}
        {(order.status === "Ready" || order.status === "Delivered") && (
          <button style={styles.doneBtn} onClick={() => updateStatus(order.id, "Completed")} disabled={isBusy}>
            Complete Order
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topTitle}>Kitchen Display System</div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <Icon.Logout size={14} /> Sign Out
        </button>
      </div>

      <div style={{ padding: "16px 24px 0" }}>
        <PeakHourAlert />
      </div>

      <div style={styles.board}>
        {/* COLUMN 1: INCOMING */}
        <div style={styles.column}>
          <div style={styles.colHeader}>
            <span>Incoming</span>
            <span style={styles.count}>{incoming.length}</span>
          </div>
          <div style={styles.colBody}>
            {incoming.length === 0 ? <div style={styles.empty}>No incoming orders</div> : incoming.map(renderCard)}
          </div>
        </div>

        {/* COLUMN 2: COOKING */}
        <div style={styles.column}>
          <div style={{...styles.colHeader, borderBottomColor: "#F97316"}}>
            <span>Cooking / Preparing</span>
            <span style={styles.count}>{cooking.length}</span>
          </div>
          <div style={styles.colBody}>
            {cooking.length === 0 ? <div style={styles.empty}>No orders cooking</div> : cooking.map(renderCard)}
          </div>
        </div>

        {/* COLUMN 3: READY */}
        <div style={styles.column}>
          <div style={{...styles.colHeader, borderBottomColor: "#10B981"}}>
            <span>Ready to Serve</span>
            <span style={styles.count}>{ready.length}</span>
          </div>
          <div style={styles.colBody}>
            {ready.length === 0 ? <div style={styles.empty}>No ready orders</div> : ready.map(renderCard)}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#0C0A09", color: "#FFFFFF",
    fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column",
  },
  topBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 24px", background: "#1C1917", borderBottom: "1px solid #292524",
  },
  topTitle: { fontSize: 20, fontWeight: 800, color: "#FDE68A", letterSpacing: "-0.5px" },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
    background: "transparent", border: "1px solid #44403C",
    borderRadius: 8, color: "#A8A29E", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },

  board: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20, padding: 20, flex: 1, 
    height: "calc(100vh - 130px)", // Adjusted height to fit the alert
  },
  column: {
    background: "#1C1917", borderRadius: 12, border: "1px solid #292524",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  colHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", background: "#171412", borderBottom: "3px solid #3B82F6",
    fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px",
  },
  count: {
    background: "#292524", color: "#FFFFFF", padding: "2px 10px",
    borderRadius: 12, fontSize: 13,
  },
  colBody: {
    flex: 1, overflowY: "auto", padding: 16, display: "flex",
    flexDirection: "column", gap: 12,
  },
  empty: { textAlign: "center", color: "#57534E", fontSize: 13, padding: 20, fontStyle: "italic" },

  // Cards
  card: {
    background: "#292524", borderRadius: 10, padding: 16,
    border: "1px solid #44403C", display: "flex", flexDirection: "column", gap: 12,
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  ref: { fontSize: 18, fontWeight: 900, color: "#FDE68A" },
  badges: { display: "flex", gap: 6, alignItems: "center" },
  walkinTag: { background: "#8B5CF6", color: "#FFFFFF", padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800 },
  cateringTag: { background: "#0EA5E9", color: "#FFFFFF", padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800 },
  timeTag: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#A8A29E", fontWeight: 600 },

  customer: { fontSize: 14, color: "#E7E5E4" },
  venue: { marginTop: 4, fontSize: 12, color: "#A8A29E" },

  itemsList: {
    background: "#1C1917", borderRadius: 8, padding: "10px 14px",
    display: "flex", flexDirection: "column", gap: 6,
  },
  itemRow: { display: "flex", gap: 8, fontSize: 14, color: "#FFFFFF" },
  qty: { color: "#F97316", fontWeight: 800 },
  notes: { marginTop: 8, paddingTop: 8, borderTop: "1px dashed #44403C", fontSize: 12, color: "#FCD34D" },

  startBtn: { padding: 12, background: "#3B82F6", color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" },
  readyBtn: { padding: 12, background: "#F97316", color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" },
  doneBtn: { padding: 12, background: "#10B981", color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" },
};
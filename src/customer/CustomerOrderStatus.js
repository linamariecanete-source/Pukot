// src/customer/CustomerOrderStatus.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

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

// ── Status flows ──────────────────────────────────────────────────────
const DINEIN_STEPS = ["Pending", "Confirmed", "Cooking", "Ready", "Served"];
const CATERING_STEPS = ["Pending", "Confirmed", "Preparing", "Delivered", "Completed"];

const STATUS_META = {
  Pending:   { color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B", label: "Pending",  desc: "Waiting for restaurant confirmation" },
  Confirmed: { color: "#065F46", bg: "#D1FAE5", dot: "#10B981", label: "Confirmed", desc: "Your booking is confirmed" },
  Cooking:   { color: "#9A3412", bg: "#FFEDD5", dot: "#F97316", label: "Cooking",  desc: "Your food is being prepared" },
  Ready:     { color: "#1E40AF", bg: "#DBEAFE", dot: "#3B82F6", label: "Ready",    desc: "Ready to be served" },
  Served:    { color: "#374151", bg: "#E5E7EB", dot: "#6B7280", label: "Served",   desc: "Enjoy your meal" },
  Preparing: { color: "#9A3412", bg: "#FFEDD5", dot: "#F97316", label: "Preparing", desc: "Your catering order is being prepared" },
  Delivered: { color: "#1E40AF", bg: "#DBEAFE", dot: "#3B82F6", label: "Delivered", desc: "Out for delivery / on site" },
  Completed: { color: "#374151", bg: "#E5E7EB", dot: "#6B7280", label: "Completed", desc: "Order completed" },
  Cancelled: { color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444", label: "Cancelled", desc: "This order was cancelled" },
};

// ── Icons ─────────────────────────────────────────────────────────────
const Icon = {
  Calendar: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Users: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  MapPin: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Utensils: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
};

// ── Status Stepper ────────────────────────────────────────────────────
function StatusStepper({ status, type }) {
  const steps = type === "Catering" ? CATERING_STEPS : DINEIN_STEPS;
  const isCancelled = status === "Cancelled";
  const currentIndex = steps.indexOf(status);

  if (isCancelled) {
    return (
      <div style={stepper.cancelledBox}>
        <div style={stepper.cancelledIcon}>
          <Icon.X size={20} />
        </div>
        <div>
          <div style={stepper.cancelledTitle}>Order Cancelled</div>
          <div style={stepper.cancelledSub}>
            This booking was cancelled. Reach out if this was a mistake.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={stepper.wrap}>
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} style={stepper.stepWrap}>
            <div style={stepper.stepInner}>
              <div style={{
                ...stepper.circle,
                ...(isDone ? stepper.circleDone : {}),
                ...(isCurrent ? stepper.circleCurrent : {}),
              }}>
                {isDone ? <Icon.Check size={12} /> : i + 1}
              </div>
              <div style={stepper.labelWrap}>
                <div style={{
                  ...stepper.label,
                  ...(isDone ? stepper.labelDone : {}),
                  ...(isCurrent ? stepper.labelCurrent : {}),
                }}>
                  {step}
                </div>
                {isCurrent && STATUS_META[step]?.desc && (
                  <div style={stepper.subLabel}>{STATUS_META[step].desc}</div>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                ...stepper.connector,
                ...(isDone ? stepper.connectorDone : {}),
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────
function OrderCard({ order, onRefresh }) {
  const meta = STATUS_META[order.status] || STATUS_META.Pending;
  const cart = Array.isArray(order.cart) ? order.cart : [];
  const isCancelled = order.status === "Cancelled";

  return (
    <div style={{ ...styles.card, ...(isCancelled ? styles.cardCancelled : {}) }}>
      {/* Top bar */}
      <div style={styles.cardTop}>
        <div style={styles.cardRefWrap}>
          <div style={styles.cardRef}>
            {order.reservation_type === "Catering" ? "CAT" : "RSV"}
          </div>
          <div style={styles.cardRefNum}>#{String(order.id).padStart(5, "0")}</div>
        </div>

        <div style={styles.cardTopCenter}>
          <div style={{
            ...styles.statusPill,
            background: meta.bg,
            color: meta.color,
          }}>
            <span style={{ ...styles.statusDot, background: meta.dot }} />
            {meta.label}
          </div>
          <div style={styles.cardType}>
            {order.reservation_type || "Dine-in"}
            {order.event_type && ` · ${order.event_type}`}
          </div>
        </div>

        <button style={styles.refreshBtn} onClick={onRefresh} title="Refresh status">
          <Icon.Refresh size={14} />
        </button>
      </div>

      {/* Stepper */}
      <div style={styles.stepperWrap}>
        <StatusStepper status={order.status} type={order.reservation_type} />
      </div>

      {/* Details grid */}
      <div style={styles.detailsGrid}>
        <div style={styles.detailItem}>
          <div style={styles.detailIcon}><Icon.Calendar size={14} /></div>
          <div>
            <div style={styles.detailLabel}>Date</div>
            <div style={styles.detailValue}>{formatDate(order.reservation_date)}</div>
          </div>
        </div>

        <div style={styles.detailItem}>
          <div style={styles.detailIcon}><Icon.Clock size={14} /></div>
          <div>
            <div style={styles.detailLabel}>Time</div>
            <div style={styles.detailValue}>{formatTime(order.reservation_time)}</div>
          </div>
        </div>

        <div style={styles.detailItem}>
          <div style={styles.detailIcon}><Icon.Users size={14} /></div>
          <div>
            <div style={styles.detailLabel}>Pax</div>
            <div style={styles.detailValue}>{order.pax} pax</div>
          </div>
        </div>

        {order.venue && (
          <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
            <div style={styles.detailIcon}><Icon.MapPin size={14} /></div>
            <div>
              <div style={styles.detailLabel}>Venue</div>
              <div style={styles.detailValue}>{order.venue}</div>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      {cart.length > 0 && (
        <div style={styles.itemsSection}>
          <div style={styles.itemsLabel}>Your Order</div>
          {cart.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <span style={styles.itemName}>{item.qty} × {item.name}</span>
              <span style={styles.itemPrice}>{formatCurrency(item.qty * item.price)}</span>
            </div>
          ))}
          <div style={styles.itemTotalRow}>
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      )}

      {/* Footer with payment + notes */}
      <div style={styles.cardFooter}>
        <div style={styles.footerPayment}>
          <div style={styles.footerLabel}>Payment</div>
          <div style={styles.footerValue}>
            {order.payment_status || "Pending"}
            {order.downpayment > 0 && ` · ${formatCurrency(order.downpayment)} paid`}
          </div>
        </div>
        {order.notes && (
          <div style={styles.footerNotes}>
            <div style={styles.footerLabel}>Notes</div>
            <div style={styles.footerValue}>{order.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════
export default function CustomerOrderStatus() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Active"); // Active | Past | All

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;

    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (!error) setOrders(data || []);
    else console.error("Fetch error:", error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    // 🔥 FIXED REALTIME SUBSCRIPTION
    let channel;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // Added Date.now() to ensure the channel is unique and avoids React StrictMode crashes
      channel = supabase.channel(`customer-order-status-${uid}-${Date.now()}`);
      
      // Chain the listener BEFORE subscribing
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${uid}` },
        () => fetchOrders()
      );
      
      // Subscribe LAST
      channel.subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const activeStatuses = ["Pending", "Confirmed", "Cooking", "Ready", "Preparing", "Delivered"];
  const doneStatuses = ["Served", "Completed", "Cancelled"];

  const filteredOrders = orders.filter(o => {
    if (tab === "Active") return activeStatuses.includes(o.status);
    if (tab === "Past") return doneStatuses.includes(o.status);
    return true;
  });

  const activeCount = orders.filter(o => activeStatuses.includes(o.status)).length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>My Orders</div>
          <h1 style={styles.title}>Order Status</h1>
          <p style={styles.subtitle}>
            Track your dine-in reservations and catering orders in real time.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.ghostBtn} onClick={fetchOrders}>
            <Icon.Refresh size={14} /> Refresh
          </button>
          <button style={styles.primaryBtn} onClick={() => navigate("/customer")}>
            New Reservation <Icon.ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {[
          { id: "Active", label: "Active", count: activeCount },
          { id: "Past", label: "Past", count: orders.length - activeCount },
          { id: "All", label: "All", count: orders.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tab,
              ...(tab === t.id ? styles.tabActive : {}),
            }}
          >
            {t.label}
            <span style={{
              ...styles.tabCount,
              ...(tab === t.id ? styles.tabCountActive : {}),
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.stateText}>Loading your orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.emptyBox}>
          <div style={styles.emptyIconWrap}>
            <Icon.Utensils size={32} />
          </div>
          <div style={styles.emptyTitle}>
            {tab === "Active" ? "No active orders" : tab === "Past" ? "No past orders" : "No orders yet"}
          </div>
          <div style={styles.emptySub}>
            {tab === "Active"
              ? "Your upcoming and in-progress bookings will appear here."
              : tab === "Past"
              ? "Completed and cancelled orders will appear here."
              : "Book a table or catering event to get started."}
          </div>
          <button style={styles.emptyBtn} onClick={() => navigate("/customer")}>
            Make a Reservation <Icon.ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredOrders.map(o => (
            <OrderCard key={o.id} order={o} onRefresh={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Stepper Styles
// ═══════════════════════════════════════════════════════════════════════
const stepper = {
  wrap: {
    display: "flex", alignItems: "flex-start",
    gap: 0, overflowX: "auto",
    paddingBottom: 4,
  },
  stepWrap: {
    display: "flex", alignItems: "center", flex: 1,
    minWidth: 0,
  },
  stepInner: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8,
    flexShrink: 0, minWidth: 70,
  },
  circle: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#FFFFFF", border: "2px solid #E7E5E4",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 800, color: "#A8A29E",
    transition: "all 0.2s",
  },
  circleDone: {
    background: "#059669", borderColor: "#059669", color: "#FFFFFF",
  },
  circleCurrent: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
    boxShadow: "0 0 0 5px rgba(28,25,23,0.1)",
  },
  labelWrap: {
    textAlign: "center", padding: "0 4px",
  },
  label: {
    fontSize: 11, fontWeight: 700, color: "#A8A29E",
    textTransform: "uppercase", letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  labelDone: { color: "#059669" },
  labelCurrent: { color: "#1C1917" },
  subLabel: {
    fontSize: 10, color: "#78716C",
    marginTop: 2, fontWeight: 500,
    maxWidth: 100, lineHeight: 1.3,
  },
  connector: {
    flex: 1, height: 2, background: "#E7E5E4",
    minWidth: 12, marginBottom: 22,
  },
  connectorDone: { background: "#059669" },

  cancelledBox: {
    display: "flex", alignItems: "center", gap: 14,
    background: "#FEF2F2", border: "1px solid #FECACA",
    borderRadius: 12, padding: "14px 18px",
  },
  cancelledIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "#FEE2E2", color: "#DC2626",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cancelledTitle: {
    fontSize: 14, fontWeight: 800, color: "#991B1B",
  },
  cancelledSub: {
    fontSize: 12, color: "#B91C1C", marginTop: 2,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Page Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = {
  page: {
    padding: "40px 48px 80px", minHeight: "100vh", background: "#FAFAF9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1C1917",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-end", flexWrap: "wrap", gap: 16,
    maxWidth: 900, margin: "0 auto 28px",
  },
  eyebrow: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6,
  },
  title: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  subtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  ghostBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 16px", background: "#1C1917",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },

  tabRow: {
    display: "flex", gap: 6,
    maxWidth: 900, margin: "0 auto 20px",
  },
  tab: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "9px 16px", background: "#FFFFFF",
    border: "1px solid #E7E5E4", borderRadius: 20,
    color: "#57534E", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  tabActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
  },
  tabCount: {
    fontSize: 11, padding: "1px 8px",
    background: "rgba(0,0,0,0.08)", borderRadius: 10, fontWeight: 800,
  },
  tabCountActive: { background: "rgba(255,255,255,0.15)" },

  stateBox: {
    display: "flex", justifyContent: "center",
    padding: "80px 20px",
    maxWidth: 900, margin: "0 auto",
  },
  stateText: { fontSize: 14, color: "#78716C", fontWeight: 600 },

  emptyBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 12, padding: "60px 20px",
    maxWidth: 900, margin: "0 auto",
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 16,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 16,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    color: "#A8A29E",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: "#1C1917" },
  emptySub: {
    fontSize: 13, color: "#78716C", textAlign: "center",
    maxWidth: 320, lineHeight: 1.5,
  },
  emptyBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    marginTop: 8, padding: "11px 20px",
    background: "#1C1917", border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },

  list: {
    display: "flex", flexDirection: "column",
    gap: 20, maxWidth: 900, margin: "0 auto",
  },

  card: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 16, overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  cardCancelled: {
    background: "#FFFAFA", borderColor: "#FECACA",
  },

  cardTop: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "18px 24px",
    borderBottom: "1px solid #F5F5F4",
    flexWrap: "wrap",
  },
  cardRefWrap: {
    display: "flex", alignItems: "center", gap: 10,
  },
  // ✅ FIXED: Removed duplicate 'color' key that was crashing Vercel
  cardRef: {
    fontSize: 10, fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.8px",
    padding: "4px 8px", background: "#1C1917",
    color: "#FDE68A", borderRadius: 6,
  },
  cardRefNum: {
    fontSize: 15, fontWeight: 800, color: "#1C1917",
    letterSpacing: "-0.3px",
  },
  cardTopCenter: {
    flex: 1, display: "flex", alignItems: "center",
    gap: 12, flexWrap: "wrap",
  },
  statusPill: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 700,
    padding: "6px 12px", borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },
  cardType: {
    fontSize: 12, color: "#78716C", fontWeight: 600,
  },
  refreshBtn: {
    width: 34, height: 34, borderRadius: 8,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    color: "#78716C", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },

  stepperWrap: {
    padding: "22px 24px",
    borderBottom: "1px solid #F5F5F4",
    background: "#FAFAF9",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16, padding: "18px 24px",
    borderBottom: "1px solid #F5F5F4",
  },
  detailItem: {
    display: "flex", alignItems: "flex-start", gap: 10,
  },
  detailIcon: {
    width: 30, height: 30, borderRadius: 8,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    color: "#78716C",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  detailLabel: {
    fontSize: 10, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.6px",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13, color: "#1C1917", fontWeight: 700,
  },

  itemsSection: {
    padding: "18px 24px",
    borderBottom: "1px solid #F5F5F4",
    display: "flex", flexDirection: "column", gap: 6,
  },
  itemsLabel: {
    fontSize: 10, color: "#A8A29E", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.8px",
    marginBottom: 4,
  },
  itemRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 13, color: "#44403C", padding: "3px 0",
  },
  itemName: { fontWeight: 500 },
  itemPrice: { color: "#78716C" },
  itemTotalRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, fontWeight: 800, color: "#1C1917",
    marginTop: 8, paddingTop: 10,
    borderTop: "1px dashed #E7E5E4",
  },

  cardFooter: {
    padding: "16px 24px",
    display: "flex", gap: 32, flexWrap: "wrap",
    background: "#FFFFFF",
  },
  footerPayment: { minWidth: 140 },
  footerNotes: { flex: 1, minWidth: 200 },
  footerLabel: {
    fontSize: 10, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.6px",
    marginBottom: 3,
  },
  footerValue: {
    fontSize: 12, color: "#44403C", fontWeight: 600,
  },
};
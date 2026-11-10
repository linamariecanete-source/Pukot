import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatCurrency(n) {
  return `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PH", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

const CATERING_STATUSES = ["Pending", "Confirmed", "Preparing", "Delivered", "Completed", "Cancelled"];

const STATUS_CFG = {
  Pending:   { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B", strip: "#F59E0B" },
  Confirmed: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981", strip: "#10B981" },
  Preparing: { bg: "#FFEDD5", color: "#9A3412", dot: "#F97316", strip: "#F97316" },
  Delivered: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6", strip: "#3B82F6" },
  Completed: { bg: "#E5E7EB", color: "#374151", dot: "#6B7280", strip: "#6B7280" },
  Cancelled: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444", strip: "#EF4444" },
};

// ── Icons ─────────────────────────────────────────────────────────────
const Icon = {
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
  Search: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  MapPin: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Phone: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Image: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Eye: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ ...styles.statusBadge, background: cfg.bg, color: cfg.color }}>
      <span style={{ ...styles.statusDot, background: cfg.dot }} />
      {status}
    </span>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────
function DetailDrawer({ order, onClose, onUpdateStatus, onUpdatePayment, busyId }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!order) return null;

  const busy = busyId === order.id;
  const days = daysUntil(order.reservation_date);

  return (
    <div style={drawer.overlay} onClick={onClose}>
      <div style={drawer.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={drawer.header}>
          <div>
            <div style={drawer.eyebrow}>
              CAT #{String(order.id).padStart(5, "0")}
            </div>
            <h2 style={drawer.title}>{order.name || "Guest"}</h2>
            <div style={drawer.subline}>
              <Icon.Phone size={12} /> {order.contact || "—"}
            </div>
          </div>
          <button style={drawer.closeBtn} onClick={onClose} aria-label="Close">
            <Icon.X size={18} />
          </button>
        </div>

        {/* Status strip */}
        <div style={{
          ...drawer.statusStrip,
          background: (STATUS_CFG[order.status] || STATUS_CFG.Pending).strip,
        }} />

        {/* Body */}
        <div style={drawer.body}>
          {/* Quick approve/reject */}
          {(order.status === "Pending" || order.status === "Confirmed") && (
            <div style={drawer.actionRow}>
              {order.status === "Pending" && (
                <button
                  disabled={busy}
                  style={drawer.approveBtn}
                  onClick={() => onUpdateStatus(order.id, "Confirmed")}
                >
                  <Icon.Check size={16} /> Confirm Booking
                </button>
              )}
              {order.status === "Confirmed" && (
                <button
                  disabled={busy}
                  style={drawer.prepareBtn}
                  onClick={() => onUpdateStatus(order.id, "Preparing")}
                >
                  Mark as Preparing
                </button>
              )}
              <button
                disabled={busy}
                style={drawer.rejectBtn}
                onClick={() => {
                  if (window.confirm("Cancel this catering order?")) {
                    onUpdateStatus(order.id, "Cancelled");
                  }
                }}
              >
                <Icon.X size={16} /> Cancel
              </button>
            </div>
          )}

          {/* Event info */}
          <div style={drawer.section}>
            <div style={drawer.sectionLabel}>Event Info</div>
            <div style={drawer.infoGrid}>
              <InfoRow label="Event Type" value={order.event_type || "—"} />
              <InfoRow label="Venue" value={order.venue || "—"} />
              <InfoRow label="Date" value={formatDateLong(order.reservation_date)} />
              <InfoRow label="Time" value={formatTime(order.reservation_time)} />
              <InfoRow label="Pax" value={`${order.pax} pax`} />
              {days >= 0 && order.status !== "Completed" && order.status !== "Cancelled" && (
                <InfoRow
                  label="Countdown"
                  value={days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                />
              )}
            </div>
          </div>

          {/* Items */}
          <div style={drawer.section}>
            <div style={drawer.sectionLabel}>Ordered Items</div>
            {!Array.isArray(order.cart) || order.cart.length === 0 ? (
              <div style={drawer.empty}>No items in this catering order.</div>
            ) : (
              <div style={drawer.itemsTable}>
                {order.cart.map((it, i) => (
                  <div key={i} style={drawer.itemRow}>
                    <span style={drawer.itemName}>{it.qty} × {it.name}</span>
                    <span style={drawer.itemPrice}>{formatCurrency(it.qty * it.price)}</span>
                  </div>
                ))}
                <div style={drawer.itemTotalRow}>
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div style={drawer.section}>
            <div style={drawer.sectionLabel}>Payment</div>
            <div style={drawer.paymentBox}>
              <div style={drawer.paymentRow}>
                <span style={drawer.paymentLabel}>Total</span>
                <span style={drawer.paymentValue}>{formatCurrency(order.total)}</span>
              </div>
              <div style={drawer.paymentRow}>
                <span style={drawer.paymentLabel}>Downpayment</span>
                <span style={drawer.paymentValue}>{formatCurrency(order.downpayment || 0)}</span>
              </div>
              {order.downpayment > 0 && (
                <>
                  <div style={drawer.paymentRow}>
                    <span style={drawer.paymentLabel}>Method</span>
                    <span style={drawer.paymentValue}>{order.payment_method || "—"}</span>
                  </div>
                  <div style={drawer.paymentRow}>
                    <span style={drawer.paymentLabel}>Reference</span>
                    <span style={drawer.paymentValue}>{order.payment_reference || "—"}</span>
                  </div>
                  <div style={drawer.paymentRow}>
                    <span style={drawer.paymentLabel}>Status</span>
                    <span style={drawer.paymentValue}>{order.payment_status || "Pending"}</span>
                  </div>
                  {order.payment_proof_url && (
                    <div style={drawer.paymentRow}>
                      <span style={drawer.paymentLabel}>Proof</span>
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        style={drawer.proofLink}
                      >
                        <Icon.Image size={12} /> View screenshot
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment status buttons */}
            <div style={drawer.btnRow}>
              {["Pending", "Partial", "Paid", "Refunded"].map(p => (
                <button key={p}
                  disabled={busy || order.payment_status === p}
                  style={{
                    ...drawer.pill,
                    ...(order.payment_status === p ? drawer.pillActive : {}),
                  }}
                  onClick={() => onUpdatePayment(order.id, p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={drawer.section}>
              <div style={drawer.sectionLabel}>Special Instructions</div>
              <div style={drawer.notesBox}>{order.notes}</div>
            </div>
          )}

          {/* Order status advanced */}
          <div style={drawer.section}>
            <div style={drawer.sectionLabel}>Advance Order Status</div>
            <div style={drawer.btnRow}>
              {CATERING_STATUSES.filter(s => s !== "Cancelled").map(s => (
                <button key={s}
                  disabled={busy || order.status === s}
                  style={{
                    ...drawer.pill,
                    ...(order.status === s ? drawer.pillActive : {}),
                  }}
                  onClick={() => onUpdateStatus(order.id, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={drawer.infoRow}>
      <span style={drawer.infoLabel}>{label}</span>
      <span style={drawer.infoValue}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════
export default function CateringAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [dateScope, setDateScope] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("reservation_type", "Catering")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });
    if (!error) setOrders(data || []);
    else console.error("Fetch error:", error.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase.channel("admin-catering")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

  // Keep the open drawer in sync with refreshed data
  useEffect(() => {
    if (drawerOrder) {
      const updated = orders.find(o => o.id === drawerOrder.id);
      if (updated && updated !== drawerOrder) setDrawerOrder(updated);
    }
  }, [orders, drawerOrder]);

  const today = new Date().toISOString().split("T")[0];

  const scopedOrders = useMemo(() => {
    if (dateScope === "Upcoming") return orders.filter(o => o.reservation_date >= today);
    if (dateScope === "Past") return orders.filter(o => o.reservation_date < today);
    return orders;
  }, [orders, dateScope, today]);

  const filtered = useMemo(() => {
    let items = scopedOrders;
    if (filter !== "All") items = items.filter(o => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(o =>
        (o.name || "").toLowerCase().includes(q) ||
        (o.contact || "").toLowerCase().includes(q) ||
        (o.event_type || "").toLowerCase().includes(q) ||
        (o.venue || "").toLowerCase().includes(q) ||
        String(o.id).includes(q)
      );
    }
    return items;
  }, [scopedOrders, filter, search]);

  const counts = useMemo(() => {
    const c = { All: scopedOrders.length };
    CATERING_STATUSES.forEach(s => { c[s] = scopedOrders.filter(o => o.status === s).length; });
    return c;
  }, [scopedOrders]);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) alert("Error: " + error.message);
    await fetchOrders();
    setBusyId(null);
  };

  const updatePayment = async (id, payment_status) => {
    setBusyId(id);
    const { error } = await supabase.from("orders").update({ payment_status }).eq("id", id);
    if (error) alert("Error: " + error.message);
    await fetchOrders();
    setBusyId(null);
  };

  const upcomingCount = orders.filter(o =>
    o.reservation_date >= today &&
    o.status !== "Completed" && o.status !== "Cancelled"
  ).length;

  const pendingCount = orders.filter(o =>
    o.status === "Pending" && o.reservation_date >= today
  ).length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Catering Dashboard</div>
          <h1 style={styles.headerTitle}>Catering Orders</h1>
          <p style={styles.headerSubtitle}>
            Review incoming bookings, approve or reject, and track fulfillment.
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchOrders}>
          <Icon.Refresh size={14} /> Refresh
        </button>
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && filter !== "Pending" && dateScope === "Upcoming" && (
        <div style={styles.alertBanner}>
          <div style={styles.alertIconWrap}>
            <Icon.Clock size={16} />
          </div>
          <div style={styles.alertText}>
            <strong>{pendingCount} catering booking{pendingCount > 1 ? "s" : ""} awaiting your approval.</strong>
            <div style={styles.alertSub}>Review and confirm to start preparing.</div>
          </div>
          <button style={styles.alertBtn} onClick={() => { setDateScope("Upcoming"); setFilter("Pending"); }}>
            Review pending
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div style={styles.statsRow}>
        <StatCard label="Upcoming" value={upcomingCount} accent="#1C1917" />
        <StatCard label="Pending" value={counts.Pending || 0} accent="#F59E0B" />
        <StatCard label="Confirmed" value={counts.Confirmed || 0} accent="#10B981" />
        <StatCard label="Preparing" value={counts.Preparing || 0} accent="#F97316" />
        <StatCard label="Delivered" value={counts.Delivered || 0} accent="#3B82F6" />
        <StatCard label="Completed" value={counts.Completed || 0} accent="#6B7280" />
      </div>

      {/* Scope + filters */}
      <div style={styles.scopeRow}>
        {["Upcoming", "Past", "All"].map(scope => (
          <button key={scope} onClick={() => setDateScope(scope)}
            style={{ ...styles.scopeTab, ...(dateScope === scope ? styles.scopeTabActive : {}) }}>
            {scope}
            <span style={styles.scopeCount}>
              {scope === "Upcoming"
                ? orders.filter(o => o.reservation_date >= today).length
                : scope === "Past"
                ? orders.filter(o => o.reservation_date < today).length
                : orders.length}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {["All", ...CATERING_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ ...styles.tab, ...(filter === s ? styles.tabActive : {}) }}>
              {s} {counts[s] > 0 && <span style={styles.tabCount}>{counts[s]}</span>}
            </button>
          ))}
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon.Search size={16} /></span>
          <input type="text" style={styles.searchInput}
            placeholder="Search by customer, event, venue..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={styles.stateBox}><div style={styles.stateText}>Loading catering orders...</div></div>
      ) : filtered.length === 0 ? (
        <div style={styles.stateBox}>
          <div style={styles.stateText}>No catering orders found</div>
          <div style={styles.stateSubtext}>
            {search ? "Try a different search term." : "New catering bookings will appear here."}
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(o => {
            // ✅ FIXED: Removed unused 'cart' variable on this line!
            const days = daysUntil(o.reservation_date);
            const isUpcoming = days >= 0 && o.status !== "Completed" && o.status !== "Cancelled";
            const isUrgent = days >= 0 && days <= 3 && isUpcoming;
            const strip = (STATUS_CFG[o.status] || STATUS_CFG.Pending).strip;

            return (
              <div key={o.id}
                style={{ ...styles.card, ...(isUrgent ? styles.cardUrgent : {}) }}
              >
                {/* Colored status strip on the left */}
                <div style={{ ...styles.cardStrip, background: strip }} />

                <div style={styles.cardInner}>
                  {/* Top row */}
                  <div style={styles.cardTop}>
                    <div style={styles.cardRef}>
                      <span style={styles.cardRefLabel}>CAT</span>
                      <span style={styles.cardRefNum}>#{String(o.id).padStart(5, "0")}</span>
                    </div>

                    <div style={styles.cardCustomer}>
                      <div style={styles.cardName}>{o.name || "Guest"}</div>
                      <div style={styles.cardContact}>
                        <Icon.Phone size={12} /> {o.contact || "—"}
                      </div>
                    </div>

                    <div style={styles.cardWhen}>
                      <div style={styles.cardWhenLine}>
                        <Icon.Calendar size={14} />
                        <span>{formatDateLong(o.reservation_date)}</span>
                      </div>
                      <div style={styles.cardWhenSub}>
                        <Icon.Clock size={12} /> {formatTime(o.reservation_time)}
                        <span style={styles.dot}>·</span>
                        <Icon.Users size={12} /> {o.pax} pax
                      </div>
                      {o.venue && (
                        <div style={styles.cardVenue}>
                          <Icon.MapPin size={12} /> {o.venue}
                        </div>
                      )}
                    </div>

                    <div style={styles.cardStatus}>
                      <StatusBadge status={o.status} />
                      <div style={styles.cardTotal}>{formatCurrency(o.total)}</div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={styles.cardActions}>
                    {o.event_type && (
                      <span style={styles.cardEventTag}>{o.event_type}</span>
                    )}
                    {isUpcoming && (
                      <span style={{
                        ...styles.cardCountdown,
                        ...(isUrgent ? styles.cardCountdownUrgent : {}),
                      }}>
                        {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days away`}
                      </span>
                    )}
                    {o.payment_status && (
                      <span style={styles.cardPayTag}>
                        Payment: {o.payment_status}
                      </span>
                    )}

                    <div style={styles.cardActionSpacer} />

                    {o.status === "Pending" && (
                      <>
                        <button
                          disabled={busyId === o.id}
                          style={styles.approveBtn}
                          onClick={() => updateStatus(o.id, "Confirmed")}
                        >
                          <Icon.Check size={14} /> Confirm
                        </button>
                        <button
                          disabled={busyId === o.id}
                          style={styles.rejectBtn}
                          onClick={() => {
                            if (window.confirm("Cancel this catering order?")) {
                              updateStatus(o.id, "Cancelled");
                            }
                          }}
                        >
                          <Icon.X size={14} /> Reject
                        </button>
                      </>
                    )}

                    {o.status === "Confirmed" && (
                      <button
                        disabled={busyId === o.id}
                        style={styles.prepareBtn}
                        onClick={() => updateStatus(o.id, "Preparing")}
                      >
                        Start Preparing
                      </button>
                    )}

                    <button
                      style={styles.viewBtn}
                      onClick={() => setDrawerOrder(o)}
                    >
                      <Icon.Eye size={14} /> Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {drawerOrder && (
        <DetailDrawer
          order={drawerOrder}
          onClose={() => setDrawerOrder(null)}
          onUpdateStatus={updateStatus}
          onUpdatePayment={updatePayment}
          busyId={busyId}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statBar, background: accent }} />
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
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
    maxWidth: 1280, margin: "0 auto 24px",
  },
  eyebrow: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "1.2px",
    marginBottom: 6,
  },
  headerTitle: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  headerSubtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  refreshBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },

  // Pending alert banner
  alertBanner: {
    display: "flex", alignItems: "center", gap: 14,
    maxWidth: 1280, margin: "0 auto 20px",
    background: "#FFFBEB", border: "1px solid #FDE68A",
    borderRadius: 14, padding: "16px 20px",
  },
  alertIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    background: "#FEF3C7", color: "#B45309",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  alertText: { flex: 1, minWidth: 0 },
  alertSub: { fontSize: 12, color: "#92400E", marginTop: 2 },
  alertBtn: {
    padding: "8px 14px", background: "#1C1917",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    flexShrink: 0,
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12, maxWidth: 1280, margin: "0 auto 16px",
  },
  statCard: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, padding: "18px 18px 16px",
    position: "relative", overflow: "hidden",
  },
  statBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  statValue: {
    fontSize: 26, fontWeight: 800, color: "#1C1917",
    letterSpacing: "-0.5px", lineHeight: 1,
  },
  statLabel: {
    fontSize: 11, color: "#78716C", marginTop: 6,
    textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.6px",
  },

  scopeRow: {
    display: "flex", gap: 6, maxWidth: 1280, margin: "0 auto 12px",
  },
  scopeTab: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 16px", background: "#FFFFFF",
    border: "1px solid #E7E5E4", borderRadius: 10,
    color: "#57534E", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  scopeTabActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
  },
  scopeCount: {
    fontSize: 11, padding: "1px 8px",
    background: "rgba(0,0,0,0.08)", borderRadius: 10, fontWeight: 800,
  },

  toolbar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 14,
    maxWidth: 1280, margin: "0 auto 20px",
  },
  tabs: { display: "flex", gap: 6, flexWrap: "wrap" },
  tab: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#FFFFFF",
    border: "1px solid #E7E5E4", borderRadius: 20,
    color: "#57534E", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  tabActive: { background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF" },
  tabCount: {
    fontSize: 11, padding: "1px 6px",
    background: "rgba(0,0,0,0.1)", borderRadius: 10, fontWeight: 700,
  },
  searchWrap: { position: "relative", display: "flex", alignItems: "center", minWidth: 260 },
  searchIcon: {
    position: "absolute", left: 14, color: "#A8A29E",
    display: "flex", alignItems: "center", pointerEvents: "none",
  },
  searchInput: {
    padding: "11px 14px 11px 42px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  },

  stateBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "80px 20px", gap: 10,
    maxWidth: 1280, margin: "0 auto",
  },
  stateText: { fontSize: 15, color: "#78716C", fontWeight: 600 },
  stateSubtext: { fontSize: 13, color: "#A8A29E" },

  list: {
    display: "flex", flexDirection: "column", gap: 12,
    maxWidth: 1280, margin: "0 auto",
  },

  // ── Card redesign ──
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    transition: "box-shadow 0.15s",
  },
  cardUrgent: {
    borderColor: "#F59E0B",
    boxShadow: "0 0 0 3px rgba(245,158,11,0.08)",
  },
  cardStrip: { width: 5, flexShrink: 0 },
  cardInner: {
    flex: 1, padding: "18px 22px 16px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  cardTop: {
    display: "grid",
    gridTemplateColumns: "auto 1.2fr 1.4fr auto",
    gap: 20, alignItems: "center",
  },
  cardRef: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#1C1917", color: "#FFFFFF",
    borderRadius: 10, padding: "8px 12px",
    minWidth: 72, flexShrink: 0,
  },
  cardRefLabel: {
    fontSize: 9, color: "#A8A29E", letterSpacing: "0.8px",
    fontWeight: 700, textTransform: "uppercase",
  },
  cardRefNum: { fontSize: 13, fontWeight: 800, color: "#FDE68A", marginTop: 2 },
  cardCustomer: { minWidth: 0 },
  cardName: {
    fontSize: 16, fontWeight: 700, color: "#1C1917",
    marginBottom: 4, whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  cardContact: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#78716C",
  },
  cardWhen: { minWidth: 0, display: "flex", flexDirection: "column", gap: 3 },
  cardWhenLine: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 13, color: "#1C1917", fontWeight: 700,
  },
  cardWhenSub: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#78716C",
  },
  dot: { color: "#D6D3D1" },
  cardVenue: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#78716C",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  cardStatus: {
    display: "flex", flexDirection: "column",
    alignItems: "flex-end", gap: 6, flexShrink: 0,
  },
  cardTotal: { fontSize: 15, fontWeight: 800, color: "#1C1917" },

  statusBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 700,
    padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap",
  },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },

  // Action row
  cardActions: {
    display: "flex", alignItems: "center", gap: 8,
    flexWrap: "wrap",
    paddingTop: 12,
    borderTop: "1px solid #F5F5F4",
  },
  cardEventTag: {
    fontSize: 11, color: "#1C1917", fontWeight: 700,
    background: "#F5F5F4", border: "1px solid #E7E5E4",
    padding: "4px 10px", borderRadius: 6,
  },
  cardCountdown: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
    background: "#EFF6FF", color: "#1E40AF",
    padding: "4px 10px", borderRadius: 6,
  },
  cardCountdownUrgent: { background: "#FEF3C7", color: "#92400E" },
  cardPayTag: {
    fontSize: 11, fontWeight: 700,
    color: "#78716C",
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    padding: "4px 10px", borderRadius: 6,
  },
  cardActionSpacer: { flex: 1 },

  approveBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#059669",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  rejectBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#FFFFFF",
    border: "1px solid #FECACA", borderRadius: 8,
    color: "#DC2626", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  prepareBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#F97316",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  viewBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 8,
    color: "#44403C", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Drawer styles
// ═══════════════════════════════════════════════════════════════════════
const drawer = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(12,10,9,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex", justifyContent: "flex-end",
    animation: "fadeIn 0.2s ease",
  },
  panel: {
    width: "100%", maxWidth: 560,
    height: "100vh", overflowY: "auto",
    background: "#FFFFFF",
    boxShadow: "-20px 0 60px rgba(0,0,0,0.15)",
    display: "flex", flexDirection: "column",
    animation: "slideIn 0.25s ease",
  },
  header: {
    padding: "24px 28px 20px",
    borderBottom: "1px solid #F5F5F4",
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: 16,
    background: "#FFFFFF",
    position: "sticky", top: 0, zIndex: 10,
  },
  eyebrow: {
    fontSize: 10, color: "#A8A29E", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "1.2px",
    marginBottom: 4,
  },
  title: {
    margin: "0 0 6px", fontSize: 22, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.4px",
  },
  subline: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#78716C",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    color: "#44403C", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  statusStrip: { height: 4 },

  body: {
    padding: "24px 28px 40px",
    display: "flex", flexDirection: "column", gap: 24,
  },
  actionRow: {
    display: "flex", gap: 10, flexWrap: "wrap",
  },
  approveBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "12px 20px", background: "#059669",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    flex: 1, justifyContent: "center",
  },
  prepareBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "12px 20px", background: "#F97316",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    flex: 1, justifyContent: "center",
  },
  rejectBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "12px 20px", background: "#FFFFFF",
    border: "1px solid #FECACA", borderRadius: 10,
    color: "#DC2626", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    flex: 1, justifyContent: "center",
  },
  section: { display: "flex", flexDirection: "column", gap: 12 },
  sectionLabel: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
  },
  empty: { fontSize: 13, color: "#A8A29E", fontStyle: "italic" },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14, background: "#FAFAF9",
    border: "1px solid #E7E5E4", borderRadius: 12,
    padding: "18px 20px",
  },
  infoRow: { display: "flex", flexDirection: "column", gap: 4 },
  infoLabel: {
    fontSize: 10, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.6px",
  },
  infoValue: { fontSize: 14, color: "#1C1917", fontWeight: 700 },

  itemsTable: {
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    borderRadius: 12, padding: "14px 18px",
    display: "flex", flexDirection: "column",
  },
  itemRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 13, color: "#44403C", padding: "7px 0",
    gap: 12,
  },
  itemName: { fontWeight: 500 },
  itemPrice: { color: "#78716C", flexShrink: 0 },
  itemTotalRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, fontWeight: 800, color: "#1C1917",
    marginTop: 8, paddingTop: 12, borderTop: "1px dashed #D6D3D1",
  },

  paymentBox: {
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    borderRadius: 12, padding: "14px 18px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  paymentRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12,
  },
  paymentLabel: {
    fontSize: 12, color: "#78716C", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  paymentValue: {
    fontSize: 13, color: "#1C1917", fontWeight: 700,
    textAlign: "right",
  },
  proofLink: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#0369A1", fontWeight: 700,
    textDecoration: "none",
  },

  btnRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  pill: {
    padding: "9px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  pillActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
  },

  notesBox: {
    background: "#FFFBEB", border: "1px solid #FDE68A",
    borderRadius: 12, padding: "14px 18px",
    fontSize: 13, color: "#78350F", lineHeight: 1.6,
  },
};
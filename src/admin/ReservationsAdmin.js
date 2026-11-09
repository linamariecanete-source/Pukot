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

const ORDER_STATUSES = ["Pending", "Confirmed", "Cooking", "Ready", "Served", "Cancelled"];

const STATUS_CFG = {
  Pending:   { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  Confirmed: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  Cooking:   { bg: "#FFEDD5", color: "#9A3412", dot: "#F97316" },
  Ready:     { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  Served:    { bg: "#E5E7EB", color: "#374151", dot: "#6B7280" },
  Cancelled: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
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
  Flame: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Phone: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Table: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 8l3-4h12l3 4"/>
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

// ═══════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════
export default function ReservationsAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [dateScope, setDateScope] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [tableInput, setTableInput] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("reservation_type", "Dine-in")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });
    if (!error) setOrders(data || []);
    else console.error("Fetch error:", error.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase.channel("admin-dinein")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

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
        String(o.id).includes(q)
      );
    }
    return items;
  }, [scopedOrders, filter, search]);

  const counts = useMemo(() => {
    const c = { All: scopedOrders.length };
    ORDER_STATUSES.forEach(s => { c[s] = scopedOrders.filter(o => o.status === s).length; });
    return c;
  }, [scopedOrders]);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) alert("Error: " + error.message);
    await fetchOrders();
    setBusyId(null);
  };

  const assignTable = async (id) => {
    const val = tableInput[id];
    if (!val || val < 1) return alert("Enter a valid table number.");
    setBusyId(id);
    const { error } = await supabase.from("orders")
      .update({ table_number: Number(val), status: "Confirmed" })
      .eq("id", id);
    if (error) alert("Error: " + error.message);
    await fetchOrders();
    setBusyId(null);
    setTableInput(prev => ({ ...prev, [id]: "" }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Dine-in Reservations</h1>
          <p style={styles.headerSubtitle}>
            Manage table bookings, assign tables, and track order progress
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchOrders}>
          <Icon.Refresh size={14} /> Refresh
        </button>
      </div>

      <div style={styles.statsRow}>
        <StatCard label="Upcoming" value={orders.filter(o => o.reservation_date >= today).length} accent="#1C1917" />
        <StatCard label="Pending" value={orders.filter(o => o.status === "Pending" && o.reservation_date >= today).length} accent="#F59E0B" />
        <StatCard label="Confirmed" value={orders.filter(o => o.status === "Confirmed" && o.reservation_date >= today).length} accent="#10B981" />
        <StatCard label="Cooking" value={orders.filter(o => o.status === "Cooking").length} accent="#F97316" />
        <StatCard label="Ready" value={orders.filter(o => o.status === "Ready").length} accent="#3B82F6" />
        <StatCard label="Served" value={orders.filter(o => o.status === "Served").length} accent="#6B7280" />
      </div>

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
          {["All", ...ORDER_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ ...styles.tab, ...(filter === s ? styles.tabActive : {}) }}>
              {s} {counts[s] > 0 && <span style={styles.tabCount}>{counts[s]}</span>}
            </button>
          ))}
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon.Search size={16} /></span>
          <input type="text" style={styles.searchInput}
            placeholder="Search by name, contact, or ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={styles.stateBox}><div style={styles.stateText}>Loading reservations...</div></div>
      ) : filtered.length === 0 ? (
        <div style={styles.stateBox}>
          <div style={styles.stateText}>No reservations found</div>
          <div style={styles.stateSubtext}>
            {search ? "Try a different search term." : "New bookings will appear here in real time."}
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(o => {
            const isOpen = expanded === o.id;
            const isToday = o.reservation_date === today;
            const isPast = o.reservation_date < today;
            const cart = Array.isArray(o.cart) ? o.cart : [];

            return (
              <div key={o.id} style={{
                ...styles.card,
                ...(isToday && o.status !== "Served" && o.status !== "Cancelled" ? styles.cardToday : {}),
                ...(isPast && o.status !== "Served" && o.status !== "Cancelled" ? styles.cardPast : {}),
              }}>
                <div style={styles.cardHeader} onClick={() => setExpanded(isOpen ? null : o.id)}>
                  <div style={styles.cardHeaderLeft}>
                    <div style={styles.ref}>
                      <span style={styles.refLabel}>RSV</span>
                      <span style={styles.refNum}>#{String(o.id).padStart(5, "0")}</span>
                    </div>
                    <div style={styles.customer}>
                      <div style={styles.customerName}>{o.name || "Guest"}</div>
                      <div style={styles.customerContact}>
                        <Icon.Phone size={12} /> {o.contact || "—"}
                      </div>
                    </div>
                  </div>

                  <div style={styles.cardHeaderMid}>
                    <div style={styles.metaLine}>
                      <Icon.Clock size={14} /> {formatTime(o.reservation_time)}
                      <span style={styles.metaDot}>·</span>
                      <Icon.Users size={14} /> {o.pax} pax
                    </div>
                    <div style={styles.metaDate}>{o.reservation_date}</div>
                    {o.table_number && (
                      <div style={styles.tableChip}>
                        <Icon.Table size={12} /> Table {o.table_number}
                      </div>
                    )}
                    {o.is_peak_hour && (
                      <div style={styles.peakChip}>
                        <Icon.Flame size={12} /> Peak hour
                      </div>
                    )}
                  </div>

                  <div style={styles.cardHeaderRight}>
                    <StatusBadge status={o.status} />
                    <div style={styles.total}>{formatCurrency(o.total)}</div>
                  </div>

                  <div style={styles.chevron}>{isOpen ? "▾" : "▸"}</div>
                </div>

                {isOpen && (
                  <div style={styles.cardBody}>
                    <div style={styles.section}>
                      <div style={styles.sectionLabel}>Pre-ordered Items</div>
                      {cart.length === 0 ? (
                        <div style={styles.empty}>No items pre-ordered.</div>
                      ) : (
                        <div style={styles.itemsTable}>
                          {cart.map((it, i) => (
                            <div key={i} style={styles.itemRow}>
                              <span style={styles.itemName}>
                                {it.qty} × {it.name}
                              </span>
                              <span style={styles.itemPrice}>
                                {formatCurrency(it.qty * it.price)}
                              </span>
                            </div>
                          ))}
                          <div style={styles.itemTotalRow}>
                            <span>Total</span>
                            <span>{formatCurrency(o.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={styles.section}>
                      <div style={styles.sectionLabel}>Payment</div>
                      <div style={styles.paymentBox}>
                        <div style={styles.paymentRow}>
                          <span style={styles.paymentLabel}>Total</span>
                          <span style={styles.paymentValue}>{formatCurrency(o.total)}</span>
                        </div>
                        <div style={styles.paymentRow}>
                          <span style={styles.paymentLabel}>Downpayment</span>
                          <span style={styles.paymentValue}>{formatCurrency(o.downpayment || 0)}</span>
                        </div>
                        {o.downpayment > 0 && (
                          <>
                            <div style={styles.paymentRow}>
                              <span style={styles.paymentLabel}>Method</span>
                              <span style={styles.paymentValue}>{o.payment_method || "—"}</span>
                            </div>
                            <div style={styles.paymentRow}>
                              <span style={styles.paymentLabel}>Reference</span>
                              <span style={styles.paymentValue}>{o.payment_reference || "—"}</span>
                            </div>
                            <div style={styles.paymentRow}>
                              <span style={styles.paymentLabel}>Status</span>
                              <span style={styles.paymentValue}>{o.payment_status || "Pending"}</span>
                            </div>
                            {o.payment_proof_url && (
                              <div style={styles.paymentRow}>
                                <span style={styles.paymentLabel}>Proof</span>
                                <a
                                  href={o.payment_proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={styles.proofLink}
                                >
                                  <Icon.Image size={12} /> View screenshot
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {o.notes && (
                      <div style={styles.section}>
                        <div style={styles.sectionLabel}>Special Requests</div>
                        <div style={styles.notesBox}>{o.notes}</div>
                      </div>
                    )}

                    <div style={styles.section}>
                      <div style={styles.sectionLabel}>Table Assignment</div>
                      <div style={styles.inlineRow}>
                        <input
                          type="number"
                          min="1"
                          placeholder={o.table_number ? `Current: Table ${o.table_number}` : "Enter table number"}
                          value={tableInput[o.id] || ""}
                          onChange={e => setTableInput(prev => ({ ...prev, [o.id]: e.target.value }))}
                          style={styles.tableInput}
                        />
                        <button
                          style={styles.primaryBtn}
                          disabled={busyId === o.id}
                          onClick={() => assignTable(o.id)}
                        >
                          {busyId === o.id ? "Saving..." : "Assign & Confirm"}
                        </button>
                      </div>
                    </div>

                    <div style={styles.section}>
                      <div style={styles.sectionLabel}>Update Status</div>
                      <div style={styles.statusBtns}>
                        {ORDER_STATUSES.filter(s => s !== "Cancelled").map(s => (
                          <button
                            key={s}
                            disabled={busyId === o.id || o.status === s}
                            style={{
                              ...styles.statusBtn,
                              ...(o.status === s ? styles.statusBtnActive : {}),
                            }}
                            onClick={() => updateStatus(o.id, s)}
                          >
                            {s}
                          </button>
                        ))}
                        <button
                          disabled={busyId === o.id || o.status === "Cancelled"}
                          style={styles.dangerBtn}
                          onClick={() => {
                            if (window.confirm("Cancel this reservation?")) {
                              updateStatus(o.id, "Cancelled");
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
    maxWidth: 1280, margin: "0 auto 28px",
  },
  headerTitle: {
    margin: "0 0 6px", fontSize: 26, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.6px",
  },
  headerSubtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  refreshBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
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
  statBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
  },
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
  card: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, overflow: "hidden",
    transition: "box-shadow 0.15s",
  },
  cardToday: { borderColor: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,0.08)" },
  cardPast: { borderColor: "#FCA5A5", background: "#FFFAFA" },
  cardHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto 30px",
    gap: 16, alignItems: "center",
    padding: "18px 22px", cursor: "pointer",
  },
  cardHeaderLeft: { display: "flex", alignItems: "center", gap: 16, minWidth: 0 },
  ref: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#1C1917", color: "#FFFFFF",
    borderRadius: 10, padding: "8px 12px",
    minWidth: 70, flexShrink: 0,
  },
  refLabel: {
    fontSize: 9, color: "#A8A29E", letterSpacing: "0.8px",
    fontWeight: 700, textTransform: "uppercase",
  },
  refNum: { fontSize: 13, fontWeight: 800, color: "#FDE68A", marginTop: 2 },
  customer: { minWidth: 0 },
  customerName: {
    fontSize: 15, fontWeight: 700, color: "#1C1917",
    marginBottom: 4, whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  customerContact: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#78716C",
  },
  cardHeaderMid: { display: "flex", flexDirection: "column", gap: 4 },
  metaLine: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 13, color: "#44403C", fontWeight: 600,
  },
  metaDot: { color: "#D6D3D1" },
  metaDate: { fontSize: 12, color: "#78716C" },
  tableChip: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, color: "#047857", fontWeight: 700,
    background: "#D1FAE5", padding: "3px 8px",
    borderRadius: 6, alignSelf: "flex-start", marginTop: 2,
  },
  peakChip: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, color: "#92400E", fontWeight: 700,
    background: "#FEF3C7", padding: "3px 8px",
    borderRadius: 6, alignSelf: "flex-start", marginTop: 2,
  },
  cardHeaderRight: {
    display: "flex", flexDirection: "column",
    alignItems: "flex-end", gap: 6,
  },
  statusBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 700,
    padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap",
  },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },
  total: { fontSize: 14, fontWeight: 800, color: "#1C1917" },
  chevron: { fontSize: 14, color: "#A8A29E", textAlign: "center" },
  cardBody: {
    borderTop: "1px solid #F5F5F4",
    padding: "20px 22px 24px",
    background: "#FAFAF9",
    display: "flex", flexDirection: "column", gap: 20,
  },
  section: { display: "flex", flexDirection: "column", gap: 10 },
  sectionLabel: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
  },
  empty: { fontSize: 13, color: "#A8A29E", fontStyle: "italic" },
  itemsTable: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 10, padding: "12px 16px",
    display: "flex", flexDirection: "column",
  },
  itemRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 13, color: "#44403C", padding: "5px 0",
  },
  itemName: { fontWeight: 500 },
  itemPrice: { color: "#78716C" },
  itemTotalRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, fontWeight: 800, color: "#1C1917",
    marginTop: 8, paddingTop: 8, borderTop: "1px dashed #D6D3D1",
  },
  paymentBox: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 10, padding: "12px 16px",
    display: "flex", flexDirection: "column", gap: 8,
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
  },
  proofLink: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#0369A1", fontWeight: 700,
    textDecoration: "none",
  },
  notesBox: {
    background: "#FFFBEB", border: "1px solid #FDE68A",
    borderRadius: 10, padding: "12px 16px",
    fontSize: 13, color: "#78350F", lineHeight: 1.5,
  },
  inlineRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  tableInput: {
    padding: "11px 14px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: 200,
  },
  primaryBtn: {
    padding: "11px 20px", background: "#1C1917",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  statusBtns: { display: "flex", gap: 8, flexWrap: "wrap" },
  statusBtn: {
    padding: "9px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  statusBtnActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
  },
  dangerBtn: {
    padding: "9px 16px", background: "#FFFFFF",
    border: "1px solid #FECACA", borderRadius: 10,
    color: "#DC2626", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
};
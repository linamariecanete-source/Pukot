// src/customer/CustomerDashboard.js
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// ── Minimalist SVG Icons ──────────────────────────────────────────────
const Icon = {
  Calendar: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Menu: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
  Catering: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/>
      <path d="M7 4h.01M12 4h.01M17 4h.01"/>
    </svg>
  ),
  History: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <polyline points="12 7 12 12 15 15"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const quickActions = [
  { label: "Book a Table",     icon: <Icon.Calendar size={20} />, path: "/customer/reservations", desc: "Reserve your spot",   color: "#1C1917" },
  { label: "Browse Menu",      icon: <Icon.Menu size={20} />,     path: "/customer/menu",         desc: "Explore our dishes",  color: "#1C1917" },
  { label: "Catering Inquiry", icon: <Icon.Catering size={20} />, path: "/customer/catering",     desc: "Plan your event",     color: "#1C1917" },
  { label: "View History",     icon: <Icon.History size={20} />,  path: "/customer/history",      desc: "Past activities",     color: "#1C1917" },
];

const statusCfg = {
  pending:   { color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B", label: "Pending"   },
  confirmed: { color: "#065F46", bg: "#D1FAE5", dot: "#10B981", label: "Confirmed" },
  cooking:   { color: "#9A3412", bg: "#FFEDD5", dot: "#F97316", label: "Cooking"   },
  preparing: { color: "#9A3412", bg: "#FFEDD5", dot: "#F97316", label: "Preparing" },
  ready:     { color: "#1E40AF", bg: "#DBEAFE", dot: "#3B82F6", label: "Ready"     },
  served:    { color: "#374151", bg: "#E5E7EB", dot: "#6B7280", label: "Served"    },
  delivered: { color: "#1E40AF", bg: "#DBEAFE", dot: "#3B82F6", label: "Delivered" },
  completed: { color: "#374151", bg: "#E5E7EB", dot: "#6B7280", label: "Completed" },
  cancelled: { color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444", label: "Cancelled" },
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const fetchData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);

    const [ordersResult, notifResult] = await Promise.all([
      supabase.from("orders").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("notifications").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    setOrders(ordersResult.data || []);
    setNotifications(notifResult.data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
    if (!user?.id) return;

    const ordersCh = supabase.channel("dash-orders-" + user.id)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "orders", filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") setOrders(prev => [payload.new, ...prev].slice(0, 10));
        else if (payload.eventType === "UPDATE") setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        else if (payload.eventType === "DELETE") setOrders(prev => prev.filter(o => o.id !== payload.old.id));
      }).subscribe();

    return () => supabase.removeChannel(ordersCh);
  }, [user?.id, fetchData]);

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const reservations = orders.filter(o => o.reservation_type === "Dine-in");
  const catering = orders.filter(o => o.reservation_type === "Catering");
  
  const activeReservationsCount = reservations.filter(o => !["Served", "Completed", "Cancelled"].includes(o.status)).length;
  const activeCat = catering.filter(o => !["Completed", "Cancelled"].includes(o.status)).length;
  const totalActivities = orders.length;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "";
  const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

  const statCards = [
    { label: "Active Reservations", value: activeReservationsCount, icon: <Icon.Calendar size={22} />, path: "/customer/orderstatus" },
    { label: "Catering Orders",     value: activeCat,               icon: <Icon.Catering size={22} />, path: "/customer/orderstatus" },
    { label: "Total Activities",    value: totalActivities,         icon: <Icon.History size={22} />, path: "/customer/history" },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <p style={S.greeting}>{greeting},</p>
          <h1 style={S.name}>{user?.full_name || "Guest"}</h1>
          <p style={S.subtitle}>Welcome to your dining dashboard</p>
        </div>
        <div style={S.dateBox}>
          <div style={S.dateDay}>{new Date().getDate()}</div>
          <div style={S.dateMon}>{new Date().toLocaleString("default", { month: "short" })}</div>
          <div style={S.dateYear}>{new Date().getFullYear()}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {statCards.map(s => (
          <div key={s.label} style={S.statCard} onClick={() => navigate(s.path)}>
            <div style={S.statIcon}>
              {s.icon}
            </div>
            <div>
              <div style={S.statValue}>{loading ? <span style={S.skel} /> : s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
            <span style={S.statArrow}><Icon.ArrowRight size={16} /></span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={S.sectionTitle}>Quick Actions</h2>
      <div style={S.actionsGrid}>
        {quickActions.map(a => (
          <button key={a.label} style={S.actionCard} onClick={() => navigate(a.path)}>
            <div style={S.actionIcon}>
              {a.icon}
            </div>
            <div style={S.actionText}>
              <span style={S.actionLabel}>{a.label}</span>
              <span style={S.actionDesc}>{a.desc}</span>
            </div>
            <span style={S.actionArrow}><Icon.ArrowRight size={16} /></span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 style={S.sectionTitle}>Recent Activity</h2>
      <div style={S.recentGrid}>
        {/* Dine-in Reservations */}
        <div style={S.recentCard}>
          <div style={S.recentHead}>
            <span style={S.recentTitle}>Dine-in Reservations</span>
            <button style={S.viewAllBtn} onClick={() => navigate("/customer/orderstatus")}>View All</button>
          </div>

          {loading ? (
            <div style={S.recentLoading}>Loading...</div>
          ) : reservations.length === 0 ? (
            <div style={S.emptyState}>
              <Icon.Calendar size={28} style={{ color: "#A8A29E" }} />
              <span style={S.emptyText}>No reservations yet</span>
              <button style={S.emptyBtn} onClick={() => navigate("/customer/reservations")}>Book a Table</button>
            </div>
          ) : (
            <div style={S.recentList}>
              {reservations.slice(0, 5).map(r => {
                const cfg = statusCfg[r.status?.toLowerCase()] || statusCfg.pending;
                return (
                  <div key={r.id} style={S.recentItem}>
                    <div style={S.recentLeft}>
                      <div style={{ ...S.statusDot, background: cfg.dot }} />
                      <div>
                        <div style={S.recentMain}>{fmtTime(r.reservation_time)} · {r.pax} pax</div>
                        <div style={S.recentSub}>{fmtDate(r.reservation_date)}</div>
                      </div>
                    </div>
                    <div style={{ ...S.recentBadge, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Catering */}
        <div style={S.recentCard}>
          <div style={S.recentHead}>
            <span style={S.recentTitle}>Catering Orders</span>
            <button style={S.viewAllBtn} onClick={() => navigate("/customer/orderstatus")}>View All</button>
          </div>

          {loading ? (
            <div style={S.recentLoading}>Loading...</div>
          ) : catering.length === 0 ? (
            <div style={S.emptyState}>
              <Icon.Catering size={28} style={{ color: "#A8A29E" }} />
              <span style={S.emptyText}>No catering orders yet</span>
              <button style={S.emptyBtn} onClick={() => navigate("/customer/catering")}>Submit Inquiry</button>
            </div>
          ) : (
            <div style={S.recentList}>
              {catering.slice(0, 5).map(o => {
                const cfg = statusCfg[o.status?.toLowerCase()] || statusCfg.pending;
                return (
                  <div key={o.id} style={S.recentItem}>
                    <div style={S.recentLeft}>
                      <div style={{ ...S.statusDot, background: cfg.dot }} />
                      <div>
                        <div style={S.recentMain}>{o.event_type || "Event"} · {o.pax} pax</div>
                        <div style={S.recentSub}>{fmtDate(o.reservation_date)}</div>
                      </div>
                    </div>
                    <div style={{ ...S.recentBadge, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <>
          <h2 style={S.sectionTitle}>
            Notifications {unreadNotifs > 0 && <span style={S.notifBadge}>{unreadNotifs}</span>}
          </h2>
          <div style={S.notifList}>
            {notifications.slice(0, 4).map(notif => (
              <div key={notif.id} 
                style={{ ...S.notifItem, ...(notif.is_read ? {} : S.notifUnread) }} 
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div style={S.notifContent}>
                  <div style={S.notifTitle}>{notif.title}</div>
                  <div style={S.notifMessage}>{notif.message?.replace(/\\n/g, '\n')}</div>
                  <div style={S.notifTime}>{new Date(notif.created_at).toLocaleDateString()}</div>
                </div>
                {!notif.is_read && <div style={S.notifDot} />}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Promo Banner */}
      <div style={S.banner}>
        <div>
          <div style={S.bannerTag}>Limited Time Offer</div>
          <div style={S.bannerTitle}>Special Weekend Deal</div>
          <div style={S.bannerText}>
            Book a table for 4+ guests and get a complimentary dessert platter.
            Check out our Pukot Feast packages starting at ₱699!
          </div>
          <div style={S.bannerBtns}>
            <button style={S.bannerBtn} onClick={() => navigate("/customer/reservations")}>Reserve Now</button>
            <button style={S.bannerBtnOutline} onClick={() => navigate("/customer/menu")}>View Packages</button>
          </div>
        </div>
        <div style={S.bannerIconWrap}>
           <Icon.Catering size={48} style={{ color: "#A8A29E" }} />
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { 
    padding: "40px 48px 60px", 
    maxWidth: 1100, 
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    minHeight: "100vh",
    background: "#FAFAF9",
    color: "#1C1917",
  },
  header: { 
    display: "flex", justifyContent: "space-between", 
    alignItems: "flex-start", marginBottom: 32,
  },
  greeting: { 
    margin: 0, fontSize: 11, color: "#78716C", 
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px",
  },
  name: { 
    margin: "6px 0 8px", fontSize: 28, fontWeight: 800, 
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  subtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  dateBox: { 
    textAlign: "center", background: "#FFFFFF", 
    border: "1px solid #E7E5E4", borderRadius: 14, 
    padding: "12px 24px", boxShadow: "0 1px 3px rgba(28,25,23,0.04)",
  },
  dateDay: { 
    fontSize: 32, fontWeight: 800, color: "#1C1917", 
    lineHeight: 1, letterSpacing: "-1px",
  },
  dateMon: { 
    fontSize: 11, color: "#78716C", marginTop: 4, 
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
  },
  dateYear: { fontSize: 11, color: "#A8A29E", marginTop: 2, fontWeight: 600 },
  
  statsRow: { display: "flex", gap: 16, marginBottom: 32 },
  statCard: { 
    flex: 1, background: "#FFFFFF", border: "1px solid #E7E5E4", 
    borderRadius: 14, padding: "20px 24px", display: "flex", 
    alignItems: "center", gap: 16, cursor: "pointer", 
    boxShadow: "0 1px 3px rgba(28,25,23,0.04)", transition: "border-color 0.2s",
  },
  statIcon: { 
    width: 48, height: 48, borderRadius: 12, 
    background: "#F5F5F4", color: "#44403C",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, 
  },
  statValue: { 
    fontSize: 26, fontWeight: 800, color: "#1C1917", 
    lineHeight: 1, minWidth: 28, letterSpacing: "-0.5px",
  },
  statLabel: { fontSize: 12, color: "#78716C", marginTop: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  statArrow: { marginLeft: "auto", color: "#A8A29E", display: "flex" },
  skel: { display: "inline-block", width: 28, height: 24, background: "#F5F5F4", borderRadius: 6 },
  
  sectionTitle: { 
    fontSize: 16, fontWeight: 700, color: "#1C1917", 
    marginBottom: 16, 
  },
  
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 },
  actionCard: { 
    display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", 
    background: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 14, 
    cursor: "pointer", textAlign: "left", boxShadow: "0 1px 3px rgba(28,25,23,0.04)",
    transition: "border-color 0.2s", fontFamily: "inherit",
  },
  actionIcon: { 
    width: 44, height: 44, borderRadius: 12, 
    background: "#FAFAF9", border: "1px solid #E7E5E4", color: "#44403C",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, 
  },
  actionText: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  actionLabel: { fontSize: 15, fontWeight: 700, color: "#1C1917" },
  actionDesc: { fontSize: 13, color: "#78716C" },
  actionArrow: { color: "#A8A29E", display: "flex" },
  
  recentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 },
  recentCard: { 
    background: "#FFFFFF", border: "1px solid #E7E5E4", 
    borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 3px rgba(28,25,23,0.04)", 
  },
  recentHead: { 
    display: "flex", justifyContent: "space-between", 
    alignItems: "center", marginBottom: 16, 
    borderBottom: "1px solid #F5F5F4", paddingBottom: 12,
  },
  recentTitle: { fontSize: 15, fontWeight: 700, color: "#1C1917" },
  viewAllBtn: { 
    fontSize: 12, color: "#1C1917", background: "transparent", 
    border: "none", cursor: "pointer", fontWeight: 700, 
    textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "inherit",
  },
  recentLoading: { fontSize: 14, color: "#78716C", textAlign: "center", padding: "24px 0", fontWeight: 600 },
  emptyState: { 
    display: "flex", flexDirection: "column", alignItems: "center", 
    gap: 10, padding: "30px 0", 
  },
  emptyText: { fontSize: 14, color: "#78716C", fontWeight: 500 },
  emptyBtn: { 
    marginTop: 4, padding: "8px 16px", background: "#FAFAF9", 
    border: "1px solid #E7E5E4", borderRadius: 8, color: "#44403C", 
    cursor: "pointer", fontSize: 12, fontWeight: 600, 
    transition: "all 0.2s", fontFamily: "inherit",
  },
  recentList: { display: "flex", flexDirection: "column", gap: 10 },
  recentItem: { 
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", 
    padding: "14px", background: "#FAFAF9", border: "1px solid #F5F5F4", 
    borderRadius: 12, 
  },
  recentLeft: { display: "flex", alignItems: "flex-start", gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6 },
  recentMain: { fontSize: 14, fontWeight: 700, color: "#1C1917" },
  recentSub: { fontSize: 12, color: "#78716C", marginTop: 3, fontWeight: 500 },
  recentBadge: { 
    fontSize: 11, fontWeight: 700, padding: "4px 10px", 
    borderRadius: 20, textTransform: "capitalize", flexShrink: 0, 
    whiteSpace: "nowrap", 
  },
  
  notifList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 },
  notifItem: { 
    background: "#FFFFFF", border: "1px solid #E7E5E4", 
    borderRadius: 12, padding: 16, cursor: "pointer", 
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    boxShadow: "0 1px 3px rgba(28,25,23,0.04)",
  },
  notifUnread: { background: "#FAFAF9", border: "1px solid #D6D3D1" },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: 700, color: "#1C1917", marginBottom: 6 },
  notifMessage: { fontSize: 13, color: "#78716C", lineHeight: 1.5, whiteSpace: "pre-line" },
  notifTime: { fontSize: 11, color: "#A8A29E", marginTop: 8, fontWeight: 600 },
  notifDot: { width: 8, height: 8, background: "#1C1917", borderRadius: "50%", flexShrink: 0, marginTop: 4 },
  notifBadge: { 
    background: "#1C1917", color: "white", fontSize: 11, 
    fontWeight: 700, padding: "2px 8px", borderRadius: 10, marginLeft: 8, 
  },
  
  banner: { 
    background: "#1C1917", border: "1px solid #1C1917", 
    borderRadius: 16, padding: "32px", display: "flex", 
    justifyContent: "space-between", alignItems: "center", 
  },
  bannerTag: { 
    fontSize: 11, color: "#A8A29E", fontWeight: 700, 
    marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px", 
  },
  bannerTitle: { fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 10, letterSpacing: "-0.5px" },
  bannerText: { 
    fontSize: 14, color: "#D6D3D1", marginBottom: 20, 
    maxWidth: 480, lineHeight: 1.6, 
  },
  bannerBtns: { display: "flex", gap: 12 },
  bannerBtn: { 
    padding: "12px 24px", background: "#FFFFFF", border: "none", 
    borderRadius: 10, color: "#1C1917", fontWeight: 700, 
    fontSize: 14, cursor: "pointer", fontFamily: "inherit",
  },
  bannerBtnOutline: { 
    padding: "12px 24px", background: "transparent", border: "1px solid #44403C", 
    borderRadius: 10, color: "#D6D3D1", fontWeight: 600, 
    fontSize: 14, cursor: "pointer", fontFamily: "inherit",
  },
  bannerIconWrap: { 
    width: 90, height: 90, borderRadius: 16, background: "#292524",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
};
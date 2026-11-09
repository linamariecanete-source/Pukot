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
  { label: "Book a Table",     icon: <Icon.Calendar size={20} />, path: "/customer/reservations", desc: "Reserve your spot",   color: "#0077b6" },
  { label: "Browse Menu",      icon: <Icon.Menu size={20} />,     path: "/customer/menu",         desc: "Explore our dishes",  color: "#00b4d8" },
  { label: "Catering Inquiry", icon: <Icon.Catering size={20} />, path: "/customer/catering",     desc: "Plan your event",     color: "#c8832a" },
  { label: "View History",     icon: <Icon.History size={20} />,  path: "/customer/history",      desc: "Past activities",     color: "#0A3D47" },
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
    { label: "Active Reservations", value: activeReservationsCount, icon: <Icon.Calendar size={22} />, color: "#0077b6", path: "/customer/orderstatus" },
    { label: "Catering Orders",     value: activeCat,               icon: <Icon.Catering size={22} />, color: "#c8832a", path: "/customer/orderstatus" },
    { label: "Total Activities",    value: totalActivities,         icon: <Icon.History size={22} />, color: "#0A3D47", path: "/customer/history" },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');
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
            <div style={{ ...S.statIcon, background: s.color + "15", color: s.color }}>
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
            <div style={{ ...S.actionIcon, background: a.color + "15", color: a.color }}>
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
              <Icon.Calendar size={28} style={{ color: "#D6D3D1" }} />
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
              <Icon.Catering size={28} style={{ color: "#D6D3D1" }} />
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
           <Icon.Catering size={48} style={{ color: "#90e0ef" }} />
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
    fontFamily: "'Nunito', sans-serif", // Body font
    minHeight: "100vh",
    background: "#FAFAF9",
    color: "#0A2A30", // Deep sea green for text
  },
  header: { 
    display: "flex", justifyContent: "space-between", 
    alignItems: "flex-start", marginBottom: 32,
  },
  greeting: { 
    margin: 0, fontSize: 14, color: "#0A5060", 
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
    fontFamily: "'Fredoka', sans-serif",
  },
  name: { 
    margin: "8px 0 10px", fontSize: 36, fontWeight: 600, 
    color: "#0A3D47", letterSpacing: "-0.5px",
    fontFamily: "'Fredoka', sans-serif",
  },
  subtitle: { margin: 0, fontSize: 16, color: "#4f758b", fontWeight: 600 },
  dateBox: { 
    textAlign: "center", background: "#FFFFFF", 
    border: "2px solid #e0f2f1", borderRadius: 20, 
    padding: "12px 24px", boxShadow: "0 4px 12px rgba(10, 61, 71, 0.04)",
  },
  dateDay: { 
    fontSize: 36, fontWeight: 600, color: "#0077b6", 
    lineHeight: 1, letterSpacing: "-1px",
    fontFamily: "'Fredoka', sans-serif",
  },
  dateMon: { 
    fontSize: 14, color: "#0A5060", marginTop: 4, 
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
  },
  dateYear: { fontSize: 13, color: "#4f758b", marginTop: 2, fontWeight: 700 },
  
  statsRow: { display: "flex", gap: 16, marginBottom: 32 },
  statCard: { 
    flex: 1, background: "#FFFFFF", border: "2px solid #e0f2f1", 
    borderRadius: 20, padding: "20px 24px", display: "flex", 
    alignItems: "center", gap: 16, cursor: "pointer", 
    boxShadow: "0 4px 12px rgba(10, 61, 71, 0.03)", transition: "transform 0.2s",
  },
  statIcon: { 
    width: 48, height: 48, borderRadius: 14, 
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, 
  },
  statValue: { 
    fontSize: 32, fontWeight: 600, color: "#0A3D47", 
    lineHeight: 1, minWidth: 28, fontFamily: "'Fredoka', sans-serif",
  },
  statLabel: { fontSize: 14, color: "#4f758b", marginTop: 4, fontWeight: 700 },
  statArrow: { marginLeft: "auto", color: "#90e0ef", display: "flex" },
  skel: { display: "inline-block", width: 28, height: 24, background: "#e0f2f1", borderRadius: 6 },
  
  sectionTitle: { 
    fontSize: 18, fontWeight: 600, color: "#0A3D47", 
    marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px", 
    fontFamily: "'Fredoka', sans-serif",
  },
  
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 },
  actionCard: { 
    display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", 
    background: "#FFFFFF", border: "2px solid #e0f2f1", borderRadius: 20, 
    cursor: "pointer", textAlign: "left", boxShadow: "0 4px 12px rgba(10, 61, 71, 0.03)",
    transition: "border-color 0.2s", fontFamily: "'Nunito', sans-serif",
  },
  actionIcon: { 
    width: 44, height: 44, borderRadius: 14, 
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, 
  },
  actionText: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  actionLabel: { fontSize: 16, fontWeight: 800, color: "#0A3D47" },
  actionDesc: { fontSize: 13, color: "#4f758b", fontWeight: 600 },
  actionArrow: { color: "#90e0ef", display: "flex" },
  
  recentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 },
  recentCard: { 
    background: "#FFFFFF", border: "2px solid #e0f2f1", 
    borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 12px rgba(10, 61, 71, 0.03)", 
  },
  recentHead: { 
    display: "flex", justifyContent: "space-between", 
    alignItems: "center", marginBottom: 16, 
    borderBottom: "2px dashed #e0f2f1", paddingBottom: 12,
  },
  recentTitle: { fontSize: 16, fontWeight: 600, color: "#0A3D47", fontFamily: "'Fredoka', sans-serif" },
  viewAllBtn: { 
    fontSize: 12, color: "#0077b6", background: "transparent", 
    border: "none", cursor: "pointer", fontWeight: 800, 
    textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Fredoka', sans-serif",
  },
  recentLoading: { fontSize: 14, color: "#4f758b", textAlign: "center", padding: "24px 0", fontWeight: 600 },
  emptyState: { 
    display: "flex", flexDirection: "column", alignItems: "center", 
    gap: 10, padding: "30px 0", 
  },
  emptyText: { fontSize: 14, color: "#4f758b", fontWeight: 600 },
  emptyBtn: { 
    marginTop: 4, padding: "8px 16px", background: "#e0f2f1", 
    border: "1px solid #b2dfdb", borderRadius: 20, color: "#0077b6", 
    cursor: "pointer", fontSize: 12, fontWeight: 800, 
    transition: "all 0.2s", fontFamily: "'Fredoka', sans-serif",
  },
  recentList: { display: "flex", flexDirection: "column", gap: 10 },
  recentItem: { 
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", 
    padding: "14px", background: "#FAFAF9", border: "1px solid #e0f2f1", 
    borderRadius: 14, 
  },
  recentLeft: { display: "flex", alignItems: "flex-start", gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6 },
  recentMain: { fontSize: 14, fontWeight: 800, color: "#0A3D47" },
  recentSub: { fontSize: 12, color: "#4f758b", marginTop: 3, fontWeight: 600 },
  recentBadge: { 
    fontSize: 11, fontWeight: 800, padding: "4px 10px", 
    borderRadius: 20, textTransform: "capitalize", flexShrink: 0, 
    whiteSpace: "nowrap", fontFamily: "'Fredoka', sans-serif",
  },
  
  notifList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 },
  notifItem: { 
    background: "#FFFFFF", border: "2px solid #e0f2f1", 
    borderRadius: 16, padding: 16, cursor: "pointer", 
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    boxShadow: "0 2px 8px rgba(10, 61, 71, 0.02)",
  },
  notifUnread: { background: "#f0fbfc", border: "2px solid #b2dfdb" },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: 800, color: "#0A3D47", marginBottom: 6 },
  notifMessage: { fontSize: 13, color: "#4f758b", lineHeight: 1.5, whiteSpace: "pre-line", fontWeight: 600 },
  notifTime: { fontSize: 11, color: "#90e0ef", marginTop: 8, fontWeight: 700 },
  notifDot: { width: 10, height: 10, background: "#0077b6", borderRadius: "50%", flexShrink: 0, marginTop: 4 },
  notifBadge: { 
    background: "#e05555", color: "white", fontSize: 11, 
    fontWeight: 800, padding: "2px 7px", borderRadius: 10, marginLeft: 8, 
  },
  
  banner: { 
    background: "#0A3D47", border: "2px solid #0A6575", 
    borderRadius: 24, padding: "32px", display: "flex", 
    justifyContent: "space-between", alignItems: "center", 
  },
  bannerTag: { 
    fontSize: 12, color: "#90e0ef", fontWeight: 800, 
    marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Fredoka', sans-serif",
  },
  bannerTitle: { fontSize: 28, fontWeight: 600, color: "#FFFFFF", marginBottom: 10, fontFamily: "'Fredoka', sans-serif" },
  bannerText: { 
    fontSize: 15, color: "#caf0f8", marginBottom: 20, 
    maxWidth: 480, lineHeight: 1.6, fontWeight: 600,
  },
  bannerBtns: { display: "flex", gap: 12 },
  bannerBtn: { 
    padding: "12px 24px", background: "#00b4d8", border: "none", 
    borderRadius: 10, color: "#0A3D47", fontWeight: 700, 
    fontSize: 14, cursor: "pointer", fontFamily: "'Fredoka', sans-serif",
  },
  bannerBtnOutline: { 
    padding: "12px 24px", background: "transparent", border: "2px solid #90e0ef", 
    borderRadius: 10, color: "#90e0ef", fontWeight: 700, 
    fontSize: 14, cursor: "pointer", fontFamily: "'Fredoka', sans-serif",
  },
  bannerIconWrap: { 
    width: 90, height: 90, borderRadius: 24, background: "#0A5060",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
};
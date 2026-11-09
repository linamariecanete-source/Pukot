// src/admin/AdminDashboard.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import PeakHourAlert from "./PeakHourAlert"; // 👈 Import added

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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const STATUS_CFG = {
  Pending:   { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  Confirmed: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  Cooking:   { bg: "#FFEDD5", color: "#9A3412", dot: "#F97316" },
  Ready:     { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  Serving:   { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  Preparing: { bg: "#FFEDD5", color: "#9A3412", dot: "#F97316" },
  Delivered: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  Completed: { bg: "#E5E7EB", color: "#374151", dot: "#6B7280" },
  Cancelled: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
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
  Users: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Cake: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/>
      <path d="M7 4h.01M12 4h.01M17 4h.01"/>
    </svg>
  ),
  Clock: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  TrendUp: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Alert: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
  Wallet: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
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
export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "{}");
    } catch { return {}; }
  })();

  const [stats, setStats] = useState({
    reservations: 0,
    catering: 0,
    users: 0,
    pending_res: 0,
    pending_cat: 0,
    confirmed_res: 0,
    todayTotal: 0,
    revenue: 0,
  });
  const [recentRes, setRecentRes] = useState([]);
  const [recentCat, setRecentCat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const [
        { count: totalRes },
        { count: totalCat },
        { count: totalUsers },
        { count: pendingRes },
        { count: pendingCat },
        { count: confirmedRes },
        { count: todayTotal },
        { data: allOrders },
        { data: latestRes },
        { data: latestCat },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("reservation_type", "Dine-in"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("reservation_type", "Catering"),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("reservation_type", "Dine-in").eq("status", "Pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("reservation_type", "Catering").eq("status", "Pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("reservation_type", "Dine-in").eq("status", "Confirmed"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("reservation_date", today),
        supabase.from("orders").select("total, downpayment").neq("status", "Cancelled"),
        supabase.from("orders").select("*").eq("reservation_type", "Dine-in").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("*").eq("reservation_type", "Catering").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (allOrders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);

      setStats({
        reservations: totalRes || 0,
        catering: totalCat || 0,
        users: totalUsers || 0,
        pending_res: pendingRes || 0,
        pending_cat: pendingCat || 0,
        confirmed_res: confirmedRes || 0,
        todayTotal: todayTotal || 0,
        revenue,
      });

      setRecentRes(latestRes || []);
      setRecentCat(latestCat || []);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchAll)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const statCards = [
    {
      label: "Dine-in Reservations",
      value: stats.reservations,
      sub: `${stats.pending_res} pending · ${stats.confirmed_res} confirmed`,
      icon: "calendar",
      accent: "#1C1917",
      link: "/admin/reservations",
    },
    {
      label: "Catering Bookings",
      value: stats.catering,
      sub: `${stats.pending_cat} pending approval`,
      icon: "cake",
      accent: "#F59E0B",
      link: "/admin/catering",
    },
    {
      label: "Registered Users",
      value: stats.users,
      sub: "Total customer accounts",
      icon: "users",
      accent: "#3B82F6",
      link: "/admin/users",
    },
    {
      label: "Today's Bookings",
      value: stats.todayTotal,
      sub: "Reservations + catering",
      icon: "clock",
      accent: "#10B981",
      link: "/admin/reservations",
    },
  ];

  const renderIcon = (name) => {
    const map = {
      calendar: <Icon.Calendar size={22} />,
      cake: <Icon.Cake size={22} />,
      users: <Icon.Users size={22} />,
      clock: <Icon.Clock size={22} />,
      trend: <Icon.TrendUp size={22} />,
      wallet: <Icon.Wallet size={22} />,
      utensils: <Icon.Utensils size={22} />,
    };
    return map[name] || <Icon.Calendar size={22} />;
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Admin Panel · Overview</div>
          <h1 style={styles.headerTitle}>
            {greeting()}, {admin.full_name?.split(" ")[0] || "Captain"}
          </h1>
          <p style={styles.headerSubtitle}>
            Here's what's happening at Pukot Seafood Restaurant today.
          </p>
        </div>
        <div style={styles.dateBox}>
          <div style={styles.dateDay}>
            {new Date().toLocaleDateString("en-PH", { weekday: "long" })}
          </div>
          <div style={styles.dateNum}>
            {new Date().toLocaleDateString("en-PH", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* 👇 PEAK HOUR ALERT ADDED HERE */}
      <PeakHourAlert />

      {/* Pending banner */}
      {(stats.pending_res + stats.pending_cat) > 0 && (
        <div style={styles.alertBanner}>
          <div style={styles.alertIconWrap}>
            <Icon.Alert size={16} />
          </div>
          <div style={styles.alertText}>
            <strong>
              {stats.pending_res + stats.pending_cat} booking
              {(stats.pending_res + stats.pending_cat) > 1 ? "s" : ""} awaiting approval
            </strong>
            <div style={styles.alertSub}>
              {stats.pending_res > 0 && `${stats.pending_res} dine-in`}
              {stats.pending_res > 0 && stats.pending_cat > 0 && " · "}
              {stats.pending_cat > 0 && `${stats.pending_cat} catering`}
            </div>
          </div>
          <button
            style={styles.alertBtn}
            onClick={() => navigate(stats.pending_res > 0 ? "/admin/reservations" : "/admin/catering")}
          >
            Review <Icon.ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        {statCards.map((c, i) => (
          <div
            key={i}
            style={styles.statCard}
            onClick={() => navigate(c.link)}
          >
            <div style={{ ...styles.statAccent, background: c.accent }} />
            <div style={styles.statTop}>
              <div style={{ ...styles.statIconWrap, color: c.accent }}>
                {renderIcon(c.icon)}
              </div>
              <Icon.ArrowRight size={14} style={{ color: "#A8A29E" }} />
            </div>
            <div style={styles.statValue}>{loading ? "—" : c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
            <div style={styles.statSub}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue panel */}
      <div style={styles.revenuePanel}>
        <div style={styles.revenueLeft}>
          <div style={styles.revenueLabel}>Total Revenue (all time)</div>
          <div style={styles.revenueValue}>
            {loading ? "—" : formatCurrency(stats.revenue)}
          </div>
          <div style={styles.revenueSub}>
            Excludes cancelled bookings · Across dine-in and catering
          </div>
        </div>
        <div style={styles.revenueRight}>
          <div style={styles.revenueMetric}>
            <div style={styles.revenueMetricValue}>
              {stats.reservations + stats.catering}
            </div>
            <div style={styles.revenueMetricLabel}>Total Bookings</div>
          </div>
          <div style={styles.revenueMetric}>
            <div style={{ ...styles.revenueMetricValue, color: "#F59E0B" }}>
              {stats.pending_res + stats.pending_cat}
            </div>
            <div style={styles.revenueMetricLabel}>Pending</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Quick Actions</div>
        <div style={styles.quickGrid}>
          {[
            {
              label: "Reservations",
              sub: "View & manage dine-in bookings",
              link: "/admin/reservations",
              icon: <Icon.Calendar size={20} />,
              accent: "#1C1917",
            },
            {
              label: "Catering",
              sub: "Review catering inquiries",
              link: "/admin/catering",
              icon: <Icon.Cake size={20} />,
              accent: "#F59E0B",
            },
            {
              label: "Menu Management",
              sub: "Add, edit, or remove dishes",
              link: "/admin/menu",
              icon: <Icon.Utensils size={20} />,
              accent: "#059669",
            },
            {
              label: "Peak Forecast",
              sub: "ARIMA demand predictions",
              link: "/admin/forecast",
              icon: <Icon.TrendUp size={20} />,
              accent: "#3B82F6",
            },
          ].map((q, i) => (
            <div
              key={i}
              style={styles.quickCard}
              onClick={() => navigate(q.link)}
            >
              <div style={{ ...styles.quickIconWrap, color: q.accent }}>
                {q.icon}
              </div>
              <div style={styles.quickLabel}>{q.label}</div>
              <div style={styles.quickSub}>{q.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div style={styles.twoCol}>
        <div style={styles.actCard}>
          <div style={styles.actHeader}>
            <div style={styles.actTitle}>
              <Icon.Calendar size={16} /> Recent Dine-in Reservations
            </div>
            <button
              style={styles.viewAllBtn}
              onClick={() => navigate("/admin/reservations")}
            >
              View All <Icon.ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            <div style={styles.emptyState}>Loading...</div>
          ) : recentRes.length === 0 ? (
            <div style={styles.emptyState}>No reservations yet.</div>
          ) : (
            recentRes.map(r => (
              <div key={r.id} style={styles.actRow}>
                <div style={{ ...styles.actDot, background: (STATUS_CFG[r.status] || STATUS_CFG.Pending).dot }} />
                <div style={styles.actInfo}>
                  <div style={styles.actName}>{r.name || "Guest"}</div>
                  <div style={styles.actMeta}>
                    {formatDate(r.reservation_date)} · {formatTime(r.reservation_time)} · {r.pax} pax
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          )}
        </div>

        <div style={styles.actCard}>
          <div style={styles.actHeader}>
            <div style={styles.actTitle}>
              <Icon.Cake size={16} /> Recent Catering Bookings
            </div>
            <button
              style={styles.viewAllBtn}
              onClick={() => navigate("/admin/catering")}
            >
              View All <Icon.ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            <div style={styles.emptyState}>Loading...</div>
          ) : recentCat.length === 0 ? (
            <div style={styles.emptyState}>No catering bookings yet.</div>
          ) : (
            recentCat.map(c => (
              <div key={c.id} style={styles.actRow}>
                <div style={{ ...styles.actDot, background: (STATUS_CFG[c.status] || STATUS_CFG.Pending).dot }} />
                <div style={styles.actInfo}>
                  <div style={styles.actName}>{c.name || "Guest"}</div>
                  <div style={styles.actMeta}>
                    {c.event_type || "Event"} · {formatDate(c.reservation_date)} · {c.pax} pax
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          )}
        </div>
      </div>
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

  // Header
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-end", flexWrap: "wrap", gap: 16,
    maxWidth: 1280, margin: "0 auto 24px",
  },
  eyebrow: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6,
  },
  headerTitle: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  headerSubtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  dateBox: { textAlign: "right" },
  dateDay: {
    fontSize: 11, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "1px",
  },
  dateNum: { fontSize: 14, color: "#1C1917", fontWeight: 700, marginTop: 4 },

  // Alert banner
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
  alertText: { flex: 1, minWidth: 0, fontSize: 13, color: "#78350F" },
  alertSub: { fontSize: 12, color: "#92400E", marginTop: 2 },
  alertBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 16px", background: "#1C1917",
    border: "none", borderRadius: 8,
    color: "#FFFFFF", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
  },

  // Stat cards
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12, maxWidth: 1280, margin: "0 auto 20px",
  },
  statCard: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, padding: "20px 22px 18px",
    position: "relative", overflow: "hidden",
    cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
  },
  statAccent: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
  },
  statTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  statValue: {
    fontSize: 32, fontWeight: 800, color: "#1C1917",
    letterSpacing: "-1px", lineHeight: 1, marginBottom: 6,
  },
  statLabel: {
    fontSize: 13, color: "#1C1917", fontWeight: 700,
    marginBottom: 4,
  },
  statSub: { fontSize: 12, color: "#78716C" },

  // Revenue
  revenuePanel: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 20,
    maxWidth: 1280, margin: "0 auto 24px",
    background: "#1C1917", color: "#FFFFFF",
    borderRadius: 16, padding: "24px 28px",
  },
  revenueLeft: { flex: 1, minWidth: 220 },
  revenueLabel: {
    fontSize: 11, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 36, fontWeight: 800, color: "#FDE68A",
    letterSpacing: "-1.2px", lineHeight: 1,
  },
  revenueSub: { fontSize: 12, color: "#A8A29E", marginTop: 8 },
  revenueRight: { display: "flex", gap: 32, flexWrap: "wrap" },
  revenueMetric: { textAlign: "left" },
  revenueMetricValue: {
    fontSize: 24, fontWeight: 800, color: "#FFFFFF",
    letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 6,
  },
  revenueMetricLabel: {
    fontSize: 11, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.6px",
  },

  // Quick actions
  section: { maxWidth: 1280, margin: "0 auto 24px" },
  sectionTitle: {
    fontSize: 12, color: "#78716C", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "1px",
    marginBottom: 14,
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  quickCard: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, padding: "20px 20px 18px",
    cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
    display: "flex", flexDirection: "column", gap: 10,
  },
  quickIconWrap: {
    width: 42, height: 42, borderRadius: 10,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  quickLabel: {
    fontSize: 14, fontWeight: 800, color: "#1C1917",
    letterSpacing: "-0.2px",
  },
  quickSub: { fontSize: 12, color: "#78716C", lineHeight: 1.5 },

  // Recent activity
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16, maxWidth: 1280, margin: "0 auto",
  },
  actCard: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, padding: "20px 22px",
  },
  actHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
    paddingBottom: 12, borderBottom: "1px solid #F5F5F4",
  },
  actTitle: {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 800, color: "#1C1917",
    letterSpacing: "-0.2px",
  },
  viewAllBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, fontWeight: 700, color: "#78716C",
    background: "transparent", border: "none",
    cursor: "pointer", padding: 0,
    fontFamily: "inherit",
  },
  actRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid #F5F5F4",
  },
  actDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  actInfo: { flex: 1, minWidth: 0 },
  actName: {
    fontSize: 13, fontWeight: 700, color: "#1C1917",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  actMeta: { fontSize: 11, color: "#78716C", marginTop: 3 },
  emptyState: {
    fontSize: 13, color: "#A8A29E",
    textAlign: "center", padding: "32px 0",
  },

  // Status badge
  statusBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 700,
    padding: "5px 10px", borderRadius: 20,
    whiteSpace: "nowrap", flexShrink: 0,
    textTransform: "capitalize",
  },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },
};
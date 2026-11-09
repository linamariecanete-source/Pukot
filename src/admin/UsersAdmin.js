// src/admin/UsersAdmin.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const loadUserStats = async (userId) => {
    setLoadingStats(true);
    const [res, cat] = await Promise.all([
      supabase.from("reservations").select("id, date, time, guests, status").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("catering").select("id, event_date, event_type, guests, status").eq("user_id", userId).order("event_date", { ascending: false }),
    ]);
    setUserStats({
      reservations: res.data || [],
      catering: cat.data || [],
    });
    setLoadingStats(false);
  };

  const handleSelect = (user) => {
    if (selected?.id === user.id) { setSelected(null); setUserStats({}); return; }
    setSelected(user);
    loadUserStats(user.id);
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };

  const statusConfig = {
    pending:   { color: "#e8a84a", bg: "rgba(232,168,74,0.15)"  },
    confirmed: { color: "#3cb37a", bg: "rgba(60,179,122,0.15)"  },
    cancelled: { color: "#e05555", bg: "rgba(224,85,85,0.15)"   },
  };

  const eventIcons = { Wedding:"💍", Birthday:"🎂", Corporate:"💼", Anniversary:"🥂", Other:"🎉" };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Profiles</h1>
          <p style={styles.subtitle}>View all registered customers and their activity</p>
        </div>
        <div style={styles.totalBadge}>👥 {users.length} total users</div>
      </div>

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="🔍 Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.mainLayout}>
        {/* Users List */}
        <div style={styles.userList}>
          {loading ? (
            <div style={styles.emptyState}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>No users found.</div>
          ) : filtered.map(u => {
            const isSelected = selected?.id === u.id;
            const initials = u.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "U";
            return (
              <div
                key={u.id}
                style={{ ...styles.userCard, ...(isSelected ? styles.userCardSelected : {}) }}
                onClick={() => handleSelect(u)}
              >
                <div style={styles.userAvatar}>{initials}</div>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{u.full_name || "Unknown"}</div>
                  <div style={styles.userEmail}>{u.email}</div>
                  <div style={styles.userMeta}>
                    <span style={{ ...styles.roleBadge, ...(u.role === "admin" ? styles.adminRole : styles.customerRole) }}>
                      {u.role || "customer"}
                    </span>
                    <span style={styles.userJoined}>Joined {formatDate(u.created_at)}</span>
                  </div>
                </div>
                <span style={styles.chevron}>{isSelected ? "▲" : "▶"}</span>
              </div>
            );
          })}
        </div>

        {/* User Detail Panel */}
        {selected && (
          <div style={styles.detailPanel}>
            {/* Profile Header */}
            <div style={styles.profileHeader}>
              <div style={styles.profileAvatar}>
                {selected.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "U"}
              </div>
              <div>
                <div style={styles.profileName}>{selected.full_name || "Unknown"}</div>
                <div style={styles.profileEmail}>{selected.email}</div>
                <span style={{ ...styles.roleBadge, ...(selected.role === "admin" ? styles.adminRole : styles.customerRole), marginTop: 6, display: "inline-block" }}>
                  {selected.role || "customer"}
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => { setSelected(null); setUserStats({}); }}>✕</button>
            </div>

            {/* Info rows */}
            <div style={styles.infoSection}>
              {[
                { label: "Full Name", value: selected.full_name || "—" },
                { label: "Email",     value: selected.email || "—"     },
                { label: "Cellphone", value: selected.cellphone || "—" },
                { label: "Role",      value: selected.role || "customer" },
                { label: "Joined",    value: formatDate(selected.created_at) },
              ].map(row => (
                <div key={row.label} style={styles.infoRow}>
                  <span style={styles.infoLabel}>{row.label}</span>
                  <span style={styles.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>

            {loadingStats ? (
              <div style={styles.statsLoading}>Loading activity...</div>
            ) : (
              <>
                {/* Reservation History */}
                <div style={styles.activitySection}>
                  <div style={styles.activityTitle}>📅 Reservations ({userStats.reservations?.length || 0})</div>
                  {userStats.reservations?.length === 0 ? (
                    <div style={styles.activityEmpty}>No reservations</div>
                  ) : userStats.reservations?.slice(0, 4).map(r => {
                    const cfg = statusConfig[r.status] || statusConfig.pending;
                    return (
                      <div key={r.id} style={styles.activityItem}>
                        <div>
                          <div style={styles.activityMain}>{formatDate(r.date)} · {r.guests} guests</div>
                        </div>
                        <span style={{ ...styles.miniBadge, background: cfg.bg, color: cfg.color }}>{r.status}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Catering History */}
                <div style={styles.activitySection}>
                  <div style={styles.activityTitle}>🍾 Catering ({userStats.catering?.length || 0})</div>
                  {userStats.catering?.length === 0 ? (
                    <div style={styles.activityEmpty}>No catering orders</div>
                  ) : userStats.catering?.slice(0, 4).map(c => {
                    const cfg = statusConfig[c.status] || statusConfig.pending;
                    return (
                      <div key={c.id} style={styles.activityItem}>
                        <div>
                          <div style={styles.activityMain}>{eventIcons[c.event_type] || "🎉"} {c.event_type} · {c.guests} pax</div>
                          <div style={styles.activitySub}>{formatDate(c.event_date)}</div>
                        </div>
                        <span style={{ ...styles.miniBadge, background: cfg.bg, color: cfg.color }}>{c.status}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", maxWidth: 1100, fontFamily: "'Poppins', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  title: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#000", fontFamily: "'Poppins', sans-serif" },
  subtitle: { margin: 0, fontSize: 14, color: "#666" },
  totalBadge: { fontSize: 12, color: "#666", background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 20, padding: "8px 16px" },
  toolbar: { marginBottom: 20 },
  search: { padding: "10px 16px", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, color: "#000", fontSize: 13, outline: "none", width: 300 },
  mainLayout: { display: "flex", gap: 20, alignItems: "flex-start" },
  userList: { flex: 1, display: "flex", flexDirection: "column", gap: 8 },
  emptyState: { fontSize: 13, color: "#999", padding: "40px", textAlign: "center" },
  userCard: {
    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
    background: "#fff", border: "1px solid #e0e0e0",
    borderRadius: 12, cursor: "pointer", transition: "border-color 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  userCardSelected: { border: "1px solid #333", background: "#f5f5f5" },
  userAvatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "#333",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 600, fontSize: 15, color: "#fff", flexShrink: 0,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 2 },
  userEmail: { fontSize: 12, color: "#666", marginBottom: 6 },
  userMeta: { display: "flex", alignItems: "center", gap: 8 },
  roleBadge: { fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px" },
  adminRole: { background: "#f5f5f5", color: "#333" },
  customerRole: { background: "#e0e0e0", color: "#666" },
  userJoined: { fontSize: 10, color: "#999" },
  chevron: { fontSize: 10, color: "#999" },

  detailPanel: {
    width: 320, flexShrink: 0, background: "#fff",
    border: "1px solid #e0e0e0", borderRadius: 12, padding: "20px",
    position: "sticky", top: 20, maxHeight: "85vh", overflowY: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  profileHeader: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e0e0e0" },
  profileAvatar: {
    width: 52, height: 52, borderRadius: "50%",
    background: "#333",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 600, fontSize: 18, color: "#fff", flexShrink: 0,
  },
  profileName: { fontSize: 16, fontWeight: 600, color: "#000" },
  profileEmail: { fontSize: 12, color: "#666", marginTop: 2 },
  closeBtn: { marginLeft: "auto", background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: 16, flexShrink: 0 },
  infoSection: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" },
  infoLabel: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 },
  infoValue: { fontSize: 13, color: "#333", fontWeight: 500 },
  statsLoading: { fontSize: 12, color: "#999", textAlign: "center", padding: "20px 0" },
  activitySection: { marginBottom: 16 },
  activityTitle: { fontSize: 12, fontWeight: 600, color: "#000", marginBottom: 8 },
  activityEmpty: { fontSize: 12, color: "#999", padding: "12px 0", textAlign: "center" },
  activityItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f5f5f5", borderRadius: 8, marginBottom: 6 },
  activityMain: { fontSize: 12, color: "#333", fontWeight: 500 },
  activitySub: { fontSize: 10, color: "#666", marginTop: 2 },
  miniBadge: { fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 20, textTransform: "capitalize", flexShrink: 0 },
};







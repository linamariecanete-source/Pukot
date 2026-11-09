import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function CustomerHistory() {
  const user = getStoredUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [resData, catData] = await Promise.all([
      supabase.from("reservations").select("*").eq("user_id", user.id),
      supabase.from("catering").select("*").eq("user_id", user.id),
    ]);

    const reservations = (resData.data || []).map(r => ({ ...r, type: "reservation" }));
    const catering = (catData.data || []).map(c => ({ ...c, type: "catering" }));

    const combined = [...reservations, ...catering].sort((a, b) =>
      new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    );
    setHistory(combined);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user?.id, fetchHistory]);

  useEffect(() => {
    if (!user?.id) return;

    const resCh = supabase.channel("history-res-" + user.id)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reservations", filter: `user_id=eq.${user.id}`,
      }, fetchHistory)
      .subscribe();

    const catCh = supabase.channel("history-cat-" + user.id)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "catering", filter: `user_id=eq.${user.id}`,
      }, fetchHistory)
      .subscribe();

    return () => {
      supabase.removeChannel(resCh);
      supabase.removeChannel(catCh);
    };
  }, [user?.id, fetchHistory]);

  useEffect(() => {
    const refreshHistory = () => { if (user?.id) fetchHistory(); };
    window.addEventListener("reservationCancelled", refreshHistory);
    window.addEventListener("cateringCancelled", refreshHistory);
    return () => {
      window.removeEventListener("reservationCancelled", refreshHistory);
      window.removeEventListener("cateringCancelled", refreshHistory);
    };
  }, [user?.id, fetchHistory]);

  const filtered = filter === "all" ? history : history.filter(h => h.type === filter);

  const typeConfig = {
    reservation: { icon: "📅", label: "Reservation", color: "#c8832a" },
    catering: { icon: "🍾", label: "Catering", color: "#7c6ef5" },
  };

  const statusColors = { pending: "#e8a84a", confirmed: "#3cb37a", cancelled: "#e05555" };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Activity History</h1>
        <p style={styles.subtitle}>Your complete record of reservations and catering orders</p>
      </div>

      <div style={styles.filters}>
        {["all", "reservation", "catering"].map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Activity" : typeConfig[f].label + "s"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.empty}>Loading history...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No activity found.</div>
      ) : (
        <div style={styles.list}>
          {filtered.map(item => {
            const cfg = typeConfig[item.type];
            return (
              <div key={`${item.type}-${item.id}`} style={styles.card}>
                <div style={{ ...styles.typeIcon, background: cfg.color + "22" }}>
                  <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                </div>
                <div style={styles.info}>
                  <div style={styles.infoTop}>
                    <span style={{ ...styles.typeLabel, color: cfg.color }}>{cfg.label}</span>
                    <span style={styles.date}>
                      {new Date(item.created_at || item.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  {item.type === "reservation" ? (
                    <div style={styles.detail}>{item.date} at {item.time} · {item.guests} guests</div>
                  ) : (
                    <div style={styles.detail}>{item.event_type} · {item.guests} guests · {item.event_date}</div>
                  )}
                  {item.notes && <div style={styles.notes}>{item.notes}</div>}
                </div>
                <div style={{ ...styles.badge, background: (statusColors[item.status] || "#888") + "22", color: statusColors[item.status] || "#888" }}>
                  {item.status || "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", maxWidth: 860, background: "#ffffff", fontFamily: "'Poppins', Arial, sans-serif", color: "#000" },
  header: { marginBottom: 28 },
  title: { margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "#000", fontFamily: "'Poppins', Arial, sans-serif" },
  subtitle: { margin: 0, fontSize: 14, color: "#666", fontFamily: "'Poppins', Arial, sans-serif" },
  filters: { display: "flex", gap: 8, marginBottom: 24 },
  filterBtn: {
    padding: "8px 18px", borderRadius: 20, border: "1px solid #ddd",
    background: "#fff", color: "#666", cursor: "pointer",
    fontSize: 13, fontFamily: "'Poppins', Arial, sans-serif", fontWeight: 600,
  },
  filterActive: { background: "rgba(200,131,42,0.1)", border: "1px solid #c8832a", color: "#c8832a" },
  empty: { color: "#ccc", textAlign: "center", padding: "60px 0", fontFamily: "'Poppins', Arial, sans-serif", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
    background: "#f9f9f9", border: "1px solid #e0e0e0",
    borderRadius: 14,
  },
  typeIcon: { width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { flex: 1 },
  infoTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  typeLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Poppins', Arial, sans-serif" },
  date: { fontSize: 12, color: "#999", fontFamily: "'Poppins', Arial, sans-serif" },
  detail: { fontSize: 14, fontWeight: 600, color: "#000", fontFamily: "'Poppins', Arial, sans-serif" },
  notes: { fontSize: 12, color: "#999", marginTop: 3, fontFamily: "'Poppins', Arial, sans-serif" },
  badge: { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "capitalize", fontFamily: "'Poppins', Arial, sans-serif", flexShrink: 0 },
};

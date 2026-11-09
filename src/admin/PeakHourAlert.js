// src/admin/PeakHourAlert.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const Icon = {
  Alert: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Close: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
};

export default function PeakHourAlert() {
  const [isPeak, setIsPeak] = useState(false);
  const [peakData, setPeakData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkPeak = async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentHour = now.getHours();

      // 🎯 THRESHOLD: Number of PAX to trigger the alert
      const PAX_THRESHOLD = 15;

      // Fetch today's active orders
      const { data } = await supabase
        .from("orders")
        .select("reservation_time, pax")
        .eq("reservation_date", today)
        .neq("status", "Cancelled");

      if (data) {
        // Filter orders matching the current hour
        const currentHourOrders = data.filter(o => {
          if (!o.reservation_time) return false;
          const orderHour = parseInt(o.reservation_time.split(":")[0], 10);
          return orderHour === currentHour;
        });

        const totalPax = currentHourOrders.reduce((sum, o) => sum + (o.pax || 1), 0);

        if (totalPax >= PAX_THRESHOLD) {
          setIsPeak(true);
          setPeakData({ hour: currentHour, pax: totalPax });
        } else {
          setIsPeak(false);
        }
      }
    };

    // Run check immediately, then every 2 minutes
    checkPeak();
    const interval = setInterval(checkPeak, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // If not peak or already dismissed, hide the banner
  if (!isPeak || dismissed) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.iconWrap}>
        <Icon.Alert size={20} />
      </div>
      <div style={styles.content}>
        <div style={styles.title}>High Volume Alert: Peak Hour Detected</div>
        <div style={styles.text}>
          We currently have <strong>{peakData?.pax} guests</strong> booked for this hour. 
          Kitchen staff, please prioritize orders and expect longer preparation times.
        </div>
      </div>
      <button style={styles.closeBtn} onClick={() => setDismissed(true)}>
        <Icon.Close size={16} />
      </button>
    </div>
  );
}

const styles = {
  banner: {
    display: "flex", alignItems: "flex-start", gap: 16,
    background: "#FFFBEB", border: "1px solid #FDE68A",
    borderRadius: 12, padding: "16px 20px",
    marginBottom: 24, width: "100%",
    animation: "pulse 2s infinite",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)"
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#FEF3C7", color: "#B45309",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: 800, color: "#92400E", marginBottom: 4 },
  text: { fontSize: 13, color: "#B45309", lineHeight: 1.5 },
  closeBtn: {
    background: "transparent", border: "none",
    color: "#B45309", cursor: "pointer", padding: 4,
  }
};
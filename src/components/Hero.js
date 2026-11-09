import { useNavigate } from "react-router-dom";
import heroImage from "../images/pukot.png";

export function HeroStyleA() {
  const navigate = useNavigate();

  return (
    <section style={A.hero}>
      <div style={A.overlay} />

      <div style={A.inner}>

        {/* Left — text */}
        <div style={A.left}>
          <div style={A.tag}>Pukot Seafood Restaurant</div>
          <h1 style={A.title}>
            Fresh Seafood,<br />
            <span style={{ color: "#FF8F00" }}>Straight</span> to Your{" "}
            <span style={{ color: "#3AACBE" }}>Table</span>
          </h1>
          <p style={A.sub}>
            Reserve your table, plan your event, or request catering —
            all in just a few clicks.
          </p>
          <div style={A.btnRow}>
            <button style={A.btnTeal} onClick={() => navigate("/login")}>
              Reserve a Table
            </button>
            <button style={A.btnOrange} onClick={() => navigate("/login")}>
              Request Catering
            </button>
          </div>
        </div>

      

      </div>

      <div style={A.bottomFade} />
    </section>
  );
}

const A = {
  hero: {
    position: "relative",
    minHeight: 560,
    backgroundImage: `url(${heroImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    fontFamily: "'Nunito', sans-serif",
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(120deg, rgba(3,15,17,0.92) 0%, rgba(4,20,21,0.78) 60%, rgba(3,15,17,0.5) 100%)",
  },
  inner: {
    position: "relative", zIndex: 1,
    maxWidth: 1100, margin: "0 auto",
    padding: "80px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 48, width: "100%",
  },
  left: { maxWidth: 520 },
  tag: {
    fontSize: 11, fontWeight: 800,
    color: "#3AACBE", letterSpacing: "3px",
    textTransform: "uppercase", marginBottom: 16,
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "clamp(30px, 5vw, 52px)",
    color: "#fff", margin: "0 0 18px",
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 15, color: "rgba(255,255,255,0.6)",
    lineHeight: 1.8, fontWeight: 600, marginBottom: 32,
  },
  btnRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  btnTeal: {
    padding: "12px 28px",
    background: "#3AACBE", color: "#051A1E",
    border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 800,
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
  },
  btnOrange: {
    padding: "12px 28px",
    background: "#FF8F00", color: "#fff",
    border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 800,
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
  },
  right: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, flexShrink: 0,
  },
  badge: {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid",
    borderRadius: 12, padding: "16px 18px",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8, textAlign: "center",
    backdropFilter: "blur(8px)",
  },
  badgeText: {
    fontSize: 12, fontWeight: 800,
    letterSpacing: "0.3px",
  },
  bottomFade: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 70,
    background: "linear-gradient(to bottom, transparent, #88e0ec)",
  },
};


// ══════════════════════════════════════════════════════════════════════
// STYLE B — Centered with divider line and bold accent word
// ══════════════════════════════════════════════════════════════════════
export function HeroStyleB() {
  const navigate = useNavigate();

  return (
    <section style={B.hero}>
      <div style={B.overlay} />

      <div style={B.content}>

        {/* Top label */}
        <div style={B.label}>
          <div style={B.labelLine} />
          <span style={B.labelText}>Pukot Seafood Restaurant</span>
          <div style={B.labelLine} />
        </div>

        {/* Title */}
        <h1 style={B.title}>
          Experience the{" "}
          <span style={{ color: "#3AACBE" }}>Freshest</span>
          <br />
          Seafood in{" "}
          <span style={{ color: "#FF8F00" }}>Every Bite</span>
        </h1>

        {/* Divider */}
        <div style={B.divider}>
          <div style={B.divLine} />
          <span style={B.divIcon}></span>
          <div style={B.divLine} />
        </div>

        {/* Subtitle */}
        <p style={B.sub}>
          From intimate dinners to grand celebrations —
          we make every meal memorable.
        </p>

        {/* Buttons */}
        <div style={B.btnRow}>
          <button style={B.btnTeal} onClick={() => navigate("/login")}>
            Reserve a Table
          </button>
          <button style={B.btnOutline} onClick={() => navigate("/login")}>
            Request Catering
          </button>
        </div>

        {/* Stats row */}
        <div style={B.statsRow}>
          {[
            { value: "500+", label: "Happy Customers", color: "#3AACBE" },
            { value: "50+",  label: "Menu Items",       color: "#FF8F00" },
            { value: "100+", label: "Events Catered",   color: "#3AACBE" },
          ].map((s, i) => (
            <div key={i} style={B.stat}>
              <div style={{ ...B.statVal, color: s.color }}>{s.value}</div>
              <div style={B.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>

      <div style={B.bottomFade} />
    </section>
  );
}

const B = {
  hero: {
    position: "relative",
    minHeight: 580,
    backgroundImage: `url(${heroImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    overflow: "hidden",
    fontFamily: "'Nunito', sans-serif",
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "rgba(10,61,71,0.68)",
  },
  content: {
    position: "relative", zIndex: 1,
    padding: "80px 24px", maxWidth: 660,
  },
  label: {
    display: "flex", alignItems: "center",
    gap: 12, marginBottom: 20,
    justifyContent: "center",
  },
  labelLine: {
    flex: 1, height: 1,
    background: "rgba(58,172,190,0.3)",
    maxWidth: 60,
  },
  labelText: {
    fontSize: 11, fontWeight: 800,
    color: "#3AACBE", letterSpacing: "2.5px",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "clamp(30px, 5.5vw, 54px)",
    color: "#fff", margin: "0 0 22px",
    lineHeight: 1.2,
  },
  divider: {
    display: "flex", alignItems: "center",
    gap: 10, justifyContent: "center",
    marginBottom: 20,
  },
  divLine: {
    width: 50, height: 1,
    background: "rgba(255,143,0,0.35)",
  },
  divIcon: { fontSize: 18, opacity: 0.8 },
  sub: {
    fontSize: 15, color: "rgba(255,255,255,0.6)",
    lineHeight: 1.8, fontWeight: 600, marginBottom: 32,
  },
  btnRow: {
    display: "flex", gap: 12,
    justifyContent: "center", flexWrap: "wrap",
    marginBottom: 40,
  },
  btnTeal: {
    padding: "12px 28px",
    background: "#3AACBE", color: "#051A1E",
    border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 800,
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
  },
  btnOutline: {
    padding: "12px 28px",
    background: "transparent", color: "#FF8F00",
    border: "1.5px solid #FF8F00", borderRadius: 8,
    fontSize: 14, fontWeight: 800,
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
  },
  statsRow: {
    display: "flex", gap: 32,
    justifyContent: "center", flexWrap: "wrap",
    paddingTop: 24,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statVal: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: 28, lineHeight: 1,
  },
  statLabel: {
    fontSize: 11, color: "rgba(255,255,255,0.4)",
    fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  bottomFade: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 70,
    background: "linear-gradient(to bottom, transparent, #88e0ec)",
  },
};

// ── Default export — change to HeroStyleA or HeroStyleB ──────────────
export default HeroStyleA;
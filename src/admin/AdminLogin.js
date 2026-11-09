// src/admin/AdminLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import pukotLogo from "../images/puk.jpg";

const Icon = {
  Shield: (p) => (
    <svg width={p?.size || 14} height={p?.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Alert: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Mail: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Lock: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Note: Make sure your "admins" table has the correct columns (email, password, role, is_active)
    const { data: users, error: fetchErr } = await supabase
      .from("admins")
      .select("*")
      .eq("email", form.email.trim().toLowerCase())
      .eq("is_active", true)
      .limit(1);

    if (fetchErr || !users || users.length === 0) {
      setError("Invalid email or password.");
      setLoading(false);
      triggerShake();
      return;
    }

    const user = users[0];

    if (user.password !== form.password) {
      setError("Invalid email or password.");
      setLoading(false);
      triggerShake();
      return;
    }

    if (user.role !== "admin") {
      setError("Access denied. This portal is for administrators only.");
      setLoading(false);
      triggerShake();
      return;
    }

    // ── SESSION HANDLING ─────────────────────────────
    localStorage.setItem("admin", JSON.stringify(user));
    sessionStorage.setItem("admin", JSON.stringify(user));
    localStorage.setItem("isAdminAuth", "true");
    sessionStorage.setItem("isAdminAuth", "true");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    navigate("/admin/dashboard");
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes shakeAnim {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ ...styles.card, ...(shake ? { animation: "shakeAnim 0.5s ease" } : {}) }}>
        
        {/* Header with Logo */}
        <div style={styles.header}>
          <img src={pukotLogo} alt="Pukot Logo" style={styles.logo} />
          <div style={styles.badge}>
            <Icon.Shield size={12} />
            <span style={styles.badgeText}>Restricted Access</span>
          </div>
        </div>

        <h1 style={styles.heading}>Administrator Login</h1>
        <p style={styles.subheading}>
          This area is restricted to authorized personnel only.
        </p>

        <div style={styles.divider} />

        {error && (
          <div style={styles.errorBanner}>
            <Icon.Alert size={16} style={{ color: "#DC2626", flexShrink: 0 }} />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Admin Email</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}><Icon.Mail size={16} /></span>
              <input
                style={styles.input}
                type="email"
                placeholder="admin@pukot.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}><Icon.Lock size={16} /></span>
              <input
                style={styles.input}
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
              >
                {showPass ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span style={styles.spinnerRow}>
                <span style={styles.spinner} />
                Verifying...
              </span>
            ) : (
              "Login to Admin Panel"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <div style={styles.footerLine}>
            Not an admin? <a href="/login" style={styles.footerLink}>Go to Customer Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#FAFAF9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 10px 40px rgba(10, 61, 71, 0.05)",
    animation: "fadeIn 0.4s ease",
  },
  
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #F5F5F4",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#F5F5F4",
    border: "1px solid #E7E5E4",
    borderRadius: 20,
    padding: "6px 14px",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 800,
    color: "#78716C",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  heading: {
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 800,
    color: "#1C1917",
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  subheading: {
    margin: 0,
    fontSize: 13,
    color: "#78716C",
    textAlign: "center",
    lineHeight: 1.5,
  },
  divider: {
    height: 1,
    background: "#F5F5F4",
    margin: "24px 0",
  },

  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: 600,
  },

  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 12,
    color: "#44403C",
    fontWeight: 700,
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    color: "#A8A29E",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 42px",
    background: "#FAFAF9",
    border: "1px solid #D6D3D1",
    borderRadius: 10,
    color: "#1C1917",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#A8A29E",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },

  submitBtn: {
    marginTop: 8,
    padding: "16px",
    background: "#1C1917",
    border: "none",
    borderRadius: 10,
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "background 0.2s",
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #FFFFFF",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },

  footer: {
    marginTop: 28,
    textAlign: "center",
  },
  footerLine: {
    fontSize: 13,
    color: "#A8A29E",
    fontFamily: "inherit",
  },
  footerLink: {
    color: "#1C1917",
    textDecoration: "none",
    fontWeight: 700,
  },
};
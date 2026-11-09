// src/kitchen/KitchenLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import pukotLogo from "../images/puk.jpg";

export default function KitchenLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); // 👈 Using Username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Find the user by username to get their email
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("email, role")
      .eq("username", username.trim().toLowerCase())
      .single();

    if (profileError || !profile) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    // 2. Verify they are actually staff
    if (profile.role !== "staff" && profile.role !== "admin") {
      setError("You do not have kitchen access.");
      setLoading(false);
      return;
    }

    // 3. Log them in using their hidden email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password,
    });

    if (authError) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    // 4. Save session and redirect
    localStorage.setItem("kitchen", JSON.stringify({
      id: authData.user.id,
      username: username.trim(),
      role: profile.role,
    }));
    
    navigate("/kitchen/dashboard");
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src={pukotLogo} alt="Pukot Logo" style={styles.logo} />
          <h1 style={styles.brandName}>PUKOT</h1>
          <p style={styles.brandSub}>Kitchen Display System</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Staff Username</label>
            <input
              type="text"
              placeholder="e.g. kitchen1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Authenticating..." : "Access Kitchen"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#FAFAF9", fontFamily: "'Nunito', sans-serif", padding: 20,
  },
  card: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 24, padding: "48px 40px", width: "100%", maxWidth: 420,
    boxShadow: "0 10px 40px rgba(10, 61, 71, 0.05)",
  },
  header: {
    textAlign: "center", marginBottom: 32,
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  logo: {
    width: 90, height: 90, borderRadius: "50%", objectFit: "cover",
    border: "3px solid #e0f2f1", boxShadow: "0 4px 12px rgba(10, 61, 71, 0.08)",
    marginBottom: 16,
  },
  brandName: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600,
    color: "#0A3D47", letterSpacing: "2px", margin: 0, lineHeight: 1,
  },
  brandSub: {
    margin: "8px 0 0", fontSize: 12, color: "#4f758b",
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 700, color: "#0A3D47" },
  input: {
    padding: "14px 16px", background: "#FAFAF9", border: "1px solid #D6D3D1",
    borderRadius: 12, color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.2s",
  },
  error: {
    color: "#DC2626", fontSize: 13, textAlign: "center",
    background: "#FEF2F2", padding: "10px", borderRadius: 8, border: "1px solid #FECACA",
  },
  button: {
    padding: "16px", background: "#0A3D47", border: "none", borderRadius: 12,
    color: "#FFFFFF", fontSize: 15, fontWeight: 800, cursor: "pointer",
    marginTop: 8, fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.5px",
  },
};
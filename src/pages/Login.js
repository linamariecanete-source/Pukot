import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import pukotLogo from "../images/puk.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    cellphone: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    // ═══════════════════════════════════════════════════════════════
    // SIGNUP
    // ═══════════════════════════════════════════════════════════════
    if (isSignup) {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            cellphone: form.cellphone.trim(),
            role: "customer",
          },
        },
      });

      if (authError) {
        alert(authError.message);
        setLoading(false);
        return;
      }

      // The DB trigger (handle_new_user) automatically creates the matching
      // row in public.users. No manual insert needed.

      alert("Account created! You can now sign in.");
      setIsSignup(false);
      setForm({ full_name: "", email: "", password: "", cellphone: "" });
      setLoading(false);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // LOGIN
    // ═══════════════════════════════════════════════════════════════
    // 👇 FIXED: Removed authData since it's not used in the login flow
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      alert("Invalid email or password.");
      setLoading(false);
      return;
    }

    // Fetch role + profile from "users" table (we get the user from the session)
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Fallback if no profile row exists yet
    const mergedUser = profile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      cellphone: user.user_metadata?.cellphone || "",
      role: "customer",
    };

    // Route by role
    if (mergedUser.role === "admin") {
      localStorage.setItem("admin", JSON.stringify(mergedUser));
      sessionStorage.setItem("admin", JSON.stringify(mergedUser));
      localStorage.setItem("isAdminAuth", "true");
      sessionStorage.setItem("isAdminAuth", "true");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      navigate("/admin/dashboard");
    } else {
      localStorage.setItem("user", JSON.stringify(mergedUser));
      sessionStorage.setItem("user", JSON.stringify(mergedUser));
      localStorage.removeItem("admin");
      sessionStorage.removeItem("admin");
      localStorage.removeItem("isAdminAuth");
      sessionStorage.removeItem("isAdminAuth");
      navigate("/customer");
    }

    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        .login-page {
          min-height: 100vh;
          display: flex;
          background: #88e0ec;
          font-family: 'Nunito', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 48px;
          position: relative;
          background: linear-gradient(160deg, #5ecfde 0%, #6dd4e2 50%, #7adae8 100%);
          border-right: 1px solid rgba(10,80,95,0.2);
          overflow: hidden;
        }

        .left-wave-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: #0A6575;
        }

        .left-glow {
          position: absolute;
          top: -80px; left: 50%;
          transform: translateX(-50%);
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(10,80,95,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .left-bubbles {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 180px;
          pointer-events: none;
          opacity: 0.6;
        }

        .brand-logo-wrap {
          position: relative;
          width: 160px;
          height: 160px;
          margin-bottom: 28px;
        }

        .brand-logo-ring {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: 3px solid rgba(10,80,95,0.5);
          box-shadow:
            0 0 0 6px rgba(10,80,95,0.1),
            0 0 24px rgba(10,80,95,0.2),
            0 20px 40px rgba(0,0,0,0.2);
          overflow: hidden;
          background: #5ecfde;
        }

        .brand-logo-ring img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .brand-name {
          font-family: 'Fredoka One', serif;
          font-size: 42px;
          color: #0A3D47;
          letter-spacing: 5px;
          text-shadow: none;
          margin: 0 0 6px 0;
          text-align: center;
        }

        .brand-tagline {
          font-size: 13px;
          color: #0A5060;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          font-weight: 700;
          text-align: center;
          margin: 0 0 32px 0;
        }

        .brand-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 280px;
          margin-bottom: 28px;
        }

        .divider-line {
          flex: 1;
          height: 1.5px;
          background: repeating-linear-gradient(
            90deg,
            rgba(10,80,95,0.3) 0,
            rgba(10,80,95,0.3) 5px,
            transparent 5px,
            transparent 10px
          );
        }

        .divider-icon {
          font-size: 16px;
          opacity: 0.6;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 280px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.3);
          border: 1px solid rgba(10,80,95,0.2);
          border-radius: 12px;
        }

        .feature-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .feature-text {
          font-size: 13px;
          color: #0A3D47;
          font-weight: 600;
          line-height: 1.4;
        }

        .feature-text strong {
          color: #0A3D47;
          display: block;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1px;
        }

        .seafood-deco {
          margin-top: 32px;
          font-size: 18px;
          letter-spacing: 8px;
          opacity: 0.25;
        }

        .login-right {
          width: 480px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px;
          background: linear-gradient(160deg, #7adae8 0%, #88e0ec 100%);
          position: relative;
          overflow: hidden;
        }

        .right-glow {
          position: absolute;
          bottom: -100px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(10,80,95,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-welcome {
          font-size: 11px;
          font-weight: 800;
          color: #0A5060;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          margin: 0 0 8px 0;
        }

        .form-title {
          font-family: 'Fredoka One', serif;
          font-size: 32px;
          color: #0A2A30;
          margin: 0 0 6px 0;
          line-height: 1.1;
        }

        .form-subtitle {
          font-size: 13px;
          color: #0A5060;
          margin: 0;
          font-weight: 600;
        }

        .form-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
          z-index: 1;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .input-label {
          font-size: 10px;
          font-weight: 800;
          color: #0A5060;
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
          opacity: 0.5;
        }

        .login-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          background: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(10,80,95,0.2);
          border-radius: 12px;
          color: #0A2A30;
          font-size: 14px;
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .login-input:focus {
          border-color: rgba(10,80,95,0.6);
          background: rgba(255,255,255,0.7);
        }

        .login-input::placeholder {
          color: rgba(10,80,95,0.4);
          font-weight: 600;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(10,80,95,0.4);
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          line-height: 1;
        }

        .password-toggle:hover {
          color: #0A3D47;
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #f44336, #FF8F00);
          border: none;
          border-radius: 13px;
          color: #0A2A30;
          font-size: 15px;
          font-weight: 800;
          font-family: 'Nunito', sans-serif;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(244, 67, 54, 0.35);
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
        }

        .submit-btn:hover {
          opacity: 0.93;
          transform: translateY(-1px);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .form-divider {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .form-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(10,80,95,0.15);
        }

        .form-divider-text {
          font-size: 11px;
          color: #0A5060;
          font-weight: 700;
        }

        .toggle-text {
          text-align: center;
          font-size: 13px;
          color: #0A5060;
          font-weight: 600;
        }

        .toggle-link {
          color: #0A3D47;
          cursor: pointer;
          font-weight: 800;
          border-bottom: 1px solid rgba(10,80,95,0.3);
          transition: color 0.15s;
        }

        .toggle-link:hover {
          color: #FF8F00;
        }

        .form-note {
          text-align: center;
          font-size: 11px;
          color: rgba(10,80,95,0.4);
          font-weight: 600;
          margin-top: -4px;
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="login-page">
        <div className="login-left">
          <div className="left-wave-top" />
          <div className="left-glow" />

          <div className="brand-logo-wrap">
            <div className="brand-logo-ring">
              <img src={pukotLogo} alt="Pukot Seafood Restaurant" />
            </div>
          </div>

          <h1 className="brand-name">PUKOT</h1>
          <p className="brand-tagline">Seafood Restaurant</p>

          <div className="brand-divider">
            <div className="divider-line" />
            <span className="divider-icon"></span>
            <div className="divider-line" />
          </div>

          <div className="brand-features">
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Table Reservations</strong>
                Book your perfect dining spot
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Catering Services</strong>
                Events, weddings & celebrations
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Fresh Seafood Menu</strong>
                Daily catch, Boodle feasts & more
              </div>
            </div>
          </div>

          <div className="seafood-deco"></div>

          <svg className="left-bubbles" viewBox="0 0 500 180" preserveAspectRatio="none">
            <path d="M0,100 C80,60 160,140 250,100 C340,60 420,140 500,100 L500,180 L0,180 Z" fill="rgba(10,80,95,0.1)" />
            <path d="M0,130 C100,90 200,160 300,120 C380,90 440,150 500,130 L500,180 L0,180 Z" fill="rgba(10,80,95,0.06)" />
          </svg>
        </div>

        <div className="login-right">
          <div className="right-glow" />

          <div className="form-header">
            <p className="form-welcome">
              {isSignup ? "Join the crew" : "Welcome back"}
            </p>
            <h2 className="form-title">
              {isSignup ? "Create Account" : "Sign In"}
            </h2>
            <p className="form-subtitle">
              {isSignup
                ? "Start your Pukot dining experience today"
                : "Good to see you again, seafood lover!"}
            </p>
          </div>

          <form className="form-body" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input
                    className="login-input"
                    name="full_name"
                    placeholder="Juan dela Cruz"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {isSignup && (
              <div className="input-group">
                <label className="input-label">Cellphone Number</label>
                <input
                  className="login-input"
                  name="cellphone"
                  type="text"
                  placeholder="09XXXXXXXXX"
                  value={form.cellphone}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">✉️</span>
                <input
                  className="login-input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"></span>
                <input
                  className="login-input"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </button>

            <div className="form-divider">
              <div className="form-divider-line" />
              <span className="form-divider-text">or</span>
              <div className="form-divider-line" />
            </div>

            <p className="toggle-text">
              {isSignup ? "Already have an account? " : "Don't have an account yet? "}
              <span
                className="toggle-link"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setForm({ full_name: "", email: "", password: "", cellphone: "" });
                }}
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </span>
            </p>

            <p className="form-note">
              Pukot Seafood Restaurant · Fresh catch daily
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
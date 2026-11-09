// src/admin/AdminSidebar.js
import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Icon = {
  Dashboard: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Folder: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Kitchen: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
  WalkIn: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  Logout: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronRight: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Menu: (p) => (
    <svg width={p?.size || 24} height={p?.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: (p) => (
    <svg width={p?.size || 24} height={p?.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = JSON.parse(localStorage.getItem("admin") || sessionStorage.getItem("admin") || "{}");
  
  const [ordersOpen, setOrdersOpen] = useState(
    location.pathname.includes("/admin/reservations") || 
    location.pathname.includes("/admin/catering")
  );

  // Mobile menu state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("admin");
    sessionStorage.removeItem("admin");
    localStorage.removeItem("isAdminAuth");
    sessionStorage.removeItem("isAdminAuth");
    navigate("/admin/login");
  };

  const closeMobileMenu = () => setIsMobileOpen(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .admin-nav {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px;
          text-decoration: none; color: #A8A29E;
          font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
          transition: all 0.2s ease; margin-bottom: 4px;
          cursor: pointer; border: none; background: transparent; width: 100%;
        }
        
        .admin-nav:hover { background: #1C1917; color: #FFFFFF; }
        .admin-nav.active { background: #292524; color: #FFFFFF; font-weight: 600; }
        .admin-nav.active svg { color: #F59E0B; }

        .sub-nav {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px 10px 44px; border-radius: 8px;
          text-decoration: none; color: #78716C;
          font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;
          transition: all 0.2s ease; margin-bottom: 2px;
        }
        .sub-nav:hover { color: #FFFFFF; }
        .sub-nav.active { color: #F59E0B; font-weight: 600; }

        /* Mobile Overlay */
        .mobile-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-topbar {
            display: flex !important;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 64px;
            background: #0C0A09;
            border-bottom: 1px solid #1C1917;
            z-index: 1000;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
          }
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 1001;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .mobile-overlay.open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            z-index: 1000;
          }
          .desktop-margin {
            display: none;
          }
        }
      `}</style>

      {/* Mobile Top Bar */}
      <div className="mobile-topbar" style={{ display: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={require("../images/puk.jpg")} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 16 }}>PUKOT ADMIN</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer" }}
        >
          <Icon.Menu size={28} />
        </button>
      </div>

      {/* Overlay (Closes menu when clicked) */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? "open" : ""}`} 
        onClick={closeMobileMenu} 
      />

      <aside className={`admin-sidebar ${isMobileOpen ? "open" : ""}`} style={S.sidebar}>
        
        {/* Mobile Close Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 16px 0" }}>
          <button 
            onClick={closeMobileMenu}
            style={{ background: "none", border: "none", color: "#A8A29E", cursor: "pointer" }}
          >
            <Icon.Close size={24} />
          </button>
        </div>

        {/* Brand */}
        <div style={S.brand}>
          <div style={S.logoWrap}>
            <img 
              src={require("../images/puk.jpg")} 
              alt="Pukot" 
              style={S.logoImg}
              onError={e => { e.currentTarget.style.display = "none"; }} 
            />
          </div>
          <div>
            <div style={S.brandName}>PUKOT</div>
            <div style={S.brandSub}>Admin Panel</div>
          </div>
        </div>

        {/* User */}
        <div style={S.profileSection}>
          <div style={S.userCard}>
            <div style={S.avatar}>{admin.full_name?.[0] || "A"}</div>
            <div style={S.userInfo}>
              <div style={S.userName}>{admin.full_name || "Admin"}</div>
              <div style={S.userEmail}>{admin.email || "admin@pukot.com"}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={S.nav}>
          <NavLink to="/admin/dashboard" onClick={closeMobileMenu} className={({ isActive }) => `admin-nav${isActive ? " active" : ""}`}>
            <Icon.Dashboard /> Dashboard
          </NavLink>

          {/* Reservations Folder */}
          <div style={{ marginTop: 8 }}>
            <button 
              className={`admin-nav${ordersOpen ? " active" : ""}`}
              onClick={() => setOrdersOpen(!ordersOpen)}
            >
              <Icon.Folder /> Reservations
              <div style={{ marginLeft: "auto" }}>
                {ordersOpen ? <Icon.ChevronDown /> : <Icon.ChevronRight />}
              </div>
            </button>

            {ordersOpen && (
              <div style={{ marginTop: 4, marginBottom: 8, display: "flex", flexDirection: "column" }}>
                <NavLink to="/admin/reservations" onClick={closeMobileMenu} className={({ isActive }) => `sub-nav${isActive ? " active" : ""}`}>
                  Dine-in
                </NavLink>
                <NavLink to="/admin/catering" onClick={closeMobileMenu} className={({ isActive }) => `sub-nav${isActive ? " active" : ""}`}>
                  Catering
                </NavLink>
              </div>
            )}
          </div>

          {/* Standalone Links */}
          <div style={{ marginTop: 8 }}>
            <NavLink to="/admin/walkin" onClick={closeMobileMenu} className={({ isActive }) => `admin-nav${isActive ? " active" : ""}`}>
              <Icon.WalkIn /> Walk-in 
            </NavLink>
            <NavLink to="/admin/orders" onClick={closeMobileMenu} className={({ isActive }) => `admin-nav${isActive ? " active" : ""}`}>
              <Icon.Kitchen /> Kitchen Display
            </NavLink>
            <NavLink to="/admin/menu" onClick={closeMobileMenu} className={({ isActive }) => `admin-nav${isActive ? " active" : ""}`}>
              <Icon.Folder /> Menu Management
            </NavLink>
            <NavLink to="/admin/forecast" onClick={closeMobileMenu} className={({ isActive }) => `admin-nav${isActive ? " active" : ""}`}>
              <Icon.Dashboard /> Peak Forecast
            </NavLink>
            <NavLink to="/admin/users" onClick={closeMobileMenu} className={({ isActive }) => `admin-nav${isActive ? " active" : ""}`}>
              <Icon.Dashboard /> Users
            </NavLink>
          </div>

          {/* Logout Button inside the main nav list */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1C1917" }}>
            <button className="admin-nav" onClick={handleLogout} style={{ color: "#EF4444" }}>
              <Icon.Logout /> Sign Out
            </button>
          </div>

        </nav>
      </aside>
    </>
  );
}

const S = {
  sidebar: {
    width: 260,
    height: "100vh", // Fixes it to the screen height
    position: "sticky", // Keeps it still when scrolling
    top: 0,
    background: "#0C0A09",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    borderRight: "1px solid #1C1917",
    fontFamily: "'Inter', sans-serif",
    overflowY: "auto", // Allows the menu itself to scroll if screen is too small
  },
  brand: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 24px 24px", borderBottom: "1px solid #1C1917",
  },
  logoWrap: {
    width: 40, height: 40, borderRadius: 10,
    overflow: "hidden", background: "#1C1917",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoImg: { width: "100%", height: "100%", objectFit: "cover" },
  brandName: { fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "1px", lineHeight: 1.1 },
  brandSub: { fontSize: 10, color: "#A8A29E", fontWeight: 600, letterSpacing: "0.5px", marginTop: 3, textTransform: "uppercase" },

  profileSection: { padding: "24px 16px", borderBottom: "1px solid #1C1917" },
  userCard: { display: "flex", alignItems: "center", gap: 12, padding: "0 8px" },
  avatar: {
    width: 38, height: 38, borderRadius: "50%",
    background: "#1C1917", border: "1px solid #44403C",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 15, color: "#FFFFFF", flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: "hidden" },
  userName: { fontSize: 14, fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userEmail: { fontSize: 11, color: "#A8A29E", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  nav: { flex: 1, padding: "16px 16px 40px", display: "flex", flexDirection: "column" },
};
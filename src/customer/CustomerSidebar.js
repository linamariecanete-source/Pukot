// src/customer/CustomerSidebar.js
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// ── Minimalist SVG Icons ──────────────────────────────────────────────
const Icon = {
  Home: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Menu: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
  Status: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  History: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5"/>
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <polyline points="12 7 12 12 15 15"/>
    </svg>
  ),
  Chatbot: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Logout: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Alert: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ChevronLeft: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

const navItems = [
  { to: "/customer/dashboard",   icon: <Icon.Home size={20} />,    label: "Home" },
  { to: "/customer/menu",        icon: <Icon.Menu size={20} />,    label: "Menu & Order" },
  { to: "/customer/orderstatus", icon: <Icon.Status size={20} />,  label: "Order Status" },
  { to: "/customer/history",     icon: <Icon.History size={20} />, label: "History" },

];

export default function CustomerSidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .pukot-nav {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          text-decoration: none;
          color: #A8A29E;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .pukot-nav:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
        }
        
        .pukot-nav.active {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          font-weight: 600;
        }
        
        .pukot-nav.active svg {
          color: #F59E0B;
        }

        .tooltip-wrapper {
          position: relative;
        }
        
        .tooltip-wrapper:hover .tooltip-text {
          opacity: 1;
          visibility: visible;
          transform: translateX(0);
        }

        .tooltip-text {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-10px);
          margin-left: 12px;
          background: #292524;
          color: #FFFFFF;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s;
          z-index: 100;
          pointer-events: none;
          border: 1px solid #44403C;
        }

        .minimize-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #FFFFFF !important;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: #EF4444 !important;
          color: #EF4444 !important;
        }
      `}</style>

      <aside style={{
        ...S.sidebar,
        width: isCollapsed ? 84 : 260,
      }}>
        
        {/* Brand & Minimize Toggle */}
        <div style={S.brandWrap}>
          <div style={{
            ...S.brand,
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}>
            <div style={S.logoWrap}>
              <img 
                src={require("../images/puk.jpg")} 
                alt="Pukot" 
                style={S.logoImg}
                onError={e => { e.currentTarget.style.display = "none"; }} 
              />
            </div>
            {!isCollapsed && (
              <div>
                <div style={S.brandName}>PUKOT</div>
                <div style={S.brandSub}>Seafood Restaurant</div>
              </div>
            )}
          </div>
          
          <button 
            className="minimize-btn"
            style={{
              ...S.minimizeBtn,
              right: isCollapsed ? "50%" : 16,
              transform: isCollapsed ? "translateX(50%)" : "none",
              top: isCollapsed ? "100%" : 28,
            }} 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {isCollapsed ? <Icon.ChevronRight size={16} /> : <Icon.ChevronLeft size={16} />}
          </button>
        </div>

        {/* User Profile & Logout */}
        <div style={{
          ...S.profileSection,
          padding: isCollapsed ? "24px 12px" : "24px 16px",
        }}>
          <div style={{
            ...S.userCard,
            justifyContent: isCollapsed ? "center" : "flex-start",
            padding: isCollapsed ? 0 : "0 8px",
            marginBottom: isCollapsed ? 0 : 16,
          }}>
            <div style={S.avatar}>
              {user.full_name?.[0]?.toUpperCase() || "G"}
            </div>
            {!isCollapsed && (
              <div style={S.userInfo}>
                <div style={S.userName}>{user.full_name || "Guest"}</div>
                <div style={S.userEmail}>{user.email || "customer@pukot.com"}</div>
              </div>
            )}
          </div>
          
          {/* Always visible on expanded, hidden on collapsed */}
          {!isCollapsed && (
            <button 
              className="logout-btn"
              style={S.logoutBtn} 
              onClick={() => setShowConfirm(true)}
            >
              <Icon.Logout size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={S.nav}>
          {!isCollapsed && <div style={S.navSection}>MENU</div>}
          {navItems.map(item => (
            isCollapsed ? (
              <div key={item.to} className="tooltip-wrapper" style={{ display: "flex", justifyContent: "center" }}>
                <NavLink 
                  to={item.to}
                  className={({ isActive }) => `pukot-nav${isActive ? " active" : ""}`}
                  style={{ justifyContent: "center", padding: "14px 0", width: 48 }}
                >
                  {item.icon}
                </NavLink>
                <span className="tooltip-text">{item.label}</span>
              </div>
            ) : (
              <NavLink 
                key={item.to} 
                to={item.to}
                className={({ isActive }) => `pukot-nav${isActive ? " active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>

        {/* Collapsed Logout Button (Only visible when sidebar is minimized) */}
        {isCollapsed && (
           <div style={{ padding: "16px 12px", borderTop: "1px solid #1C1917", display: "flex", justifyContent: "center" }}>
             <button 
              className="logout-btn"
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: "#1C1917", border: "1px solid #292524",
                color: "#A8A29E", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s"
              }} 
              onClick={() => setShowConfirm(true)}
              title="Logout"
            >
              <Icon.Logout size={18} />
            </button>
           </div>
        )}

        {/* Logout Confirmation Modal */}
        {showConfirm && (
          <div style={S.modalOverlay}>
            <div style={S.modalCard}>
              <div style={S.modalIconWrap}>
                <Icon.Alert size={22} />
              </div>
              <h3 style={S.modalTitle}>Logout</h3>
              <p style={S.modalSub}>
                Are you sure you want to log out? You will need to sign in again to access your reservations.
              </p>
              <div style={S.modalActions}>
                <button style={S.modalCancel} onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button style={S.modalConfirm} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

const S = {
  sidebar: {
    minHeight: "100vh",
    background: "#0C0A09",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    borderRight: "1px solid #1C1917",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    transition: "width 0.3s ease",
  },

  brandWrap: {
    position: "relative",
    borderBottom: "1px solid #1C1917",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "28px 24px",
    transition: "all 0.3s ease",
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: "hidden",
    background: "#1C1917",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #292524",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandName: {
    fontSize: 18,
    fontWeight: 800,
    color: "#FFFFFF",
    letterSpacing: "1px",
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: 10,
    color: "#A8A29E",
    fontWeight: 600,
    letterSpacing: "0.5px",
    marginTop: 3,
    textTransform: "uppercase",
  },

  minimizeBtn: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "transparent",
    border: "none",
    color: "#78716C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    zIndex: 10,
  },

  profileSection: {
    borderBottom: "1px solid #1C1917",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    transition: "all 0.3s ease",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#1C1917",
    border: "1px solid #44403C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    color: "#FFFFFF",
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    overflow: "hidden",
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: 11,
    color: "#A8A29E",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoutBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 16px",
    background: "#1C1917",
    border: "1px solid #292524",
    borderRadius: 10,
    color: "#A8A29E",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },

  nav: {
    flex: 1,
    padding: "24px 12px",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
  },
  navSection: {
    fontSize: 10,
    fontWeight: 700,
    color: "#57534E",
    letterSpacing: "1px",
    padding: "0 16px 12px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(12, 10, 9, 0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    background: "#1C1917",
    border: "1px solid #292524",
    borderRadius: 16,
    padding: "24px",
    width: "100%",
    maxWidth: 340,
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(245, 158, 11, 0.1)",
    color: "#F59E0B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  modalTitle: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  modalSub: {
    margin: "0 0 24px",
    fontSize: 13,
    color: "#A8A29E",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    padding: "11px",
    background: "transparent",
    border: "1px solid #44403C",
    borderRadius: 8,
    color: "#A8A29E",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  modalConfirm: {
    flex: 1,
    padding: "11px",
    background: "#EF4444",
    border: "none",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
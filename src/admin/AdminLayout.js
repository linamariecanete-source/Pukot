// src/admin/AdminLayout.js
import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  let admin = null;
  try {
    admin = JSON.parse(localStorage.getItem("admin") || sessionStorage.getItem("admin") || "null");
  } catch {
    admin = null;
  }

  const isAdminAuth = (localStorage.getItem("isAdminAuth") || sessionStorage.getItem("isAdminAuth")) === "true";

  // Detect window width to apply mobile padding dynamically
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔐 Strict admin validation
  if (!admin || admin.role !== "admin" || !admin.email || !isAdminAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div style={styles.layout}>
      <AdminSidebar />
      
      <main style={{
        ...styles.main,
        marginTop: isMobile ? "64px" : 0, // Pushes content down on mobile for the top bar
      }}>
        <div style={styles.mainInner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#FAFAF9", // Match the new theme
    color: "#1C1917",
    fontFamily: "'Inter', 'Poppins', sans-serif",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#FAFAF9",
    minWidth: 0, // Prevents flexbox overflow
  },
  mainInner: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    padding: "0", // The pages themselves have padding (e.g. 40px 48px)
  },
};
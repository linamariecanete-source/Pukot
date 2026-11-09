// src/customer/CustomerLayout.js
import { Outlet, Navigate } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import FloatingChatbot from "./FloatingChatbot"; // 👈 Added import

export default function CustomerLayout() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!user || !user.id || !user.email) return <Navigate to="/login" replace />;

  return (
    <div style={styles.layout}>
      <CustomerSidebar />
      
      <main style={styles.main}>
        <div style={styles.mainInner}>
          <Outlet />
        </div>
      </main>

      {/* 👇 Floating Chatbot appears on all customer pages */}
      <FloatingChatbot />
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#FAFAF9", // Updated to match the new dashboard/theme
    color: "#1C1917",
    fontFamily: "'Nunito', 'Poppins', Arial, sans-serif",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    background: "#FAFAF9",
    position: "relative",
  },
  mainInner: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
  },
};
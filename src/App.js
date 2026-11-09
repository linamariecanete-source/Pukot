import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

/* ===== PUBLIC COMPONENTS ===== */
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";

/* ===== PUBLIC PAGES ===== */
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";

/* ===== CUSTOMER PAGES ===== */
import CustomerLayout from "./customer/CustomerLayout";
import CustomerDashboard from "./customer/CustomerDashboard";
import CustomerMenu from "./customer/CustomerMenu";
import CustomerOrderStatus from "./customer/CustomerOrderStatus";
import CustomerReservation from "./customer/CustomerReservation";
import CustomerCatering from "./customer/CustomerCatering";
import CustomerHistory from "./customer/CustomerHistory";
import CustomerChatbot from "./customer/CustomerChatbot";

/* ===== ADMIN PAGES ===== */
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import ReservationsAdmin from "./admin/ReservationsAdmin";
import CateringAdmin from "./admin/CateringAdmin";
import ForecastAdmin from "./admin/ForecastAdmin";
import UsersAdmin from "./admin/UsersAdmin";
import MenuAdmin from "./admin/MenuAdmin";
import AdminOrders from "./admin/AdminOrders";
import AdminWalkIn from "./admin/AdminWalkIn";

/* ===== KITCHEN PAGES ===== */
import KitchenLogin from "./kitchen/KitchenLogin";
import KitchenDashboard from "./kitchen/KitchenDashboard";

/* ===== AUTH HELPERS ===== */
function getCustomer() {
  try { 
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null"); 
  } catch { 
    return null; 
  }
}

function getAdmin() {
  try { 
    return JSON.parse(localStorage.getItem("admin") || sessionStorage.getItem("admin") || "null"); 
  } catch { 
    return null; 
  }
}

function getKitchen() {
  try { 
    return JSON.parse(localStorage.getItem("kitchen") || "null"); 
  } catch { 
    return null; 
  }
}

/* ===== SESSION VALIDATION ===== */
function validateStoredAuth() {
  const user = getCustomer();
  const admin = getAdmin();
  const kitchen = getKitchen();

  if (user && (!user.id || !user.email)) {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }

  if (admin && (admin.role !== "admin" || !admin.email)) {
    localStorage.removeItem("admin");
    sessionStorage.removeItem("admin");
    localStorage.removeItem("isAdminAuth");
    sessionStorage.removeItem("isAdminAuth");
  }

  if (kitchen && (!kitchen.id || (kitchen.role !== "admin" && kitchen.role !== "staff"))) {
    localStorage.removeItem("kitchen");
  }
}

/* ===== ROUTE GUARDS ===== */
function RequireCustomer({ children }) {
  const user = getCustomer();
  if (!user || !user.id || !user.email) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const admin = getAdmin();
  const isAdminAuth = (localStorage.getItem("isAdminAuth") || sessionStorage.getItem("isAdminAuth")) === "true";
  
  if (!admin || admin.role !== "admin" || !admin.email || !isAdminAuth) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function RequireKitchen({ children }) {
  const kitchen = getKitchen();
  if (!kitchen || (kitchen.role !== "admin" && kitchen.role !== "staff")) {
    return <Navigate to="/kitchen/login" replace />;
  }
  return children;
}

/* ===== SMART FALLBACK ===== */
function SmartRedirect() {
  const admin = getAdmin();
  const customer = getCustomer();
  const kitchen = getKitchen();
  const isAdminAuth = (localStorage.getItem("isAdminAuth") || sessionStorage.getItem("isAdminAuth")) === "true";

  // Priority: Admin -> Kitchen -> Customer -> Login
  if (admin?.role === "admin" && admin.email && isAdminAuth) return <Navigate to="/admin/dashboard" replace />;
  if (kitchen?.id) return <Navigate to="/kitchen/dashboard" replace />;
  if (customer?.id && customer.email) return <Navigate to="/customer/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

/* ===== MAIN LAYOUT ===== */
function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isCustomer = location.pathname.startsWith("/customer");
  const isKitchen = location.pathname.startsWith("/kitchen");

  // Clean up invalid sessions on app load
  useEffect(() => {
    validateStoredAuth();
  }, []);

  return (
    <>
      {/* Show public Navbar and Chatbot ONLY on public pages */}
      {!isAdmin && !isCustomer && !isKitchen && (
        <>
          <Navbar />
          <Chatbot />
        </>
      )}

      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />

        {/* ===== CUSTOMER ROUTES ===== */}
        <Route 
          path="/customer" 
          element={
            <RequireCustomer>
              <CustomerLayout />
            </RequireCustomer>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="menu" element={<CustomerMenu />} />
          <Route path="orderstatus" element={<CustomerOrderStatus />} />
          <Route path="reservations" element={<CustomerReservation />} />
          <Route path="catering" element={<CustomerCatering />} />
          <Route path="history" element={<CustomerHistory />} />
          <Route path="chatbot" element={<CustomerChatbot />} />
        </Route>

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route 
          path="/admin" 
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="reservations" element={<ReservationsAdmin />} />
          <Route path="catering" element={<CateringAdmin />} />
          <Route path="forecast" element={<ForecastAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="menu" element={<MenuAdmin />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="walkin" element={<AdminWalkIn />} />
        </Route>

        {/* ===== KITCHEN ROUTES ===== */}
        <Route path="/kitchen/login" element={<KitchenLogin />} />
        <Route 
          path="/kitchen/dashboard" 
          element={
            <RequireKitchen>
              <KitchenDashboard />
            </RequireKitchen>
          } 
        />

        {/* ===== SMART FALLBACK ===== */}
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </>
  );
}

/* ===== APP ROOT ===== */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
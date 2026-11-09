// src/admin/AdminWalkIn.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function formatCurrency(n) {
  return `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

const Icon = {
  Plus: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Minus: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p?.size || 20} height={p?.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

export default function AdminWalkIn() {
  // Form State
  const [form, setForm] = useState({
    pax: 2,
    table_number: "",
    payment_method: "Cash",
    notes: "",
  });

  // Menu & Cart State
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // UI State
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Fetch menu on load
    const fetchMenu = async () => {
      const { data } = await supabase.from("menu_items").select("*").eq("is_available", true);
      if (data) setMenuItems(data);
      setLoadingMenu(false);
    };
    fetchMenu();
  }, []);

  const categories = ["All", ...Array.from(new Set(menuItems.map((m) => m.category)))];
  
  const visibleMenu = menuItems.filter(m => {
    if (activeCategory !== "All" && m.category !== activeCategory) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Cart Logic
  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { ...item, qty: prev[item.id] ? prev[item.id].qty + 1 : 1 }
    }));
  };

  const removeFromCart = (itemId, removeAll = false) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (removeAll || existing.qty <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...existing, qty: existing.qty - 1 } };
    });
  };

  const cartArray = Object.values(cart);
  const cartTotal = cartArray.reduce((sum, item) => sum + item.qty * item.price, 0);

  // Submit Reservation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartArray.length === 0) {
      alert("Please add at least one item to the order.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg("");

    // Format cart for database
    const cartPayload = cartArray.map(i => ({
      id: i.id, name: i.name, qty: i.qty, price: Number(i.price)
    }));

    // 👇 Auto-generate Date & Time based on current moment
    const now = new Date();
    // Adjust for local timezone offset so the DB gets the correct local date
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const autoDate = localDate.toISOString().split("T")[0];
    const autoTime = localDate.toTimeString().split(" ")[0].substring(0, 5); // HH:MM


    const { data, error } = await supabase.from("orders").insert([{
      user_id: null, 
      name: "Walk-in Guest",
      contact: "N/A",        
      reservation_date: autoDate, 
      reservation_time: autoTime, 
      pax: form.pax,
      table_number: form.table_number ? Number(form.table_number) : null,
      cart: cartPayload,
      total: cartTotal,
      downpayment: cartTotal,
      payment_method: form.payment_method,
      payment_status: "Paid",
      status: "Confirmed",
      reservation_type: "Dine-in",
      notes: form.notes.trim() || null,
      is_peak_hour: false,
    }]).select();

    setSubmitting(false);

    if (error) {
      alert("Error saving reservation: " + error.message);
    } else {
      // 👇 Show the auto-generated ID (e.g., WALKIN-105)
      const newId = data[0]?.id;
      setSuccessMsg(`Order #${newId} created successfully!`);
      
      // Reset form and cart
      setCart({});
      setForm({
        pax: 2, table_number: "", payment_method: "Cash", notes: ""
      });
      
      // Clear success message after 4 seconds
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Walk-in</h1>
          <p style={styles.subtitle}>Create instant orders and seat walk-in customers.</p>
        </div>
      </div>

      <div style={styles.layout}>
        
        {/* LEFT COLUMN: Customer Details & Cart */}
        <div style={styles.leftCol}>
          <form onSubmit={handleSubmit} style={styles.card}>
            <h2 style={styles.cardTitle}>Order Details</h2>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Number of Pax</label>
                <input type="number" min="1" style={styles.input} value={form.pax} onChange={e => setForm({...form, pax: parseInt(e.target.value)})} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Table Number</label>
                <input type="number" style={styles.input} value={form.table_number} onChange={e => setForm({...form, table_number: e.target.value})} placeholder="e.g. 5" />
              </div>
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Payment Method</label>
                <select style={styles.input} value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Special Notes</label>
                <input style={styles.input} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Allergies, special requests..." />
              </div>
            </div>

            <hr style={styles.divider} />

            <h2 style={styles.cardTitle}>Current Order</h2>
            {cartArray.length === 0 ? (
              <p style={styles.emptyText}>No items added yet. Select from the menu on the right.</p>
            ) : (
              <div style={styles.cartList}>
                {cartArray.map(item => (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={styles.cartItemLeft}>
                      <div style={styles.cartItemName}>{item.name}</div>
                      <div style={styles.cartItemPrice}>{formatCurrency(item.price)}</div>
                    </div>
                    <div style={styles.cartItemRight}>
                      <div style={styles.qtyControl}>
                        <button type="button" style={styles.qtyBtn} onClick={() => removeFromCart(item.id)}><Icon.Minus size={12}/></button>
                        <span style={styles.qtyVal}>{item.qty}</span>
                        <button type="button" style={styles.qtyBtn} onClick={() => addToCart(item)}><Icon.Plus size={12}/></button>
                      </div>
                      <div style={styles.itemTotal}>{formatCurrency(item.qty * item.price)}</div>
                      <button type="button" style={styles.trashBtn} onClick={() => removeFromCart(item.id, true)}><Icon.Trash size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.totalRow}>
              <span>Total Amount</span>
              <span style={styles.totalValue}>{formatCurrency(cartTotal)}</span>
            </div>

            {successMsg && <div style={styles.successBox}><Icon.Check size={16}/> {successMsg}</div>}

            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm & Pay"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Menu Selector */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <div style={styles.menuHeader}>
              <h2 style={styles.cardTitle}>Select Menu</h2>
              <input 
                type="text" 
                placeholder="Search food..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={styles.searchBox}
              />
            </div>
            
            <div style={styles.categoryTabs}>
              {categories.map(c => (
                <button 
                  key={c} 
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  style={{...styles.categoryTab, ...(activeCategory === c ? styles.categoryTabActive : {})}}
                >
                  {c}
                </button>
              ))}
            </div>

            {loadingMenu ? (
              <p style={styles.emptyText}>Loading menu...</p>
            ) : (
              <div style={styles.menuGrid}>
                {visibleMenu.map(item => (
                  <div key={item.id} style={styles.menuItem} onClick={() => addToCart(item)}>
                    <div style={styles.menuImgWrap}>
                       {item.image_url ? <img src={item.image_url} alt={item.name} style={styles.menuImg} /> : <div style={styles.menuImgFallback}>No Image</div>}
                    </div>
                    <div style={styles.menuInfo}>
                      <div style={styles.menuName}>{item.name}</div>
                      <div style={styles.menuPrice}>{formatCurrency(item.price)}</div>
                    </div>
                    <button type="button" style={styles.addBtn}><Icon.Plus size={16}/></button>
                  </div>
                ))}
                {visibleMenu.length === 0 && <p style={styles.emptyText}>No items found.</p>}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px 48px 60px",
    minHeight: "100vh",
    background: "#FAFAF9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1C1917",
  },
  header: {
    maxWidth: 1280, margin: "0 auto 28px",
  },
  title: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  subtitle: { margin: 0, fontSize: 14, color: "#78716C" },

  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    maxWidth: 1280,
    margin: "0 auto",
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 24 },
  rightCol: { display: "flex", flexDirection: "column", gap: 24 },

  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 16,
    padding: "28px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  cardTitle: {
    margin: "0 0 20px", fontSize: 18, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.3px",
  },

  // Form
  inputRow: { display: "flex", gap: 16, marginBottom: 16 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 6, flex: 1, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 700, color: "#44403C" },
  input: {
    padding: "12px 14px", background: "#FAFAF9",
    border: "1px solid #D6D3D1", borderRadius: 10,
    fontSize: 14, fontFamily: "inherit", outline: "none",
    color: "#1C1917",
  },
  divider: { border: "none", borderTop: "1px dashed #D6D3D1", margin: "24px 0" },

  // Cart
  emptyText: { fontSize: 14, color: "#A8A29E", fontStyle: "italic", textAlign: "center", padding: "20px 0" },
  cartList: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 },
  cartItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", background: "#FAFAF9",
    border: "1px solid #E7E5E4", borderRadius: 12,
  },
  cartItemLeft: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: 700, color: "#1C1917" },
  cartItemPrice: { fontSize: 12, color: "#78716C", marginTop: 2 },
  cartItemRight: { display: "flex", alignItems: "center", gap: 16 },
  qtyControl: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#FFFFFF", border: "1px solid #D6D3D1",
    padding: "4px 8px", borderRadius: 8,
  },
  qtyBtn: {
    background: "none", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#44403C", padding: 2,
  },
  qtyVal: { fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center" },
  itemTotal: { fontSize: 14, fontWeight: 800, color: "#1C1917", minWidth: 70, textAlign: "right" },
  trashBtn: { background: "none", border: "none", cursor: "pointer", color: "#DC2626" },

  totalRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 0", borderTop: "2px solid #1C1917",
  },
  totalValue: { fontSize: 24, fontWeight: 800, color: "#C8832A" },

  submitBtn: {
    width: "100%", padding: "16px",
    background: "#1C1917", color: "#FFFFFF",
    border: "none", borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: "pointer",
    marginTop: 10,
  },
  successBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#ECFDF5", color: "#047857",
    border: "1px solid #A7F3D0", padding: "12px 16px",
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    marginBottom: 16,
  },

  // Menu Side
  menuHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  searchBox: {
    padding: "10px 14px", background: "#FAFAF9",
    border: "1px solid #D6D3D1", borderRadius: 10,
    fontSize: 13, fontFamily: "inherit", outline: "none",
    width: 200,
  },
  categoryTabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  categoryTab: {
    padding: "8px 14px", background: "#FFFFFF",
    border: "1px solid #E7E5E4", borderRadius: 20,
    fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#57534E",
  },
  categoryTabActive: { background: "#1C1917", color: "#FFFFFF", borderColor: "#1C1917" },
  
  menuGrid: {
    display: "grid", gridTemplateColumns: "1fr",
    gap: 12, maxHeight: "calc(100vh - 320px)", overflowY: "auto", paddingRight: 4,
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px", background: "#FAFAF9",
    border: "1px solid #E7E5E4", borderRadius: 12,
    cursor: "pointer", transition: "border-color 0.15s",
  },
  menuImgWrap: { width: 50, height: 50, borderRadius: 8, background: "#E7E5E4", overflow: "hidden", flexShrink: 0 },
  menuImg: { width: "100%", height: "100%", objectFit: "cover" },
  menuImgFallback: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#A8A29E" },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 13, fontWeight: 700, color: "#1C1917" },
  menuPrice: { fontSize: 12, fontWeight: 600, color: "#C8832A", marginTop: 2 },
  addBtn: {
    width: 32, height: 32, borderRadius: 8,
    background: "#1C1917", color: "#FFFFFF", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
};
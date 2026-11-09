import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const RESERVATION_TYPES = [
  {
    id: "Dine-in",
    label: "Dine-in",
    desc: "Reserve a table and pre-order from our full menu.",
    minGuests: 1,
  },
  {
    id: "Catering",
    label: "Catering",
    desc: "Bulk order for events, parties, and gatherings.",
    minGuests: 15,
  },
];

const PEAK_HOURS = { lunch: [11, 12, 13], dinner: [18, 19, 20] };
function isPeakHour(timeStr) {
  if (!timeStr) return false;
  const h = parseInt(timeStr.split(":")[0], 10);
  return PEAK_HOURS.lunch.includes(h) || PEAK_HOURS.dinner.includes(h);
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatCurrency(n) {
  return `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Icons ─────────────────────────────────────────────────────────────
const Icon = {
  Calendar: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Users: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Alert: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Cart: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  MapPin: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Flame: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Search: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Zoom: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  Close: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ── Image Zoom Modal ──────────────────────────────────────────────────
function ImageZoomModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div style={zoom.overlay} onClick={onClose}>
      <button style={zoom.closeBtn} onClick={onClose} aria-label="Close">
        <Icon.Close size={18} />
      </button>

      <div style={zoom.content} onClick={e => e.stopPropagation()}>
        <div style={zoom.imageWrap}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} style={zoom.image} />
          ) : (
            <div style={zoom.noImage}>No photo available</div>
          )}
        </div>

        <div style={zoom.info}>
          <div style={zoom.infoTop}>
            <div>
              <h2 style={zoom.title}>{item.name}</h2>
              {item.category && <div style={zoom.category}>{item.category}</div>}
            </div>
            <div style={zoom.price}>{formatCurrency(item.price)}</div>
          </div>

          {item.description && (
            <p style={zoom.desc}>{item.description}</p>
          )}

          <div style={zoom.metaRow}>
            {item.cooking_time > 0 && (
              <span style={zoom.metaItem}>
                <Icon.Clock size={14} /> {item.cooking_time} minutes
              </span>
            )}
            {item.is_bundle && (
              <span style={zoom.bundleBadge}>Bundle</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { n: 1, label: "Details" },
    { n: 2, label: "Menu" },
    { n: 3, label: "Review" },
  ];
  return (
    <div style={stepper.wrap}>
      {steps.map((s, i) => (
        <div key={s.n} style={stepper.itemWrap}>
          <div style={stepper.item}>
            <div style={{
              ...stepper.circle,
              ...(step === s.n ? stepper.circleActive : {}),
              ...(step > s.n ? stepper.circleDone : {}),
            }}>
              {step > s.n ? <Icon.Check size={14} /> : s.n}
            </div>
            <span style={{ ...stepper.label, ...(step === s.n ? stepper.labelActive : {}) }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ ...stepper.line, ...(step > s.n ? stepper.lineDone : {}) }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════
export default function CustomerReservation() {
  const user = getStoredUser();

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [reservationType, setReservationType] = useState("Dine-in");
  const [form, setForm] = useState({
    date: "", time: "", guests: 2, notes: "",
    eventType: "", venue: "",
  });
  const [stepError, setStepError] = useState("");

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({});
  const [zoomItem, setZoomItem] = useState(null); // 👈 for the zoom modal

  const peakWarning = useMemo(() => isPeakHour(form.time), [form.time]);
  const activeType = RESERVATION_TYPES.find(t => t.id === reservationType);

  useEffect(() => {
    (async () => {
      setMenuLoading(true);
      const { data, error } = await supabase.from("menu_items").select("*")
        .eq("is_available", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      setMenuItems(error ? [] : (data || []));
      setMenuLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(menuItems.map(m => m.category).filter(Boolean)));
    return ["All", ...unique];
  }, [menuItems]);

  const visibleItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "All") items = items.filter(m => m.category === activeCategory);
    if (reservationType === "Catering") {
      const bundles = items.filter(
        m => m.is_bundle || /bundle|boodle|feast|tray|group|catering/i.test(m.category || "")
      );
      if (bundles.length > 0) items = bundles;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m => (m.name || "").toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, activeCategory, reservationType, searchQuery]);

  const cartArray = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartArray.reduce((s, i) => s + i.qty, 0), [cartArray]);
  const cartTotal = useMemo(
    () => cartArray.reduce((s, i) => s + i.qty * Number(i.price || 0), 0), [cartArray]);

  const addToCart = (item) => setCart(prev => ({
    ...prev,
    [item.id]: { ...item, qty: prev[item.id] ? prev[item.id].qty + 1 : 1 },
  }));

  const decrementCart = (id) => setCart(prev => {
    const ex = prev[id];
    if (!ex) return prev;
    if (ex.qty <= 1) { const n = { ...prev }; delete n[id]; return n; }
    return { ...prev, [id]: { ...ex, qty: ex.qty - 1 } };
  });

  const changeType = (id) => {
    setReservationType(id);
    const t = RESERVATION_TYPES.find(x => x.id === id);
    if (t && t.minGuests > 1 && form.guests < t.minGuests) {
      setForm(f => ({ ...f, guests: t.minGuests }));
    }
  };

  const goToStep2 = () => {
    if (!form.date || !form.time) { setStepError("Please select a date and time to continue."); return; }
    if (reservationType === "Catering" && (!form.eventType || !form.venue)) {
      setStepError("Please provide the event type and venue for your catering booking."); return;
    }
    if (activeType?.minGuests && form.guests < activeType.minGuests) {
      setStepError(`Catering bookings require at least ${activeType.minGuests} guests.`);
      return;
    }
    setStepError(""); setStep(2);
  };

  const goToStep3 = () => {
    if (cartCount === 0) { setStepError("Please add at least one item to your order to continue."); return; }
    setStepError(""); setStep(3);
  };

  const backToStep = (n) => { setStepError(""); setStep(n); };

  const resetBookingFlow = () => {
    setForm({ date: "", time: "", guests: 2, notes: "", eventType: "", venue: "" });
    setCart({}); setActiveCategory("All"); setSearchQuery("");
    setReservationType("Dine-in"); setStep(1); setStepError("");
  };

  const handleSubmit = async () => {
    if (!user?.id) return alert("You must be logged in.");
    if (cartCount === 0) { setStepError("Please add at least one item before confirming."); setStep(2); return; }
    setSubmitting(true);

    const cartPayload = cartArray.map(i => ({
      id: i.id, name: i.name, qty: i.qty,
      price: Number(i.price || 0),
      instructions: form.notes.trim() || null,
    }));

    const { error } = await supabase.from("orders").insert([{
      user_id: user.id,
      name: user.full_name || user.name || null,
      contact: user.email || user.phone || null,
      reservation_date: form.date,
      reservation_time: form.time,
      pax: form.guests,
      cart: cartPayload,
      total: cartTotal,
      downpayment: 0,
      payment_status: "Pending",
      status: "Pending",
      reservation_type: reservationType,
      event_type: reservationType === "Catering" ? form.eventType : null,
      venue: reservationType === "Catering" ? form.venue : null,
      is_peak_hour: peakWarning,
      notes: form.notes.trim() || null,
    }]);

    if (error) { alert("Error: " + error.message); setSubmitting(false); return; }

    resetBookingFlow();
    setSubmitting(false);
    alert("Reservation and pre-order submitted. We'll confirm it shortly.");
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return {
      full: d.toLocaleDateString("en-PH", {
        weekday: "short", year: "numeric", month: "long", day: "numeric",
      }),
    };
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={styles.page}>
      {zoomItem && <ImageZoomModal item={zoomItem} onClose={() => setZoomItem(null)} />}

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Reservations</h1>
        <p style={styles.headerSubtitle}>
          Book a table or plan a catering event at Pukot Seafood Restaurant
        </p>
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>New Reservation</h2>
              <p style={styles.cardSubtitle}>Complete the steps below to book your table</p>
            </div>
            <span style={styles.stepCount}>Step {step} of 3</span>
          </div>

          <StepIndicator step={step} />

          {stepError && (
            <div style={styles.errorBox}>
              <Icon.Alert size={14} /><span>{stepError}</span>
            </div>
          )}

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <div style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Reservation Type</label>
                <div style={styles.typeGrid}>
                  {RESERVATION_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => changeType(t.id)}
                      style={{ ...styles.typeCard, ...(reservationType === t.id ? styles.typeCardActive : {}) }}>
                      <div style={styles.typeRadio}>
                        {reservationType === t.id && <div style={styles.typeRadioDot} />}
                      </div>
                      <div style={styles.typeText}>
                        <div style={{
                          ...styles.typeLabel,
                          ...(reservationType === t.id ? styles.typeLabelActive : {}),
                        }}>{t.label}</div>
                        <div style={styles.typeDesc}>{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Date</label>
                  <input style={styles.input} type="date" min={today}
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Time</label>
                  <input style={styles.input} type="time" min="10:00" max="21:00"
                    value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>

              {peakWarning && (
                <div style={styles.peakBox}>
                  <Icon.Flame size={16} />
                  <div>
                    <strong>Peak Hour Notice</strong>
                    <div style={styles.peakText}>
                      This slot is forecasted to be busy. Pre-ordering is recommended to reduce waiting time.
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Number of Guests
                  {activeType?.minGuests > 1 && (
                    <span style={styles.minHint}> (min {activeType.minGuests})</span>
                  )}
                </label>
                <div style={styles.guestSelector}>
                  <button type="button" style={styles.guestBtn}
                    onClick={() => setForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))}>−</button>
                  <span style={styles.guestCount}>
                    {form.guests} {form.guests === 1 ? "guest" : "guests"}
                  </span>
                  <button type="button" style={styles.guestBtn}
                    onClick={() => setForm(f => ({ ...f, guests: Math.min(80, f.guests + 1) }))}>+</button>
                </div>
              </div>

              {reservationType === "Catering" && (
                <div style={styles.formRow}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Event Type</label>
                    <input style={styles.input} type="text" placeholder="e.g. Birthday, Wedding"
                      value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })} />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Venue / Address</label>
                    <input style={styles.input} type="text" placeholder="Delivery location"
                      value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
                  </div>
                </div>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Special Requests <span style={styles.optional}>(Optional)</span>
                </label>
                <textarea style={{ ...styles.input, height: 100, resize: "vertical" }}
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Dietary restrictions, special occasions, seating preference..." />
              </div>

              <button type="button" style={styles.submitBtn} onClick={goToStep2}>
                Continue to Menu
              </button>
              <p style={styles.formNote}>
                Food pre-order is required. You will choose your dishes on the next step.
              </p>
            </div>
          )}

          {/* ─── STEP 2 — Menu with big photos ─── */}
          {step === 2 && (
            <div style={styles.form}>
              {menuLoading ? (
                <div style={styles.stateBox}><div style={styles.stateText}>Loading menu...</div></div>
              ) : menuItems.length === 0 ? (
                <div style={styles.stateBox}>
                  <div style={styles.stateText}>Menu unavailable</div>
                  <div style={styles.stateSubtext}>Please try again later.</div>
                </div>
              ) : (
                <>
                  {reservationType === "Catering" && (
                    <div style={styles.infoBox}>
                      Showing catering bundles for large events. Switch categories below to browse all items.
                    </div>
                  )}

                  <div style={styles.searchWrap}>
                    <span style={styles.searchIcon}><Icon.Search size={16} /></span>
                    <input type="text" style={styles.searchInput} placeholder="Search dishes..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>

                  <div style={styles.categoryTabs}>
                    {categories.map(c => (
                      <button key={c} type="button"
                        style={{ ...styles.categoryTab, ...(activeCategory === c ? styles.categoryTabActive : {}) }}
                        onClick={() => setActiveCategory(c)}>
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* ── Grid of large cards ── */}
                  <div style={styles.menuGrid}>
                    {visibleItems.map(item => {
                      const inCart = cart[item.id];
                      return (
                        <div key={item.id} style={styles.menuCard}>
                          {/* Large clickable photo */}
                          <div
                            style={styles.menuPhotoWrap}
                            onClick={() => setZoomItem(item)}
                            title="Click to view larger"
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                style={styles.menuPhoto}
                                onError={e => { e.target.style.display = "none"; }}
                              />
                            ) : (
                              <div style={styles.menuPhotoEmpty}>No Photo</div>
                            )}
                            <div style={styles.menuPhotoHover}>
                              <Icon.Zoom size={20} />
                              <span>View</span>
                            </div>
                          </div>

                          {/* Details */}
                          <div style={styles.menuDetails}>
                            <div style={styles.menuHeader}>
                              <div style={styles.menuName}>
                                {item.name}
                                {item.is_bundle && <span style={styles.bundleTag}>Bundle</span>}
                              </div>
                              <div style={styles.menuPrice}>{formatCurrency(item.price)}</div>
                            </div>

                            {item.description && (
                              <div style={styles.menuDesc}>{item.description}</div>
                            )}

                            <div style={styles.menuMeta}>
                              {item.category && (
                                <span style={styles.menuCategory}>{item.category}</span>
                              )}
                              {item.cooking_time > 0 && (
                                <span style={styles.menuCook}>
                                  <Icon.Clock size={12} /> {item.cooking_time} min
                                </span>
                              )}
                            </div>

                            <div style={styles.menuActions}>
                              {inCart ? (
                                <div style={styles.qtyControl}>
                                  <button type="button" style={styles.qtyBtn}
                                    onClick={() => decrementCart(item.id)}>−</button>
                                  <span style={styles.qtyValue}>{inCart.qty}</span>
                                  <button type="button" style={styles.qtyBtn}
                                    onClick={() => addToCart(item)}>+</button>
                                </div>
                              ) : (
                                <button type="button" style={styles.addBtn}
                                  onClick={() => addToCart(item)}>Add to Order</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {visibleItems.length === 0 && (
                      <div style={styles.stateBox}>
                        <div style={styles.stateText}>No dishes match your search</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {cartCount > 0 && (
                <div style={styles.cartBar}>
                  <span style={styles.cartBarLabel}>
                    <Icon.Cart size={16} /> {cartCount} item{cartCount > 1 ? "s" : ""} selected
                  </span>
                  <span style={styles.cartBarTotal}>{formatCurrency(cartTotal)}</span>
                </div>
              )}

              <div style={styles.stepActions}>
                <button type="button" style={styles.backBtn}
                  onClick={() => backToStep(1)}>Back</button>
                <button type="button" style={styles.submitBtn}
                  onClick={goToStep3}>Review Order</button>
              </div>
            </div>
          )}

          {/* ─── STEP 3 ─── */}
          {step === 3 && (
            <div style={styles.form}>
              <div style={styles.reviewSection}>
                <div style={styles.reviewLabel}>Reservation Details</div>
                <div style={styles.reviewLine}>
                  <strong>{reservationType}</strong>
                  {reservationType === "Catering" && form.eventType && ` · ${form.eventType}`}
                </div>
                <div style={styles.reviewLine}>
                  <Icon.Calendar size={14} /> {form.date ? formatDate(form.date).full : ""}
                </div>
                <div style={styles.reviewLine}>
                  <Icon.Clock size={14} /> {formatTime(form.time)}
                </div>
                <div style={styles.reviewLine}>
                  <Icon.Users size={14} /> {form.guests} guest{form.guests > 1 ? "s" : ""}
                </div>
                {reservationType === "Catering" && form.venue && (
                  <div style={styles.reviewLine}>
                    <Icon.MapPin size={14} /> {form.venue}
                  </div>
                )}
                {peakWarning && (
                  <div style={styles.reviewPeak}>
                    <Icon.Flame size={12} /> Peak hour — expect higher volume
                  </div>
                )}
                {form.notes && <div style={styles.reviewNote}>"{form.notes}"</div>}
              </div>

              <div style={styles.reviewSection}>
                <div style={styles.reviewLabel}>Your Order</div>
                {cartArray.map(item => (
                  <div key={item.id} style={styles.reviewOrderLine}>
                    <span>{item.qty} × {item.name}</span>
                    <span>{formatCurrency(item.qty * item.price)}</span>
                  </div>
                ))}
                <div style={styles.reviewTotalLine}>
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div style={styles.stepActions}>
                <button type="button" style={styles.backBtn}
                  onClick={() => backToStep(2)}>Edit Order</button>
                <button type="button" style={styles.submitBtn}
                  onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Confirm and Book"}
                </button>
              </div>
              <p style={styles.formNote}>
                Reservations are subject to availability. You will be notified once confirmed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Stepper
// ═══════════════════════════════════════════════════════════════════════
const stepper = {
  wrap: {
    display: "flex", alignItems: "center",
    marginBottom: 28, padding: "16px 8px",
    background: "#FAFAF9", borderRadius: 12,
  },
  itemWrap: { display: "flex", alignItems: "center", flex: 1 },
  item: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 4px" },
  circle: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#FFFFFF", border: "2px solid #E7E5E4",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#A8A29E", transition: "all 0.2s",
  },
  circleActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
    boxShadow: "0 0 0 4px rgba(28,25,23,0.1)",
  },
  circleDone: { background: "#059669", borderColor: "#059669", color: "#FFFFFF" },
  label: {
    fontSize: 11, color: "#A8A29E", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.6px",
  },
  labelActive: { color: "#1C1917" },
  line: { flex: 1, height: 2, background: "#E7E5E4", margin: "0 12px 22px" },
  lineDone: { background: "#059669" },
};

// ═══════════════════════════════════════════════════════════════════════
// Zoom Modal
// ═══════════════════════════════════════════════════════════════════════
const zoom = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 2000,
    background: "rgba(12, 10, 9, 0.88)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24,
    animation: "fadeIn 0.2s ease",
  },
  closeBtn: {
    position: "absolute", top: 24, right: 24,
    width: 44, height: 44, borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#FFFFFF", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 10,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
    gap: 0,
    background: "#FFFFFF",
    borderRadius: 20, overflow: "hidden",
    maxWidth: 1200, width: "100%",
    maxHeight: "90vh",
    boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
  },
  imageWrap: {
    background: "#0C0A09",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    minHeight: 400,
  },
  image: {
    width: "100%", height: "100%",
    maxHeight: "90vh",
    objectFit: "contain",
    display: "block",
  },
  noImage: {
    color: "#57534E", fontSize: 16, fontWeight: 600,
    textAlign: "center", padding: 40,
  },
  info: {
    padding: "40px 36px",
    display: "flex", flexDirection: "column", gap: 20,
    overflowY: "auto", maxHeight: "90vh",
  },
  infoTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: 16,
  },
  title: {
    margin: "0 0 8px", fontSize: 26, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.5px", lineHeight: 1.2,
  },
  category: {
    display: "inline-block",
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
    background: "#F5F5F4", padding: "4px 10px", borderRadius: 6,
  },
  price: {
    fontSize: 26, fontWeight: 800, color: "#C8832A",
    whiteSpace: "nowrap",
  },
  desc: {
    margin: 0, fontSize: 15, lineHeight: 1.7,
    color: "#44403C",
  },
  metaRow: {
    display: "flex", gap: 12, flexWrap: "wrap",
    paddingTop: 16, borderTop: "1px solid #E7E5E4",
  },
  metaItem: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 13, color: "#57534E", fontWeight: 600,
    background: "#F5F5F4", padding: "8px 14px", borderRadius: 10,
  },
  bundleBadge: {
    fontSize: 11, fontWeight: 800,
    background: "#1C1917", color: "#FDE68A",
    padding: "8px 14px", borderRadius: 10,
    letterSpacing: "0.5px", textTransform: "uppercase",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Main Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = {
  page: {
    padding: "0 0 60px",
    minHeight: "100vh",
    background: "#FAFAF9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1C1917",
  },
  header: {
    padding: "40px 48px 24px",
    maxWidth: 1200, margin: "0 auto",
  },
  headerTitle: {
    margin: "0 0 6px", fontSize: 26, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.6px",
  },
  headerSubtitle: { margin: 0, fontSize: 14, color: "#78716C", lineHeight: 1.5 },

  container: {
    padding: "0 48px",
    maxWidth: 1200, margin: "0 auto",
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 20, padding: "32px",
    boxShadow: "0 1px 3px rgba(28,25,23,0.04)",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 24, gap: 12,
  },
  cardTitle: {
    margin: "0 0 4px", fontSize: 20, fontWeight: 700,
    color: "#1C1917", letterSpacing: "-0.3px",
  },
  cardSubtitle: { margin: 0, fontSize: 13, color: "#78716C" },
  stepCount: {
    fontSize: 11, color: "#78716C",
    background: "#F5F5F4", padding: "6px 12px",
    borderRadius: 20, fontWeight: 700, letterSpacing: "0.5px",
    textTransform: "uppercase", whiteSpace: "nowrap",
  },

  form: { display: "flex", flexDirection: "column", gap: 20 },
  formRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 200 },
  label: {
    fontSize: 13, color: "#44403C", fontWeight: 600,
    letterSpacing: "0.2px",
  },
  optional: { fontWeight: 400, color: "#A8A29E" },
  minHint: { color: "#78716C", fontWeight: 500, fontSize: 12 },
  input: {
    padding: "13px 14px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.15s",
  },

  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  typeCard: {
    display: "flex", alignItems: "flex-start", gap: 12,
    textAlign: "left", padding: "18px 18px",
    background: "#FFFFFF", border: "1.5px solid #E7E5E4",
    borderRadius: 14, cursor: "pointer",
    fontFamily: "inherit", transition: "all 0.15s",
  },
  typeCardActive: {
    borderColor: "#1C1917", background: "#FAFAF9",
    boxShadow: "0 0 0 4px rgba(28,25,23,0.05)",
  },
  typeRadio: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2px solid #D6D3D1",
    flexShrink: 0, marginTop: 2,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typeRadioDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#1C1917",
  },
  typeText: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: 700, color: "#44403C", marginBottom: 4 },
  typeLabelActive: { color: "#1C1917" },
  typeDesc: { fontSize: 12, color: "#78716C", lineHeight: 1.5 },

  guestSelector: {
    display: "flex", alignItems: "center",
    background: "#FFFFFF", border: "1px solid #D6D3D1",
    borderRadius: 10, overflow: "hidden",
  },
  guestBtn: {
    width: 52, height: 50, background: "#FAFAF9",
    border: "none", color: "#44403C",
    fontSize: 20, cursor: "pointer", fontWeight: 600,
    fontFamily: "inherit",
  },
  guestCount: {
    flex: 1, textAlign: "center", fontSize: 15,
    color: "#1C1917", fontWeight: 700, fontFamily: "inherit",
  },

  submitBtn: {
    marginTop: 8, padding: "15px 22px",
    background: "#1C1917", border: "none", borderRadius: 12,
    color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: "pointer",
    flex: 1, fontFamily: "inherit", transition: "background 0.15s",
    letterSpacing: "0.2px",
  },
  backBtn: {
    marginTop: 8, padding: "15px 22px",
    background: "#FFFFFF", border: "1px solid #D6D3D1",
    borderRadius: 12, color: "#44403C", fontWeight: 600,
    fontSize: 15, cursor: "pointer", fontFamily: "inherit",
  },
  stepActions: { display: "flex", gap: 12 },
  formNote: {
    margin: 0, fontSize: 12, color: "#A8A29E",
    textAlign: "center", lineHeight: 1.6,
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#FEF2F2", border: "1px solid #FECACA",
    color: "#B91C1C", borderRadius: 10,
    padding: "12px 16px", fontSize: 13, marginBottom: 20,
  },

  peakBox: {
    display: "flex", alignItems: "flex-start", gap: 12,
    background: "#FFFBEB", border: "1px solid #FDE68A",
    color: "#78350F", borderRadius: 12,
    padding: "14px 16px", fontSize: 13, lineHeight: 1.5,
  },
  peakText: { color: "#92400E", marginTop: 2, fontSize: 12 },
  reviewPeak: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#92400E",
    marginTop: 8, fontWeight: 600,
  },
  infoBox: {
    background: "#EFF6FF", border: "1px solid #BFDBFE",
    color: "#1E40AF", borderRadius: 10,
    padding: "12px 16px", fontSize: 13, lineHeight: 1.5,
  },

  stateBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "60px 20px", gap: 10,
  },
  stateText: { fontSize: 15, color: "#78716C", fontWeight: 600 },
  stateSubtext: { fontSize: 13, color: "#A8A29E" },

  searchWrap: {
    position: "relative", display: "flex", alignItems: "center",
  },
  searchIcon: {
    position: "absolute", left: 14, color: "#A8A29E",
    display: "flex", alignItems: "center", pointerEvents: "none",
  },
  searchInput: {
    padding: "13px 14px 13px 42px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  },

  categoryTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  categoryTab: {
    padding: "8px 16px", background: "#FFFFFF",
    border: "1px solid #E7E5E4", borderRadius: 20,
    color: "#57534E", fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", transition: "all 0.15s",
  },
  categoryTabActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
  },

  // ── Menu Grid — larger cards ──
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 20,
    maxHeight: 720, overflowY: "auto",
    paddingRight: 6,
  },
  menuCard: {
    display: "flex", flexDirection: "column",
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 16, overflow: "hidden",
    transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
  },
  menuPhotoWrap: {
    position: "relative",
    width: "100%", height: 220,
    background: "#F5F5F4",
    cursor: "zoom-in",
    overflow: "hidden",
  },
  menuPhoto: {
    width: "100%", height: "100%",
    objectFit: "cover", display: "block",
    transition: "transform 0.4s ease",
  },
  menuPhotoEmpty: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", height: "100%",
    fontSize: 12, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
    background: "#F5F5F4",
  },
  menuPhotoHover: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8,
    background: "rgba(28,25,23,0.55)",
    color: "#FFFFFF", fontWeight: 700, fontSize: 14,
    opacity: 0, transition: "opacity 0.2s",
    letterSpacing: "0.3px",
  },

  menuDetails: {
    padding: "18px 20px 20px",
    display: "flex", flexDirection: "column", gap: 10,
    flex: 1,
  },
  menuHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: 12,
  },
  menuName: {
    fontSize: 16, fontWeight: 700, color: "#1C1917",
    lineHeight: 1.35, flex: 1,
    display: "flex", alignItems: "center",
    gap: 8, flexWrap: "wrap",
  },
  bundleTag: {
    fontSize: 10, background: "#1C1917", color: "#FDE68A",
    padding: "3px 8px", borderRadius: 6,
    fontWeight: 800, letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  menuPrice: {
    fontSize: 17, fontWeight: 800, color: "#C8832A",
    whiteSpace: "nowrap",
  },
  menuDesc: {
    fontSize: 13, color: "#57534E", lineHeight: 1.55,
    display: "-webkit-box", WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  menuMeta: {
    display: "flex", alignItems: "center", gap: 10,
    flexWrap: "wrap", marginTop: 2,
  },
  menuCategory: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    background: "#F5F5F4", padding: "4px 10px", borderRadius: 6,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  menuCook: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, color: "#78716C", fontWeight: 600,
  },
  menuActions: {
    marginTop: "auto", paddingTop: 6,
    display: "flex", justifyContent: "flex-end",
  },
  addBtn: {
    padding: "11px 22px", background: "#1C1917",
    border: "none", borderRadius: 10, color: "#FFFFFF",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", letterSpacing: "0.2px",
  },
  qtyControl: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#FFFFFF", border: "1.5px solid #1C1917",
    borderRadius: 10, padding: "5px 12px",
  },
  qtyBtn: {
    width: 30, height: 30, background: "#FAFAF9",
    border: "1px solid #E7E5E4", borderRadius: 8,
    fontSize: 15, cursor: "pointer", color: "#1C1917",
    fontWeight: 700, fontFamily: "inherit",
  },
  qtyValue: {
    fontSize: 15, fontWeight: 800,
    minWidth: 22, textAlign: "center", color: "#1C1917",
  },
  cartBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#1C1917", color: "#FFFFFF",
    borderRadius: 12, padding: "16px 20px",
  },
  cartBarLabel: {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontSize: 14, fontWeight: 600, color: "#FDE68A",
  },
  cartBarTotal: { fontSize: 18, fontWeight: 800, color: "#FFFFFF" },

  reviewSection: {
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    borderRadius: 12, padding: "18px 20px",
  },
  reviewLabel: {
    fontSize: 11, color: "#78716C", textTransform: "uppercase",
    letterSpacing: "0.8px", fontWeight: 700, marginBottom: 12,
  },
  reviewLine: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 14, color: "#44403C", marginBottom: 8,
  },
  reviewNote: {
    fontSize: 13, color: "#78716C", fontStyle: "italic", marginTop: 10,
  },
  reviewOrderLine: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, color: "#44403C", padding: "6px 0",
  },
  reviewTotalLine: {
    display: "flex", justifyContent: "space-between",
    fontSize: 16, fontWeight: 800, color: "#1C1917",
    marginTop: 12, paddingTop: 12, borderTop: "1px dashed #D6D3D1",
  },
};
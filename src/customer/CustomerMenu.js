import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";

// ✅ FIXED: Removed getStoredUser() helper - 'user' was declared but never used

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

// ── GCash payment info ──
const GCASH_NUMBER = "0917 123 4567";
const GCASH_NAME = "Pukot Seafood Restaurant";
const GCASH_QR_IMAGE = "/gcash-qr.png";

// ── Tiered downpayment policy ──
const DOWNPAYMENT_RATES = {
  DineInSmall: 0,
  DineInLarge: 0.20,
  DineInPeak: 0.20,
  Catering: 0.50,
};

const MAX_PAX = 500;

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

// ── Bundle + pax helpers ──
const isBundleItem = (m) =>
  m.is_bundle === true ||
  /bundle|boodle|feast|tray|group|catering/i.test(m.category || "");

function parsePaxRange(item) {
  const text = `${item.name || ""} ${item.description || ""}`;
  const match = text.match(/good\s+for\s+(\d+)(?:\s*[-–to]+\s*(\d+))?/i);
  if (!match) return null;
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  return { min, max };
}

function formatPaxRange(range) {
  if (!range) return null;
  if (range.min === range.max) return `Good for ${range.min}`;
  return `Good for ${range.min}–${range.max}`;
}

function fitsPartySize(item, pax) {
  const range = parsePaxRange(item);
  if (!range) return false;
  return pax >= range.min && pax <= range.max;
}

function getRecommendedBundles(menuItems, pax) {
  return menuItems
    .filter(m => isBundleItem(m))
    .map(m => ({ item: m, range: parsePaxRange(m) }))
    .filter(({ range }) => range !== null)
    .map(({ item, range }) => {
      const distance =
        pax < range.min ? range.min - pax :
        pax > range.max ? pax - range.max : 0;
      return { item, range, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
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
  Lock: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Upload: (p) => (
    <svg width={p?.size || 28} height={p?.size || 28} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Sparkle: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 16.8 5.7 21.4 8 14 2 9.4h7.6z"/>
    </svg>
  ),
};

// ── Image Zoom Modal ──────────────────────────────────────────────────
function ImageZoomModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
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

          {item.description && <p style={zoom.desc}>{item.description}</p>}

          <div style={zoom.metaRow}>
            {parsePaxRange(item) && (
              <span style={zoom.metaItem}>
                <Icon.Users size={14} /> {formatPaxRange(parsePaxRange(item))}
              </span>
            )}
            {item.cooking_time > 0 && (
              <span style={zoom.metaItem}>
                <Icon.Clock size={14} /> {item.cooking_time} minutes
              </span>
            )}
            {isBundleItem(item) && <span style={zoom.bundleBadge}>Bundle</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────
function StepIndicator({ step, requiresDownpayment }) {
  const steps = requiresDownpayment
    ? [
        { n: 1, label: "Details" },
        { n: 2, label: "Menu" },
        { n: 3, label: "Review" },
        { n: 4, label: "Payment" },
      ]
    : [
        { n: 1, label: "Details" },
        { n: 2, label: "Menu" },
        { n: 3, label: "Confirm" },
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
            <span style={{ ...stepper.label, ...(step === s.n ? stepper.labelActive : {}) }}>
              {s.label}
            </span>
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
  // ✅ FIXED: Removed unused 'const user = getStoredUser();'

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
  const [zoomItem, setZoomItem] = useState(null);

  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const peakWarning = useMemo(() => isPeakHour(form.time), [form.time]);
  const activeType = RESERVATION_TYPES.find(t => t.id === reservationType);

  const downpaymentInfo = useMemo(() => {
    if (reservationType === "Catering") {
      return {
        rate: DOWNPAYMENT_RATES.Catering,
        reason: "Catering bookings require a 50% downpayment.",
      };
    }
    if (peakWarning) {
      return {
        rate: DOWNPAYMENT_RATES.DineInPeak,
        reason: "Peak-hour bookings require a 20% downpayment.",
      };
    }
    if (form.guests >= 5) {
      return {
        rate: DOWNPAYMENT_RATES.DineInLarge,
        reason: "Large parties (5+ pax) require a 20% downpayment.",
      };
    }
    return {
      rate: 0,
      reason: "No downpayment required for small dine-in bookings.",
    };
  }, [reservationType, peakWarning, form.guests]);

  const requiresDownpayment = downpaymentInfo.rate > 0;
  const totalSteps = requiresDownpayment ? 4 : 3;

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
    const base = ["All", ...unique];
    if (reservationType === "Catering" && !base.includes("Bundles")) {
      return ["All", "Bundles", ...unique];
    }
    return base;
  }, [menuItems, reservationType]);

  const visibleItems = useMemo(() => {
    let items = menuItems;

    if (activeCategory !== "All") {
      if (activeCategory === "Bundles") {
        items = items.filter(isBundleItem);
      } else {
        items = items.filter(m => m.category === activeCategory);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m => (m.name || "").toLowerCase().includes(q));
    }

    if (reservationType === "Catering" && activeCategory === "All" && !searchQuery.trim()) {
      items = [...items].sort((a, b) => {
        const aB = isBundleItem(a) ? 0 : 1;
        const bB = isBundleItem(b) ? 0 : 1;
        if (aB !== bB) return aB - bB;
        return (a.category || "").localeCompare(b.category || "");
      });
    }

    return items;
  }, [menuItems, activeCategory, reservationType, searchQuery]);

  const cartArray = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartArray.reduce((s, i) => s + i.qty, 0), [cartArray]);
  const cartTotal = useMemo(
    () => cartArray.reduce((s, i) => s + i.qty * Number(i.price || 0), 0), [cartArray]);

  const downpayment = useMemo(
    () => Number((cartTotal * downpaymentInfo.rate).toFixed(2)),
    [cartTotal, downpaymentInfo.rate]);
  const balance = useMemo(
    () => Number((cartTotal - downpayment).toFixed(2)), [cartTotal, downpayment]);

  const canSubmitPayment =
    !requiresDownpayment ||
    (paymentReference.trim().length >= 6 && paymentProof !== null);

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

  const handleProofSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, or screenshot).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please upload a file under 5MB.");
      return;
    }

    setPaymentProof(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPaymentProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
  };

  const uploadProof = async (authUserId) => {
    if (!paymentProof || !authUserId) return null;

    const ext = paymentProof.name.split(".").pop() || "jpg";
    const fileName = `${authUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, paymentProof, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    return data?.publicUrl || null;
  };

  const changeType = (id) => {
    setReservationType(id);
    setActiveCategory("All");
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
      setStepError(`Catering bookings require at least ${activeType.minGuests} pax.`);
      return;
    }
    setStepError(""); setStep(2);
  };

  const goToStep3 = () => {
    if (cartCount === 0) { setStepError("Please add at least one item to your order to continue."); return; }
    setStepError(""); setStep(3);
  };

  const goToStep4 = () => { setStepError(""); setStep(4); };

  const backToStep = (n) => { setStepError(""); setStep(n); };

  const resetBookingFlow = () => {
    setForm({ date: "", time: "", guests: 2, notes: "", eventType: "", venue: "" });
    setCart({}); setActiveCategory("All"); setSearchQuery("");
    setReservationType("Dine-in"); setStep(1); setStepError("");
    setPaymentReference("");
    setPaymentProof(null);
    setPaymentProofPreview(null);
  };

  // ── Submission — uses REAL Supabase auth UUID for RLS ──
  const handleSubmit = async () => {
    // Fetch the real Supabase auth user
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;

    if (sessionError || !authUser?.id) {
      alert("Your session has expired. Please log out and log back in.");
      return;
    }

    if (cartCount === 0) {
      setStepError("Please add at least one item before confirming.");
      setStep(2);
      return;
    }

    if (requiresDownpayment && !canSubmitPayment) {
      setStepError(
        paymentProof
          ? "Please enter your GCash reference number to continue."
          : "Please attach a screenshot of your GCash payment to continue."
      );
      return;
    }

    setSubmitting(true);

    let proofUrl = null;
    if (requiresDownpayment && paymentProof) {
      setUploadingProof(true);
      proofUrl = await uploadProof(authUser.id);
      setUploadingProof(false);

      if (!proofUrl) {
        alert("We couldn't upload your payment screenshot. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    const cartPayload = cartArray.map(i => ({
      id: i.id, name: i.name, qty: i.qty,
      price: Number(i.price || 0),
      instructions: form.notes.trim() || null,
    }));

    const { error } = await supabase.from("orders").insert([{
      user_id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email,
      contact: authUser.email,
      reservation_date: form.date,
      reservation_time: form.time,
      pax: form.guests,
      cart: cartPayload,
      total: cartTotal,
      downpayment: downpayment,
      payment_method: requiresDownpayment ? "GCash" : null,
      payment_reference: requiresDownpayment ? paymentReference.trim() || null : null,
      payment_proof_url: proofUrl,
      payment_status: requiresDownpayment ? "Partial" : "Pending",
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

    if (requiresDownpayment) {
      alert(
        `Reservation submitted! We received your ${formatCurrency(downpayment)} GCash downpayment. ` +
        `Balance of ${formatCurrency(balance)} will be settled at the restaurant.`
      );
    } else {
      alert("Reservation submitted! We'll confirm it shortly.");
    }
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
      <style>{`
        .menu-photo-wrap:hover .menu-photo-hover { opacity: 1 !important; }
        .menu-photo-wrap:hover .menu-photo { transform: scale(1.05); }
        .upload-box:hover { border-color: #1C1917 !important; background: #FFFFFF !important; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

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
            <span style={styles.stepCount}>Step {step} of {totalSteps}</span>
          </div>

          <StepIndicator step={step} requiresDownpayment={requiresDownpayment} />

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
                      This slot is forecasted to be busy. A 20% downpayment will be required to secure your booking.
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Number of Pax
                  {activeType?.minGuests > 1 && (
                    <span style={styles.minHint}> (min {activeType.minGuests})</span>
                  )}
                </label>
                <div style={styles.guestSelector}>
                  <button type="button" style={styles.guestBtn}
                    onClick={() => setForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))}>−</button>
                  <input
                    type="number"
                    min="1"
                    max={MAX_PAX}
                    inputMode="numeric"
                    style={styles.guestInput}
                    value={form.guests === 0 ? "" : form.guests}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (raw === "") {
                        setForm(f => ({ ...f, guests: 0 }));
                        return;
                      }
                      const n = parseInt(raw, 10);
                      setForm(f => ({ ...f, guests: Math.min(MAX_PAX, Math.max(1, n)) }));
                    }}
                    onBlur={() => {
                      if (!form.guests || form.guests < 1) {
                        setForm(f => ({ ...f, guests: 1 }));
                      }
                    }}
                  />
                  <button type="button" style={styles.guestBtn}
                    onClick={() => setForm(f => ({ ...f, guests: Math.min(MAX_PAX, f.guests + 1) }))}>+</button>
                </div>
                <p style={styles.fieldHint}>
                  Enter the exact number of pax. Maximum {MAX_PAX}.
                </p>
              </div>

              {form.date && form.time && (
                <div style={{
                  ...styles.policyBox,
                  background: requiresDownpayment ? "#FFFBEB" : "#ECFDF5",
                  borderColor: requiresDownpayment ? "#FDE68A" : "#A7F3D0",
                  color: requiresDownpayment ? "#78350F" : "#065F46",
                }}>
                  <strong>{requiresDownpayment ? "Downpayment Required" : "No Downpayment Required"}</strong>
                  <div style={styles.policyText}>{downpaymentInfo.reason}</div>
                </div>
              )}

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

              {reservationType === "Catering" && form.guests >= 1 && (
                <div style={styles.suggestionBox}>
                  <div style={styles.suggestionHeader}>
                    <Icon.Sparkle size={16} />
                    <strong>Recommended for {form.guests} pax</strong>
                  </div>
                  <div style={styles.suggestionList}>
                    {getRecommendedBundles(menuItems, form.guests).map(({ item, range, distance }) => (
                      <div key={item.id} style={styles.suggestionItem}>
                        <div style={styles.suggestionItemLeft}>
                          <div style={styles.suggestionItemName}>{item.name}</div>
                          <div style={styles.suggestionItemRange}>
                            <Icon.Users size={12} /> {formatPaxRange(range)}
                          </div>
                        </div>
                        <div style={styles.suggestionItemRight}>
                          <div style={styles.suggestionItemPrice}>{formatCurrency(item.price)}</div>
                          {distance === 0 && (
                            <div style={styles.perfectBadge}>
                              <Icon.Check size={10} /> Perfect fit
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {getRecommendedBundles(menuItems, form.guests).length === 0 && (
                      <div style={styles.suggestionEmpty}>
                        No bundle recommendations for this party size — you can still browse the full menu next.
                      </div>
                    )}
                  </div>
                  <p style={styles.suggestionHint}>
                    You can still choose any bundle from the full menu on the next step.
                  </p>
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

          {/* ─── STEP 2 ─── */}
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
                  {reservationType === "Catering" && (() => {
                    const bundleCount = menuItems.filter(isBundleItem).length;
                    return (
                      <div style={styles.infoBox}>
                        {bundleCount > 0
                          ? `Showing all items — ${bundleCount} catering bundle${bundleCount > 1 ? "s" : ""} listed first. Use the Bundles tab to see only bundles.`
                          : "No catering bundles flagged in the menu. Please contact the restaurant to confirm availability."}
                      </div>
                    );
                  })()}

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

                  <div style={styles.menuGrid}>
                    {visibleItems.map(item => {
                      const inCart = cart[item.id];
                      const range = parsePaxRange(item);
                      const recommended =
                        reservationType === "Catering" &&
                        isBundleItem(item) &&
                        fitsPartySize(item, form.guests);

                      return (
                        <div key={item.id} style={styles.menuCard}>
                          <div
                            className="menu-photo-wrap"
                            style={styles.menuPhotoWrap}
                            onClick={() => setZoomItem(item)}
                            title="Click to view larger"
                          >
                            {item.image_url ? (
                              <img
                                className="menu-photo"
                                src={item.image_url}
                                alt={item.name}
                                style={styles.menuPhoto}
                                onError={e => { e.target.style.display = "none"; }}
                              />
                            ) : (
                              <div style={styles.menuPhotoEmpty}>No Photo</div>
                            )}
                            <div className="menu-photo-hover" style={styles.menuPhotoHover}>
                              <Icon.Zoom size={18} />
                              <span>View</span>
                            </div>
                          </div>

                          <div style={styles.menuDetails}>
                            <div style={styles.menuHeader}>
                              <div style={styles.menuName}>
                                {item.name}
                                {isBundleItem(item) && <span style={styles.bundleTag}>Bundle</span>}
                                {recommended && (
                                  <span style={styles.recommendedTag}>
                                    <Icon.Check size={10} /> Recommended
                                  </span>
                                )}
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
                              {range && (
                                <span style={styles.paxChip}>
                                  <Icon.Users size={12} /> {formatPaxRange(range)}
                                </span>
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
                  onClick={goToStep3}>
                  {requiresDownpayment ? "Review Order" : "Review & Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3 — Review ─── */}
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
                  <Icon.Users size={14} /> {form.guests} pax
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
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {requiresDownpayment && (
                <div style={styles.reviewSection}>
                  <div style={styles.reviewLabel}>Payment Summary</div>
                  <div style={styles.reviewOrderLine}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div style={styles.reviewOrderLine}>
                    <span>Downpayment ({Math.round(downpaymentInfo.rate * 100)}%) — due now</span>
                    <span style={{ color: "#C8832A", fontWeight: 700 }}>
                      {formatCurrency(downpayment)}
                    </span>
                  </div>
                  <div style={styles.reviewTotalLine}>
                    <span>Balance — due at restaurant</span>
                    <span>{formatCurrency(balance)}</span>
                  </div>
                </div>
              )}

              {!requiresDownpayment && (
                <div style={styles.noDpBox}>
                  <Icon.Check size={16} />
                  <div>
                    <strong>No downpayment required</strong>
                    <div style={styles.noDpText}>
                      You can pay the full amount of {formatCurrency(cartTotal)} at the restaurant.
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.stepActions}>
                <button type="button" style={styles.backBtn}
                  onClick={() => backToStep(2)}>Edit Order</button>

                {requiresDownpayment ? (
                  <button type="button" style={styles.submitBtn}
                    onClick={goToStep4}>Continue to Payment</button>
                ) : (
                  <button type="button" style={styles.submitBtn}
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Confirm Reservation"}
                  </button>
                )}
              </div>
              <p style={styles.formNote}>
                {requiresDownpayment
                  ? `A ${Math.round(downpaymentInfo.rate * 100)}% downpayment is required to confirm your reservation.`
                  : "Your reservation will be confirmed shortly."}
              </p>
            </div>
          )}

          {/* ─── STEP 4 — Payment ─── */}
          {step === 4 && requiresDownpayment && (
            <div style={styles.form}>
              <div style={styles.paySummary}>
                <div style={styles.paySummaryLeft}>
                  <div style={styles.paySummaryLabel}>Total Order</div>
                  <div style={styles.paySummaryValue}>{formatCurrency(cartTotal)}</div>
                </div>
                <div style={styles.paySummaryDivider} />
                <div style={styles.paySummaryLeft}>
                  <div style={styles.paySummaryLabel}>Downpayment Due Now</div>
                  <div style={{ ...styles.paySummaryValue, color: "#C8832A" }}>
                    {formatCurrency(downpayment)}
                  </div>
                </div>
                <div style={styles.paySummaryDivider} />
                <div style={styles.paySummaryLeft}>
                  <div style={styles.paySummaryLabel}>Balance on Arrival</div>
                  <div style={styles.paySummaryValue}>{formatCurrency(balance)}</div>
                </div>
              </div>

              <div style={styles.gcashBox}>
                <div style={styles.gcashHeader}>
                  <div style={styles.gcashLogo}>G</div>
                  <div>
                    <div style={styles.gcashTitle}>Pay via GCash</div>
                    <div style={styles.gcashSubtitle}>
                      Scan the QR code or send to the number below
                    </div>
                  </div>
                </div>

                <div style={styles.gcashBody}>
                  <div style={styles.qrPanel}>
                    <div style={styles.qrImageWrap}>
                      <img
                        src={GCASH_QR_IMAGE}
                        alt="GCash QR Code"
                        style={styles.qrImage}
                        onError={(e) => {
                          e.target.style.display = "none";
                          const el = e.target.parentElement;
                          if (el && !el.querySelector(".qr-fallback")) {
                            const div = document.createElement("div");
                            div.className = "qr-fallback";
                            div.textContent = "QR Code";
                            div.style.cssText =
                              "color:#0369A1;font-size:13px;font-weight:700;text-align:center;padding:20px;";
                            el.appendChild(div);
                          }
                        }}
                      />
                    </div>
                    <div style={styles.qrCaption}>Scan with your GCash app</div>
                  </div>

                  <div style={styles.gcashDetailsPanel}>
                    <div style={styles.gcashRow}>
                      <span style={styles.gcashRowLabel}>GCash Number</span>
                      <span style={styles.gcashRowValue}>{GCASH_NUMBER}</span>
                    </div>
                    <div style={styles.gcashRow}>
                      <span style={styles.gcashRowLabel}>Account Name</span>
                      <span style={styles.gcashRowValue}>{GCASH_NAME}</span>
                    </div>
                    <div style={styles.gcashRow}>
                      <span style={styles.gcashRowLabel}>Amount to Send</span>
                      <span style={{ ...styles.gcashRowValue, color: "#C8832A", fontSize: 16 }}>
                        {formatCurrency(downpayment)}
                      </span>
                    </div>
                  </div>
                </div>

                <ol style={styles.gcashSteps}>
                  <li>Open your GCash app and scan the QR code (or Send Money to the number).</li>
                  <li>Send exactly {formatCurrency(downpayment)}.</li>
                  <li>Take a screenshot of your payment receipt.</li>
                  <li>Fill in the reference number and attach the screenshot below.</li>
                </ol>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  GCash Reference Number <span style={styles.reqStar}>*</span>
                </label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. 1234 567 890123"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  maxLength={40}
                />
                <p style={styles.fieldHint}>
                  You'll find this in the SMS or in-app receipt after sending the payment.
                </p>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Payment Screenshot <span style={styles.reqStar}>*</span>
                </label>

                {!paymentProofPreview ? (
                  <label htmlFor="proof-upload" className="upload-box" style={styles.uploadBox}>
                    <div style={styles.uploadIconWrap}>
                      <Icon.Upload size={28} />
                    </div>
                    <div style={styles.uploadTitle}>Click to upload screenshot</div>
                    <div style={styles.uploadHint}>JPG, PNG, or HEIC · Max 5MB</div>
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProofSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={styles.proofPreviewWrap}>
                    <img
                      src={paymentProofPreview}
                      alt="Payment proof preview"
                      style={styles.proofPreviewImg}
                    />
                    <div style={styles.proofPreviewBar}>
                      <div style={styles.proofPreviewName}>
                        {paymentProof?.name || "Screenshot"}
                      </div>
                      <button
                        type="button"
                        onClick={clearProof}
                        style={styles.proofRemoveBtn}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <p style={styles.fieldHint}>
                  Attach a clear screenshot showing the reference number and amount sent.
                </p>
              </div>

              <div style={styles.trustRow}>
                <Icon.Lock size={14} />
                <span>Your downpayment is refundable up to 24 hours before your booking.</span>
              </div>

              <div style={styles.stepActions}>
                <button type="button" style={styles.backBtn}
                  onClick={() => backToStep(3)}>Back</button>
                <button type="button" style={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmitPayment}>
                  {uploadingProof
                    ? "Uploading screenshot..."
                    : submitting
                    ? "Submitting..."
                    : `Confirm ${formatCurrency(downpayment)} Payment`}
                </button>
              </div>
              <p style={styles.formNote}>
                By confirming, you agree to our reservation and cancellation policy.
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
    background: "rgba(12, 10, 9, 0.92)",
    backdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24, animation: "fadeIn 0.2s ease",
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
    gap: 0, background: "#FFFFFF",
    borderRadius: 20, overflow: "hidden",
    maxWidth: 1200, width: "100%", maxHeight: "90vh",
    boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
  },
  imageWrap: {
    background: "#0C0A09",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", minHeight: 400,
  },
  image: {
    width: "100%", height: "100%", maxHeight: "90vh",
    objectFit: "contain", display: "block",
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
  desc: { margin: 0, fontSize: 15, lineHeight: 1.7, color: "#44403C" },
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
    padding: "0 0 60px", minHeight: "100vh", background: "#FAFAF9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1C1917",
  },
  header: { padding: "40px 48px 24px", maxWidth: 1200, margin: "0 auto" },
  headerTitle: {
    margin: "0 0 6px", fontSize: 26, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.6px",
  },
  headerSubtitle: { margin: 0, fontSize: 14, color: "#78716C", lineHeight: 1.5 },
  container: { padding: "0 48px", maxWidth: 1200, margin: "0 auto" },
  card: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
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
    fontSize: 11, color: "#78716C", background: "#F5F5F4",
    padding: "6px 12px", borderRadius: 20, fontWeight: 700,
    letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap",
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  formRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 200 },
  label: { fontSize: 13, color: "#44403C", fontWeight: 600, letterSpacing: "0.2px" },
  optional: { fontWeight: 400, color: "#A8A29E" },
  reqStar: { color: "#DC2626" },
  minHint: { color: "#78716C", fontWeight: 500, fontSize: 12 },
  fieldHint: { margin: "4px 0 0", fontSize: 12, color: "#A8A29E", lineHeight: 1.5 },
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
    border: "2px solid #D6D3D1", flexShrink: 0, marginTop: 2,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typeRadioDot: { width: 8, height: 8, borderRadius: "50%", background: "#1C1917" },
  typeText: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: 700, color: "#44403C", marginBottom: 4 },
  typeLabelActive: { color: "#1C1917" },
  typeDesc: { fontSize: 12, color: "#78716C", lineHeight: 1.5 },
  guestSelector: {
    display: "flex", alignItems: "center",
    background: "#FFFFFF", border: "1px solid #D6D3D1",
    borderRadius: 10, overflow: "hidden",
    minWidth: 200,
  },
  guestBtn: {
    width: 52, height: 50, background: "#FAFAF9",
    border: "none", color: "#44403C", fontSize: 20,
    cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
  },
  guestInput: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontSize: 16,
    color: "#1C1917",
    fontWeight: 700,
    fontFamily: "inherit",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "12px 8px",
    MozAppearance: "textfield",
    WebkitAppearance: "none",
    appearance: "textfield",
  },
  submitBtn: {
    marginTop: 8, padding: "15px 22px", background: "#1C1917",
    border: "none", borderRadius: 12, color: "#FFFFFF",
    fontWeight: 700, fontSize: 15, cursor: "pointer", flex: 1,
    fontFamily: "inherit", transition: "background 0.15s", letterSpacing: "0.2px",
  },
  backBtn: {
    marginTop: 8, padding: "15px 22px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 12,
    color: "#44403C", fontWeight: 600, fontSize: 15,
    cursor: "pointer", fontFamily: "inherit",
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
    fontSize: 12, color: "#92400E", marginTop: 8, fontWeight: 600,
  },
  infoBox: {
    background: "#EFF6FF", border: "1px solid #BFDBFE",
    color: "#1E40AF", borderRadius: 10,
    padding: "12px 16px", fontSize: 13, lineHeight: 1.5,
  },
  policyBox: {
    display: "flex", flexDirection: "column", gap: 4,
    borderRadius: 12, border: "1px solid", padding: "14px 16px",
    fontSize: 13, lineHeight: 1.5,
  },
  policyText: { marginTop: 2, fontSize: 12, opacity: 0.9 },
  noDpBox: {
    display: "flex", alignItems: "flex-start", gap: 12,
    background: "#ECFDF5", border: "1px solid #A7F3D0",
    color: "#065F46", borderRadius: 12,
    padding: "14px 16px", fontSize: 13, lineHeight: 1.5,
  },
  noDpText: { color: "#047857", marginTop: 2, fontSize: 12 },
  stateBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "60px 20px", gap: 10,
  },
  stateText: { fontSize: 15, color: "#78716C", fontWeight: 600 },
  stateSubtext: { fontSize: 13, color: "#A8A29E" },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
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
  menuGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20, maxHeight: 720, overflowY: "auto", paddingRight: 6,
  },
  menuCard: {
    display: "flex", flexDirection: "column",
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 16, overflow: "hidden",
    transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
  },
  menuPhotoWrap: {
    position: "relative", width: "100%", aspectRatio: "4 / 3",
    background: "#0C0A09", cursor: "zoom-in", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  menuPhoto: {
    maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto",
    objectFit: "contain", display: "block", transition: "transform 0.4s ease",
  },
  menuPhotoEmpty: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", height: "100%",
    fontSize: 12, color: "#A8A29E", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px", background: "#F5F5F4",
  },
  menuPhotoHover: {
    position: "absolute", bottom: 12, right: 12,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "rgba(28,25,23,0.85)", color: "#FFFFFF",
    fontWeight: 700, fontSize: 12, padding: "8px 12px",
    borderRadius: 10, opacity: 0, transition: "opacity 0.2s",
    letterSpacing: "0.3px", pointerEvents: "none",
  },
  menuDetails: {
    padding: "18px 20px 20px",
    display: "flex", flexDirection: "column", gap: 10, flex: 1,
  },
  menuHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: 12,
  },
  menuName: {
    fontSize: 16, fontWeight: 700, color: "#1C1917",
    lineHeight: 1.35, flex: 1,
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
  },
  bundleTag: {
    fontSize: 10, background: "#1C1917", color: "#FDE68A",
    padding: "3px 8px", borderRadius: 6, fontWeight: 800,
    letterSpacing: "0.5px", textTransform: "uppercase",
  },
  recommendedTag: {
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 10, background: "#D1FAE5", color: "#047857",
    padding: "3px 8px", borderRadius: 6,
    fontWeight: 800, letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  paxChip: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, color: "#0369A1", fontWeight: 700,
    background: "#F0F9FF",
    padding: "4px 10px", borderRadius: 6,
  },
  menuPrice: {
    fontSize: 17, fontWeight: 800, color: "#C8832A", whiteSpace: "nowrap",
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
  paySummary: {
    display: "flex", background: "#1C1917", color: "#FFFFFF",
    borderRadius: 14, padding: "20px 24px", gap: 20, flexWrap: "wrap",
    alignItems: "center", justifyContent: "space-between",
  },
  paySummaryLeft: { flex: 1, minWidth: 140 },
  paySummaryLabel: {
    fontSize: 11, color: "#A8A29E", textTransform: "uppercase",
    letterSpacing: "0.6px", fontWeight: 700, marginBottom: 6,
  },
  paySummaryValue: {
    fontSize: 22, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px",
  },
  paySummaryDivider: { width: 1, height: 40, background: "rgba(255,255,255,0.15)" },
  gcashBox: {
    background: "#F0F9FF", border: "1px solid #BAE6FD",
    borderRadius: 14, padding: "20px 22px",
    display: "flex", flexDirection: "column", gap: 18,
  },
  gcashHeader: { display: "flex", alignItems: "center", gap: 12 },
  gcashLogo: {
    width: 44, height: 44, borderRadius: 12,
    background: "#0070E0", color: "#FFFFFF",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, fontWeight: 900, fontFamily: "inherit",
  },
  gcashTitle: { fontSize: 16, fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.2px" },
  gcashSubtitle: { fontSize: 12, color: "#0369A1", marginTop: 2 },
  gcashBody: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 200px) 1fr",
    gap: 16, alignItems: "stretch",
  },
  qrPanel: {
    background: "#FFFFFF", border: "1px solid #BAE6FD",
    borderRadius: 12, padding: 12,
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8,
  },
  qrImageWrap: {
    width: "100%", aspectRatio: "1 / 1",
    background: "#F0F9FF", borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  qrImage: {
    width: "100%", height: "100%",
    objectFit: "contain", display: "block",
  },
  qrCaption: {
    fontSize: 11, color: "#0369A1", fontWeight: 700,
    textAlign: "center", letterSpacing: "0.3px",
  },
  gcashDetailsPanel: {
    background: "#FFFFFF", border: "1px solid #BAE6FD",
    borderRadius: 12, padding: "14px 16px",
    display: "flex", flexDirection: "column",
    justifyContent: "center", gap: 12,
  },
  gcashRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12,
  },
  gcashRowLabel: {
    fontSize: 11, color: "#0369A1", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  gcashRowValue: {
    fontSize: 14, color: "#0C4A6E", fontWeight: 800, textAlign: "right",
  },
  gcashSteps: {
    margin: 0, paddingLeft: 20,
    fontSize: 13, color: "#0C4A6E", lineHeight: 1.7,
  },
  uploadBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 8,
    padding: "28px 20px", border: "2px dashed #D6D3D1",
    borderRadius: 12, background: "#FAFAF9",
    cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
    fontFamily: "inherit",
  },
  uploadIconWrap: {
    color: "#78716C", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontSize: 14, fontWeight: 700, color: "#1C1917" },
  uploadHint: { fontSize: 11, color: "#A8A29E" },
  proofPreviewWrap: {
    display: "flex", flexDirection: "column",
    border: "1px solid #E7E5E4", borderRadius: 12,
    overflow: "hidden", background: "#FFFFFF",
  },
  proofPreviewImg: {
    width: "100%", maxHeight: 320,
    objectFit: "contain", background: "#F5F5F4", display: "block",
  },
  proofPreviewBar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12,
    padding: "10px 14px", borderTop: "1px solid #E7E5E4",
    background: "#FAFAF9",
  },
  proofPreviewName: {
    fontSize: 12, color: "#57534E", fontWeight: 600,
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap", flex: 1,
  },
  proofRemoveBtn: {
    fontSize: 12, fontWeight: 700,
    background: "transparent", border: "1px solid #FECACA",
    borderRadius: 8, color: "#DC2626",
    cursor: "pointer", padding: "6px 12px", fontFamily: "inherit",
  },
  trustRow: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 12, color: "#A8A29E", padding: "10px 0 0",
  },
  suggestionBox: {
    background: "#F0F9FF",
    border: "1px solid #BAE6FD",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  suggestionHeader: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, color: "#0C4A6E", fontWeight: 700,
  },
  suggestionList: {
    display: "flex", flexDirection: "column", gap: 8,
  },
  suggestionItem: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12,
    background: "#FFFFFF",
    border: "1px solid #BAE6FD",
    borderRadius: 10,
    padding: "12px 14px",
  },
  suggestionItemLeft: { flex: 1, minWidth: 0 },
  suggestionItemName: {
    fontSize: 13, fontWeight: 700, color: "#0C4A6E",
    marginBottom: 4,
  },
  suggestionItemRange: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, color: "#0369A1", fontWeight: 600,
  },
  suggestionItemRight: {
    display: "flex", flexDirection: "column",
    alignItems: "flex-end", gap: 4, flexShrink: 0,
  },
  suggestionItemPrice: {
    fontSize: 14, fontWeight: 800, color: "#C8832A",
    whiteSpace: "nowrap",
  },
  perfectBadge: {
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 10, fontWeight: 800,
    background: "#D1FAE5", color: "#047857",
    padding: "3px 8px", borderRadius: 20,
    letterSpacing: "0.3px", textTransform: "uppercase",
  },
  suggestionEmpty: {
    fontSize: 12, color: "#0369A1", fontStyle: "italic",
    padding: "8px 0",
  },
  suggestionHint: {
    margin: 0, fontSize: 11, color: "#0369A1",
    lineHeight: 1.5, opacity: 0.85,
  },
};
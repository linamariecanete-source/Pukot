// src/admin/MenuAdmin.js
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";

const MAX_IMAGE_MB = 5;

// ── Icons ─────────────────────────────────────────────────────────────
const Icon = {
  Plus: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Edit: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Upload: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  X: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Image: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
};

// ── Confirm Delete Modal ──────────────────────────────────────────────
function ConfirmDeleteModal({ item, onConfirm, onClose, busy }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.confirmCard} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.warnIconWrap}>
          <Icon.Alert size={24} />
        </div>
        <h2 style={modalStyles.confirmTitle}>Delete menu item?</h2>
        <p style={modalStyles.confirmSubtitle}>
          You're about to permanently delete <strong>{item.name}</strong>. This can't be undone.
        </p>
        {item.image_url && (
          <div style={modalStyles.confirmPreview}>
            <img src={item.image_url} alt={item.name} style={modalStyles.confirmImage} />
          </div>
        )}
        <div style={modalStyles.confirmActions}>
          <button style={modalStyles.cancelBtn} onClick={onClose} disabled={busy}>
            Keep
          </button>
          <button style={modalStyles.deleteBtn} onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════
export default function MenuAdmin() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "", price: "", category: "", description: "", image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  // ── Data fetch ──
  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (!error) setMenuItems(data || []);
    else console.error("Fetch error:", error.message);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenuItems();
    const channel = supabase
      .channel("menu-changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => fetchMenuItems())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Derived ──
  const categories = useMemo(() => {
    const unique = Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)));
    return ["All", ...unique];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "All") items = items.filter(i => i.category === activeCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(i =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [menuItems, activeCategory, searchTerm]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const key = item.category || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const stats = useMemo(() => {
    const total = menuItems.length;
    const withPhoto = menuItems.filter(i => i.image_url).length;
    const categoryCount = new Set(menuItems.map(i => i.category).filter(Boolean)).size;
    return { total, withPhoto, categoryCount };
  }, [menuItems]);

  // ── Modal handlers ──
  const handleAdd = () => {
    setFormData({ name: "", price: "", category: "", description: "", image_url: "" });
    setImageFile(null);
    setImagePreviewUrl("");
    setNewCategory("");
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || "",
      price: item.price || "",
      category: item.category || "",
      description: item.description || "",
      image_url: item.image_url || "",
    });
    setImageFile(null);
    setImagePreviewUrl(item.image_url || "");
    setEditingItem(item);
    setNewCategory("");
    setShowAddModal(true);
  };

  const handleDeleteClick = (item) => setDeleteTarget(item);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase.from("menu_items").delete().eq("id", deleteTarget.id);

    if (error) {
      alert("Delete failed: " + error.message);
      setDeleting(false);
      return;
    }

    setDeleteTarget(null);
    setDeleting(false);
    fetchMenuItems();
  };

  // ── Image upload ──
  const uploadImage = async (file) => {
    if (!file) return null;
    setUploading(true);

    try {
      const safeFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const filePath = `${Date.now()}-${safeFilename}`;

      const { data, error } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (error) {
        console.error("Upload error:", error);
        setUploading(false);
        alert(`Upload failed: ${error.message}`);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("menu-images")
        .getPublicUrl(data.path);

      setUploading(false);
      return publicData?.publicUrl || null;
    } catch (err) {
      console.error("Unexpected upload error:", err);
      setUploading(false);
      alert(`Unexpected error: ${err.message}`);
      return null;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`Image is too large. Max ${MAX_IMAGE_MB}MB.`);
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const category = (formData.category === "new" ? newCategory : formData.category).trim();
    const trimmedName = formData.name.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedUrl = formData.image_url.trim();
    const priceValue = Number(formData.price);

    if (!trimmedName || !formData.price || isNaN(priceValue) || !category || !trimmedDescription) {
      setUploading(false);
      alert("Please complete all fields (name, price, category, description).");
      return;
    }

    if (!trimmedUrl && !imageFile) {
      setUploading(false);
      alert("Please upload a photo or paste an image URL.");
      return;
    }

    let imageUrl = trimmedUrl;
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (!uploadedUrl) { setUploading(false); return; }
      imageUrl = uploadedUrl;
    }

    const payload = {
      name: trimmedName,
      price: priceValue,
      category,
      description: trimmedDescription,
      image_url: imageUrl,
    };

    try {
      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
        if (error) { alert("Update failed: " + error.message); setUploading(false); return; }
      } else {
        const { error } = await supabase.from("menu_items").insert([payload]);
        if (error) { alert("Insert failed: " + error.message); setUploading(false); return; }
      }

      fetchMenuItems();
      setShowAddModal(false);
      setEditingItem(null);
      setImageFile(null);
      setImagePreviewUrl("");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──
  if (loading) {
    return <div style={styles.loading}>Loading menu...</div>;
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Menu Management</div>
          <h1 style={styles.headerTitle}>Menu Items</h1>
          <p style={styles.headerSubtitle}>
            Add, edit, or remove dishes shown to customers.
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.ghostBtn} onClick={fetchMenuItems}>
            <Icon.Refresh size={14} /> Refresh
          </button>
          <button style={styles.primaryBtn} onClick={handleAdd}>
            <Icon.Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <StatCard label="Total Items" value={stats.total} accent="#1C1917" />
        <StatCard label="With Photo" value={stats.withPhoto} accent="#059669" />
        <StatCard label="Categories" value={stats.categoryCount} accent="#3B82F6" />
        <StatCard label="No Photo" value={stats.total - stats.withPhoto} accent="#F59E0B" />
      </div>

      {/* Search + Category tabs */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon.Search size={16} /></span>
          <input
            type="text"
            placeholder="Search by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.categoryTabs}>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            style={{
              ...styles.categoryTab,
              ...(activeCategory === c ? styles.categoryTabActive : {}),
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      {Object.keys(groupedItems).length === 0 ? (
        <div style={styles.stateBox}>
          <div style={styles.stateText}>No menu items match your filters</div>
          <div style={styles.stateSubtext}>Try a different search or category.</div>
        </div>
      ) : (
        Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>{category}</h2>
              <span style={styles.sectionCount}>{items.length} item{items.length > 1 ? "s" : ""}</span>
            </div>

            <div style={styles.grid}>
              {items.map(item => (
                <div key={item.id} style={styles.card}>
                  <div style={styles.cardThumb}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={styles.cardImage}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div style={styles.cardImageEmpty}>
                        <Icon.Image size={20} />
                      </div>
                    )}
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardHeaderRow}>
                      <div style={styles.cardName}>{item.name}</div>
                      <div style={styles.cardPrice}>{formatCurrency(item.price)}</div>
                    </div>
                    <div style={styles.cardDesc}>
                      {item.description || "No description"}
                    </div>
                    <div style={styles.cardCategoryTag}>{category}</div>
                  </div>

                  <div style={styles.cardActions}>
                    <button style={styles.iconBtn} onClick={() => handleEdit(item)} title="Edit">
                      <Icon.Edit size={14} />
                    </button>
                    <button style={styles.iconBtnDanger} onClick={() => handleDeleteClick(item)} title="Delete">
                      <Icon.Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div style={modalStyles.overlay} onClick={() => !uploading && setShowAddModal(false)}>
          <div style={modalStyles.card} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <div>
                <h2 style={modalStyles.title}>
                  {editingItem ? "Edit menu item" : "Add menu item"}
                </h2>
                <p style={modalStyles.subtitle}>
                  {editingItem ? "Update the details below." : "Fill in the details for the new dish."}
                </p>
              </div>
              <button style={modalStyles.closeBtn} onClick={() => setShowAddModal(false)} disabled={uploading}>
                <Icon.X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={modalStyles.form}>
              <div style={modalStyles.row}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Name</label>
                  <input
                    placeholder="e.g. Grilled Tuna Panga"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={modalStyles.input}
                    required
                  />
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 380"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={modalStyles.input}
                    required
                  />
                </div>
              </div>

              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Description</label>
                <textarea
                  placeholder="Short description of the dish"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...modalStyles.input, minHeight: 80, resize: "vertical" }}
                  required
                />
              </div>

              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={modalStyles.input}
                  required
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c !== "All").map(c => (
                    <option key={c}>{c}</option>
                  ))}
                  <option value="new">+ New Category</option>
                </select>

                {formData.category === "new" && (
                  <input
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ ...modalStyles.input, marginTop: 8 }}
                    required
                  />
                )}
              </div>

              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Photo</label>

                {imagePreviewUrl || formData.image_url ? (
                  <div style={modalStyles.previewWrap}>
                    <img
                      src={imagePreviewUrl || formData.image_url}
                      alt="preview"
                      style={modalStyles.previewImage}
                    />
                  </div>
                ) : (
                  <label htmlFor="image-upload" style={modalStyles.uploadBox}>
                    <div style={modalStyles.uploadIcon}>
                      <Icon.Upload size={22} />
                    </div>
                    <div style={modalStyles.uploadTitle}>Click to upload</div>
                    <div style={modalStyles.uploadHint}>JPG, PNG · Max {MAX_IMAGE_MB}MB</div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                )}

                {imagePreviewUrl && (
                  <div style={modalStyles.previewActions}>
                    <label htmlFor="image-upload" style={modalStyles.changeImageBtn}>
                      <Icon.Upload size={12} /> Change
                    </label>
                    <button
                      type="button"
                      style={modalStyles.removeImageBtn}
                      onClick={() => { setImageFile(null); setImagePreviewUrl(""); setFormData({ ...formData, image_url: "" }); }}
                    >
                      <Icon.X size={12} /> Remove
                    </button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </div>
                )}

                <input
                  placeholder="Or paste an image URL"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value });
                    if (e.target.value) setImagePreviewUrl(e.target.value);
                  }}
                  style={{ ...modalStyles.input, marginTop: 8 }}
                />
              </div>

              <div style={modalStyles.actions}>
                <button type="button" style={modalStyles.cancelBtn} onClick={() => setShowAddModal(false)} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" style={modalStyles.saveBtn} disabled={uploading}>
                  {uploading ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          item={deleteTarget}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}

function formatCurrency(n) {
  return `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statBar, background: accent }} />
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = {
  page: {
    padding: "40px 48px 60px",
    minHeight: "100vh",
    background: "#FAFAF9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1C1917",
  },
  loading: {
    textAlign: "center", padding: 80,
    fontFamily: "'Inter', sans-serif", color: "#78716C",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-end", flexWrap: "wrap", gap: 16,
    maxWidth: 1280, margin: "0 auto 24px",
  },
  eyebrow: {
    fontSize: 11, color: "#78716C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6,
  },
  headerTitle: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.7px",
  },
  headerSubtitle: { margin: 0, fontSize: 14, color: "#78716C" },
  headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 18px", background: "#1C1917",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  ghostBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12, maxWidth: 1280, margin: "0 auto 20px",
  },
  statCard: {
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, padding: "18px 18px 16px",
    position: "relative", overflow: "hidden",
  },
  statBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  statValue: {
    fontSize: 26, fontWeight: 800, color: "#1C1917",
    letterSpacing: "-0.5px", lineHeight: 1,
  },
  statLabel: {
    fontSize: 11, color: "#78716C", marginTop: 6,
    textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.6px",
  },

  toolbar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 14,
    maxWidth: 1280, margin: "0 auto 12px",
  },
  searchWrap: { position: "relative", flex: 1, minWidth: 260, maxWidth: 480 },
  searchIcon: {
    position: "absolute", left: 14, top: "50%",
    transform: "translateY(-50%)", color: "#A8A29E",
    display: "flex", alignItems: "center", pointerEvents: "none",
  },
  searchInput: {
    padding: "12px 14px 12px 42px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  },

  categoryTabs: {
    display: "flex", gap: 8, flexWrap: "wrap",
    maxWidth: 1280, margin: "0 auto 24px",
  },
  categoryTab: {
    padding: "8px 16px", background: "#FFFFFF",
    border: "1px solid #E7E5E4", borderRadius: 20,
    color: "#57534E", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.15s",
  },
  categoryTabActive: {
    background: "#1C1917", borderColor: "#1C1917", color: "#FFFFFF",
  },

  stateBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "80px 20px", gap: 10,
    maxWidth: 1280, margin: "0 auto",
  },
  stateText: { fontSize: 15, color: "#78716C", fontWeight: 600 },
  stateSubtext: { fontSize: 13, color: "#A8A29E" },

  section: {
    maxWidth: 1280, margin: "0 auto 28px",
  },
  sectionHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "baseline", marginBottom: 12,
    paddingBottom: 10, borderBottom: "1px solid #E7E5E4",
  },
  sectionTitle: {
    margin: 0, fontSize: 16, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.3px",
  },
  sectionCount: {
    fontSize: 11, color: "#78716C",
    background: "#F5F5F4", padding: "4px 10px",
    borderRadius: 20, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.6px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: 12,
  },
  card: {
    display: "flex", alignItems: "stretch", gap: 14,
    background: "#FFFFFF", border: "1px solid #E7E5E4",
    borderRadius: 14, padding: 14,
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  cardThumb: {
    width: 88, height: 88, borderRadius: 10,
    overflow: "hidden", background: "#F5F5F4", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cardImage: {
    width: "100%", height: "100%", objectFit: "cover", display: "block",
  },
  cardImageEmpty: {
    color: "#A8A29E",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cardBody: {
    flex: 1, minWidth: 0, display: "flex",
    flexDirection: "column", gap: 6,
  },
  cardHeaderRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: 10,
  },
  cardName: {
    fontSize: 14, fontWeight: 700, color: "#1C1917",
    lineHeight: 1.35, flex: 1,
  },
  cardPrice: {
    fontSize: 14, fontWeight: 800, color: "#C8832A",
    whiteSpace: "nowrap",
  },
  cardDesc: {
    fontSize: 12, color: "#78716C", lineHeight: 1.5,
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  cardCategoryTag: {
    fontSize: 10, color: "#57534E", fontWeight: 700,
    background: "#F5F5F4", padding: "3px 8px",
    borderRadius: 6, alignSelf: "flex-start",
    textTransform: "uppercase", letterSpacing: "0.5px",
    marginTop: "auto",
  },
  cardActions: {
    display: "flex", flexDirection: "column",
    gap: 6, alignItems: "flex-end", flexShrink: 0,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    color: "#44403C", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },
  iconBtnDanger: {
    width: 34, height: 34, borderRadius: 8,
    background: "#FFFFFF", border: "1px solid #FECACA",
    color: "#DC2626", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Modal styles
// ═══════════════════════════════════════════════════════════════════════
const modalStyles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(12,10,9,0.5)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 20, padding: "28px 32px",
    width: "100%", maxWidth: 560,
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 30px 90px rgba(0,0,0,0.18)",
  },
  confirmCard: {
    background: "#FFFFFF", borderRadius: 20,
    padding: "32px 28px", width: "100%", maxWidth: 420,
    textAlign: "center",
    boxShadow: "0 30px 90px rgba(0,0,0,0.18)",
  },
  warnIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    background: "#FEF2F2", color: "#DC2626",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  confirmTitle: {
    margin: "0 0 8px", fontSize: 20, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.3px",
  },
  confirmSubtitle: {
    margin: "0 0 20px", fontSize: 14, color: "#78716C", lineHeight: 1.5,
  },
  confirmPreview: {
    background: "#FAFAF9", borderRadius: 12, padding: 12,
    marginBottom: 20,
    display: "flex", justifyContent: "center",
  },
  confirmImage: {
    maxWidth: 160, maxHeight: 120,
    borderRadius: 8, objectFit: "cover",
  },
  confirmActions: { display: "flex", gap: 10 },
  cancelBtn: {
    flex: 1, padding: "13px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#44403C", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  deleteBtn: {
    flex: 1, padding: "13px", background: "#DC2626",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },

  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: 16, marginBottom: 20,
  },
  title: {
    margin: "0 0 4px", fontSize: 20, fontWeight: 800,
    color: "#1C1917", letterSpacing: "-0.3px",
  },
  subtitle: { margin: 0, fontSize: 13, color: "#78716C" },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    color: "#44403C", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  form: { display: "flex", flexDirection: "column", gap: 16 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 12, color: "#44403C", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  input: {
    padding: "12px 14px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 10,
    color: "#1C1917", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  },

  uploadBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 6,
    padding: "24px 20px", border: "2px dashed #D6D3D1",
    borderRadius: 12, background: "#FAFAF9",
    cursor: "pointer", fontFamily: "inherit",
  },
  uploadIcon: {
    color: "#78716C", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontSize: 13, fontWeight: 700, color: "#1C1917" },
  uploadHint: { fontSize: 11, color: "#A8A29E" },

  previewWrap: {
    background: "#FAFAF9", border: "1px solid #E7E5E4",
    borderRadius: 12, padding: 12, textAlign: "center",
  },
  previewImage: {
    maxWidth: "100%", maxHeight: 200,
    borderRadius: 8, objectFit: "contain",
  },
  previewActions: {
    display: "flex", gap: 8, marginTop: 8, justifyContent: "center",
  },
  changeImageBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "8px 12px", background: "#FFFFFF",
    border: "1px solid #D6D3D1", borderRadius: 8,
    color: "#44403C", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  removeImageBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "8px 12px", background: "#FFFFFF",
    border: "1px solid #FECACA", borderRadius: 8,
    color: "#DC2626", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },

  actions: {
    display: "flex", gap: 10, marginTop: 8,
  },
  saveBtn: {
    flex: 2, padding: "13px", background: "#1C1917",
    border: "none", borderRadius: 10,
    color: "#FFFFFF", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
};
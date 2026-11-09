// src/customer/CustomerCatering.js

import { useState } from "react";
import { supabase } from "../supabaseClient";

const PACKAGES = [
  {
    name: "Package A",
    pricePerPax: 350,
    dishes: 3,
    min: 40,
    includes: "Rice + Softdrinks + Fruits",
  },

  {
    name: "Package B",
    pricePerPax: 400,
    dishes: 4,
    min: 40,
    includes: "Rice + Softdrinks + Fruits",
  },

  {
    name: "Package C",
    pricePerPax: 450,
    dishes: 5,
    min: 40,
    includes: "Rice + Softdrinks + Fruits",
  },
];

const MENU_ITEMS = {
  Seafoods: [
    {
      name: "Baked Scallops",
      image: "/menu/baked-scallops.jpg",
    },

    {
      name: "Buttered Garlic Shrimps",
      image: "/menu/shrimps.jpg",
    },

    {
      name: "Calamares",
      image: "/menu/calamares.jpg",
    },

    {
      name: "Sweet Chili Crabs",
      image: "/menu/crabs.jpg",
    },
  ],

  Chicken: [
    {
      name: "Chicken Curry",
      image: "/menu/chicken-curry.jpg",
    },

    {
      name: "Chicken Cordon Bleu",
      image: "/menu/cordon.jpg",
    },

    {
      name: "Hot Chili Wings",
      image: "/menu/wings.jpg",
    },
  ],

  Pork: [
    {
      name: "Pork Humba",
      image: "/menu/humba.jpg",
    },

    {
      name: "Baby Back Ribs",
      image: "/menu/ribs.jpg",
    },

    {
      name: "Lechon Kawali",
      image: "/menu/kawali.jpg",
    },
  ],

  Beef: [
    {
      name: "Beef Steak",
      image: "/menu/beefsteak.jpg",
    },

    {
      name: "Beef Caldereta",
      image: "/menu/caldereta.jpg",
    },
  ],

  Noodles: [
    {
      name: "Pancit Canton",
      image: "/menu/pancit.jpg",
    },

    {
      name: "Carbonara",
      image: "/menu/carbonara.jpg",
    },
  ],
};

export default function CustomerCatering() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    event_date: "",
    event_type: "",
    guests: 40,
    venue: "",
  });

  const [selectedPackage, setSelectedPackage] = useState(null);

  const [selectedDishes, setSelectedDishes] = useState([]);

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  // PACKAGE SUGGESTION
  const suggestedPackages = PACKAGES.filter(
    (p) => form.guests >= p.min
  );

  // TOTALS
  const totalPrice = selectedPackage
    ? selectedPackage.pricePerPax * Number(form.guests)
    : 0;

  const downpayment = totalPrice * 0.2;

  // SELECT DISHES
  const toggleDish = (dish) => {
    const exists = selectedDishes.find(
      (d) => d.name === dish.name
    );

    if (exists) {
      setSelectedDishes(
        selectedDishes.filter(
          (d) => d.name !== dish.name
        )
      );

      return;
    }

    if (
      selectedPackage &&
      selectedDishes.length >= selectedPackage.dishes
    ) {
      alert(
        `Only ${selectedPackage.dishes} dishes allowed`
      );

      return;
    }

    setSelectedDishes([
      ...selectedDishes,
      dish,
    ]);
  };

  // SUBMIT
  const submitOrder = async () => {
    if (!selectedPackage) {
      alert("Select package");
      return;
    }

    if (
      selectedDishes.length !==
      selectedPackage.dishes
    ) {
      alert(
        `Please select exactly ${selectedPackage.dishes} dishes`
      );

      return;
    }

    if (!file) {
      alert("Upload payment screenshot");
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    setLoading(true);

    const { error } = await supabase
      .from("catering")
      .insert([
        {
          user_id: user.id,

          event_date: form.event_date,

          event_type: form.event_type,

          guests: form.guests,

          venue: form.venue,

          package_name: selectedPackage.name,

          selected_dishes:
            selectedDishes.map(
              (d) => d.name
            ),

          total_price: totalPrice,

          downpayment: downpayment,

          status: "pending",
        },
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Reservation submitted!");

    window.location.reload();
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>
        Catering Reservation
      </h2>

      {/* STEP 1 */}

      {step === 1 && (
        <div style={styles.modal}>
          <h3>Event Details</h3>

          <input
            type="date"
            style={styles.input}
            value={form.event_date}
            onChange={(e) =>
              setForm({
                ...form,
                event_date: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Event Type"
            style={styles.input}
            value={form.event_type}
            onChange={(e) =>
              setForm({
                ...form,
                event_type: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Guests"
            style={styles.input}
            value={form.guests}
            onChange={(e) =>
              setForm({
                ...form,
                guests: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Venue"
            style={styles.input}
            value={form.venue}
            onChange={(e) =>
              setForm({
                ...form,
                venue: e.target.value,
              })
            }
          />

          <button
            style={styles.btn}
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </div>
      )}

      {/* STEP 2 */}

      {step === 2 && (
        <div style={styles.largeModal}>
          <h3>
            Choose Package & Customize Menu
          </h3>

          {/* PACKAGES */}

          <div style={styles.packageGrid}>
            {suggestedPackages.map((p, i) => (
              <div
                key={i}
                style={{
                  ...styles.packageCard,

                  border:
                    selectedPackage?.name ===
                    p.name
                      ? "2px solid #c8832a"
                      : "1px solid #ddd",
                }}
                onClick={() => {
                  setSelectedPackage(p);

                  setSelectedDishes([]);
                }}
              >
                <h3>{p.name}</h3>

                <p>
                  ₱{p.pricePerPax}/pax
                </p>

                <p>
                  {p.dishes} dishes
                </p>

                <small>
                  {p.includes}
                </small>
              </div>
            ))}
          </div>

          {/* MENU */}

          {selectedPackage && (
            <>
              <h3 style={{ marginTop: 30 }}>
                Select{" "}
                {selectedPackage.dishes}{" "}
                Dishes
              </h3>

              <p>
                Selected:
                {" "}
                {selectedDishes.length}
                /
                {selectedPackage.dishes}
              </p>

              {Object.entries(MENU_ITEMS).map(
                ([category, items]) => (
                  <div key={category}>
                    <h2 style={styles.category}>
                      {category}
                    </h2>

                    <div style={styles.menuGrid}>
                      {items.map((dish, i) => {
                        const active =
                          selectedDishes.find(
                            (d) =>
                              d.name ===
                              dish.name
                          );

                        return (
                          <div
                            key={i}
                            style={{
                              ...styles.menuCard,

                              border: active
                                ? "2px solid #c8832a"
                                : "1px solid #ddd",
                            }}
                            onClick={() =>
                              toggleDish(dish)
                            }
                          >
                            <img
                              src={dish.image}
                              alt={dish.name}
                              style={
                                styles.menuImage
                              }
                            />

                            <h4
                              style={{
                                padding: 10,
                              }}
                            >
                              {dish.name}
                            </h4>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {/* SUMMARY */}

              <div style={styles.summary}>
                <h3>Summary</h3>

                <p>
                  <b>Package:</b>{" "}
                  {selectedPackage.name}
                </p>

                <p>
                  <b>Guests:</b>{" "}
                  {form.guests}
                </p>

                <p>
                  <b>Total:</b> ₱
                  {totalPrice}
                </p>

                <p>
                  <b>Downpayment:</b> ₱
                  {downpayment}
                </p>

                <input
                  type="file"
                  style={styles.input}
                  onChange={(e) =>
                    setFile(
                      e.target.files[0]
                    )
                  }
                />

                <button
                  style={styles.btn}
                  onClick={submitOrder}
                  disabled={loading}
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Reservation"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 30,
    fontFamily: "Arial",
    background: "#f5f5f5",
    minHeight: "100vh",
  },

  title: {
    fontSize: 28,
    marginBottom: 20,
  },

  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    maxWidth: 500,
  },

  largeModal: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
  },

  btn: {
    width: "100%",
    padding: 12,
    background: "#c8832a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 15,
  },

  packageGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 15,
    marginTop: 20,
  },

  packageCard: {
    padding: 20,
    borderRadius: 12,
    cursor: "pointer",
    background: "#fafafa",
  },

  category: {
    marginTop: 30,
    marginBottom: 15,
  },

  menuGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: 15,
  },

  menuCard: {
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    cursor: "pointer",
  },

  menuImage: {
    width: "100%",
    height: 150,
    objectFit: "cover",
  },

  summary: {
    marginTop: 30,
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 12,
    background: "#fafafa",
  },
};
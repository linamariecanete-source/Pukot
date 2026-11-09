// src/pages/Contact.js
import React, { useState } from "react";

/* ─── Info card ──────────────────────────────────────────────────────── */
function InfoCard({ icon, title, lines }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? "rgba(255,255,255,0.6)"
          : "rgba(255,255,255,0.35)",
        border: hov
          ? "1px solid rgba(10,80,95,0.35)"
          : "1px solid rgba(10,80,95,0.15)",
        borderRadius: 16,
        padding: "26px 22px",
        textAlign: "center",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      <div style={{
        fontSize: 32,
        marginBottom: 12,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 58, height: 58,
        background: "rgba(10,80,95,0.12)",
        borderRadius: "50%",
      }}>{icon}</div>
      <div style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 16,
        color: "#FF8F00",
        marginBottom: 10,
      }}>{title}</div>
      {lines.map((l, i) => (
        <div key={i} style={{
          fontSize: 13,
          color: "#0A3D47",
          lineHeight: 1.7,
        }}>{l}</div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#88e0ec",
      fontFamily: "'Nunito', sans-serif",
      color: "#0A2A30",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');
        .contact-input {
          width: 100%;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(10,80,95,0.25);
          borderRadius: 12px;
          padding: 13px 16px;
          color: #0A2A30;
          font-family: 'Nunito', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border 0.25s, background 0.25s;
          box-sizing: border-box;
        }
        .contact-input:focus {
          border: 1px solid rgba(10,80,95,0.6);
          background: rgba(255,255,255,0.7);
        }
        .contact-input::placeholder { color: rgba(10,80,95,0.4); }
        .contact-two-col { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start; }
        @media(max-width:700px){
          .contact-two-col { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── TOP ACCENT BAR ───────────────────────────────────────── */}
      <div style={{
        height: 4,
        background: "#0A6575",
      }} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        padding: "90px 24px 70px",
        textAlign: "center",
        overflow: "hidden",
      }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle,rgba(10,80,95,0.15) 0%,transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 76, height: 76,
          background: "#0A6575",
          borderRadius: "50%",
          fontSize: 32,
          marginBottom: 22,
          boxShadow: "0 0 24px rgba(10,80,95,0.3)",
        }}>📬</div>

        <h1 style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(34px,6vw,60px)",
          color: "#0A3D47",
          margin: "0 0 14px",
          textShadow: "none",
          letterSpacing: 1,
        }}>Get in Touch</h1>

        <p style={{
          fontSize: "clamp(14px,2vw,17px)",
          color: "#0A5060",
          maxWidth: 540,
          margin: "0 auto 28px",
          lineHeight: 1.85,
        }}>
          Have a question, a reservation inquiry, or want to plan a catering event?
          We would love to hear from you.
        </p>

        {/* Rope decoration */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
          color: "rgba(10,80,95,0.4)", fontSize: 18,
        }}>
          — ✉ —
        </div>
      </section>

      {/* Wave divider */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 50" style={{ display: "block", width: "100%" }}>
          <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,0 1440,25 L1440,50 L0,50 Z"
            fill="rgba(10,80,95,0.08)" />
        </svg>
      </div>

      {/* ── INFO CARDS ───────────────────────────────────────────── */}
      <section style={{ padding: "50px 24px", maxWidth: 920, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 16,
          marginBottom: 60,
        }}>
          <InfoCard
            icon="📍"
            title="Find Us"
            lines={[
              "Pukot Seafood Restaurant",
              "San Carlos City, Negros Occidental",
            ]}
          />
          <InfoCard
            icon="📞"
            title="Call Us"
            lines={[
              "+63 900 000 0000",
              "Mon – Sun: 10AM to 9PM",
            ]}
          />
          <InfoCard
            icon="📧"
            title="Email Us"
            lines={[
              "pukot@seafood.com",
              "We reply within 24 hours",
            ]}
          />
          <InfoCard
            icon="🕐"
            title="Opening Hours"
            lines={[
              "Monday – Thursday: 10AM – 9PM",
              "Friday – Sunday: 10AM – 10PM",
            ]}
          />
        </div>

        {/* ── FORM + MAP ──────────────────────────────────────────── */}
        <div className="contact-two-col">

          {/* Contact Form */}
          <div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 12,
              color: "#0A6575",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>Send a Message</div>

            <h2 style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "clamp(22px,4vw,32px)",
              color: "#0A3D47",
              margin: "0 0 24px",
            }}>We'd Love to Hear from You</h2>

            {sent ? (
              <div style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(10,80,95,0.2)",
                borderRadius: 16,
                padding: "40px 28px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <div style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 22,
                  color: "#0A3D47",
                  marginBottom: 10,
                }}>Message Sent!</div>
                <p style={{
                  fontSize: 14,
                  color: "#0A5060",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}>
                  Thank you for reaching out, <strong style={{ color: "#0A3D47" }}>{form.name}</strong>!
                  We will get back to you at <strong style={{ color: "#0A3D47" }}>{form.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  style={{
                    padding: "11px 26px",
                    background: "rgba(10,80,95,0.12)",
                    border: "1px solid rgba(10,80,95,0.2)",
                    borderRadius: 50,
                    color: "#0A3D47",
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: 14,
                    cursor: "pointer",
                  }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Name */}
                <div>
                  <label style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: 6,
                  }}>Full Name *</label>
                  <input
                    className="contact-input"
                    name="name"
                    placeholder="e.g. Juan dela Cruz"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(10,80,95,0.2)",
                      borderRadius: 12,
                      padding: "13px 16px",
                      color: "#0A2A30",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: 6,
                  }}>Email Address *</label>
                  <input
                    className="contact-input"
                    name="email"
                    type="email"
                    placeholder="e.g. juan@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(10,80,95,0.2)",
                      borderRadius: 12,
                      padding: "13px 16px",
                      color: "#0A2A30",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: 6,
                  }}>Subject</label>
                  <select
                    className="contact-input"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(10,80,95,0.2)",
                      borderRadius: 12,
                      padding: "13px 16px",
                      color: form.subject ? "#0A2A30" : "rgba(10,80,95,0.4)",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" style={{ color: "rgba(255,255,255,0.3)" }}>Select a topic...</option>
                    <option value="Reservation Inquiry">Reservation Inquiry</option>
                    <option value="Catering Request">Catering Request</option>
                    <option value="Menu Question">Menu Question</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: 6,
                  }}>Message *</label>
                  <textarea
                    className="contact-input"
                    name="message"
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(10,80,95,0.2)",
                      borderRadius: 12,
                      padding: "13px 16px",
                      color: "#0A2A30",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 14,
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "14px 0",
                    background: loading
                      ? "rgba(10,80,95,0.4)"
                      : "#0A6575",
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: 16,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 4px 18px rgba(10,80,95,0.3)",
                    transition: "all 0.25s",
                    letterSpacing: "0.5px",
                  }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>

              </form>
            )}
          </div>

          {/* Right side — map + social */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Map placeholder */}
            <div>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 12,
                color: "#0A6575",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>Our Location</div>
              <h2 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "clamp(22px,4vw,32px)",
                color: "#FFD54F",
                margin: "0 0 18px",
              }}>Visit Us in San Carlos City, Negros Occidental</h2>
              <div style={{
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(10,80,95,0.2)",
                background: "rgba(255,255,255,0.35)",
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
              }}>
                <div style={{ fontSize: 48 }}>🗺️</div>
                <div style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 15,
                  color: "#0A3D47",
                }}>San Carlos City, Negros Occidental, Philippines</div>
                <div style={{
                  fontSize: 12,
                  color: "#0A5060",
                }}>Pukot Seafood Restaurant</div>
              </div>
            </div>

            {/* Follow us */}
            <div style={{
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(10,80,95,0.15)",
              borderRadius: 16,
              padding: "22px 20px",
            }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 16,
                color: "#FFD54F",
                marginBottom: 14,
              }}>Follow Us</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "📘", label: "Facebook", handle: "@PukotSeafood", color: "#4267B2" },
                  { icon: "📸", label: "Instagram", handle: "@pukot.seafood", color: "#E1306C" },
                  { icon: "🐦", label: "Twitter / X", handle: "@PukotSeafood", color: "#1DA1F2" },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.35)",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{
                        fontSize: 12,
                        color: "#0A5060",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}>{s.label}</div>
                      <div style={{
                        fontSize: 13,
                        color: "#0A2A30",
                        fontWeight: 700,
                      }}>{s.handle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div style={{
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(10,80,95,0.15)",
              borderRadius: 16,
              padding: "22px 20px",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 15,
                color: "#FFD54F",
                marginBottom: 14,
              }}>Skip the Wait</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <a href="/login" style={{
                  padding: "10px 20px",
                  background: "#0A6575",
                  color: "#fff",
                  borderRadius: 50,
                  textDecoration: "none",
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 13,
                  boxShadow: "0 4px 14px rgba(10,80,95,0.25)",
                }}>Book a Table</a>
                <a href="/login" style={{
                  padding: "10px 20px",
                  background: "rgba(255,143,0,0.12)",
                  color: "#FF8F00",
                  borderRadius: 50,
                  textDecoration: "none",
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 13,
                  border: "1px solid rgba(255,143,0,0.35)",
                }}>Catering</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom accent bar */}
      <div style={{
        height: 4,
        marginTop: 60,
        background: "#0A6575",
      }} />
    </div>
  );
}
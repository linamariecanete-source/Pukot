// src/components/AboutSection.js
import React, { useEffect, useRef, useState } from "react";

/* ─── Animated counter (triggers when visible) ──────────────────────── */
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !fired.current) {
          fired.current = true;
          let n = 0;
          const step = Math.ceil(target / 60);
          const t = setInterval(() => {
            n += step;
            if (n >= target) { setCount(target); clearInterval(t); }
            else setCount(n);
          }, 20);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Value card ─────────────────────────────────────────────────────── */
function ValueCard({ icon, title, text }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? "rgba(255,255,255,0.6)"
          : "rgba(255,255,255,0.4)",
        border: hov
          ? "1px solid rgba(10,80,95,0.3)"
          : "1px solid rgba(10,80,95,0.15)",
        borderRadius: 16,
        padding: "22px 20px",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      <div style={{
        fontSize: 26,
        minWidth: 46,
        height: 46,
        background: "rgba(10,80,95,0.12)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 15,
          color: "#0A3D47",
          marginBottom: 6,
        }}>{title}</div>
        <div style={{
          fontSize: 13,
          color: "#0A3D47",
          lineHeight: 1.7,
        }}>{text}</div>
      </div>
    </div>
  );
}

/* ─── Team card ──────────────────────────────────────────────────────── */
function TeamCard({ emoji, name, role, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? "rgba(255,255,255,0.5)"
          : "rgba(255,255,255,0.4)",
        border: hov
          ? "1px solid rgba(10,80,95,0.3)"
          : "1px solid rgba(10,80,95,0.15)",
        borderRadius: 16,
        padding: "28px 20px",
        textAlign: "center",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
      <div style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 17,
        color: "#0A3D47",
        marginBottom: 4,
      }}>{name}</div>
      <div style={{
        fontSize: 11,
        color: "#0A6575",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        fontWeight: 700,
        marginBottom: 12,
        fontFamily: "'Nunito', sans-serif",
      }}>{role}</div>
      <div style={{
        fontSize: 13,
        color: "#0A3D47",
        lineHeight: 1.7,
      }}>{desc}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function About() {
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
        .about-two-col { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
        @media(max-width:700px){
          .about-two-col { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── TOP ACCENT BAR (matches sidebar) ─────────────────────── */}
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
          background: "radial-gradient(circle,rgba(0,100,120,0.18) 0%,transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Anchor badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 76, height: 76,
          background: "linear-gradient(135deg,#0A6575,#0A4D5C)",
          borderRadius: "50%",
          fontSize: 34,
          marginBottom: 22,
          boxShadow: "0 0 40px rgba(0,150,136,0.45)",
        }}>⚓</div>

        <h1 style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(34px,6vw,60px)",
          color: "#0A3D47",
          margin: "0 0 14px",
          textShadow: "0 2px 20px rgba(255,213,79,0.3)",
          letterSpacing: 1,
        }}>About Pukot</h1>

        <p style={{
          fontSize: "clamp(14px,2vw,17px)",
          color: "#0A5060",
          maxWidth: 580,
          margin: "0 auto 28px",
          lineHeight: 1.85,
        }}>
          A seafood restaurant born from a love of fresh catches, warm hospitality,
          and the spirit of the sea — welcome to Pukot Seafood Restaurant.
        </p>

        {/* Rope decoration */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
          color: "rgba(10,60,75,0.35)", fontSize: 18,
        }}>
          — ⚓ —
        </div>
      </section>

      {/* Wave divider */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 50" style={{ display: "block", width: "100%" }}>
          <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,0 1440,25 L1440,50 L0,50 Z"
            fill="rgba(10,60,75,0.08)" />
        </svg>
      </div>

      {/* ── OUR STORY ────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px", maxWidth: 920, margin: "0 auto" }}>
        <div className="about-two-col">

          {/* Text side */}
          <div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 12,
              color: "#0A6575",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>Our Story</div>

            <h2 style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "clamp(22px,4vw,34px)",
              color: "#0A3D47",
              margin: "0 0 18px",
              lineHeight: 1.25,
            }}>
              Fresh from the Sea,<br />Straight to Your Table
            </h2>

            <p style={{
              fontSize: 14,
              color: "#0A3D47",
              lineHeight: 1.85,
              marginBottom: 14,
            }}>
              Pukot Seafood Restaurant started with a simple dream — to bring the freshest
              seafood from local fishermen directly to families and friends gathered around
              a table. The name <strong style={{ color: "#0A3D47" }}>Pukot</strong> comes
              from the Filipino word for fishing net, a symbol of the hard work and passion
              behind every dish we serve.
            </p>

            <p style={{
              fontSize: 14,
              color: "#0A3D47",
              lineHeight: 1.85,
            }}>
              From intimate family dinners to large catering events, we bring the taste of
              the ocean to every occasion. Every plate is prepared with care, every
              reservation handled with respect, and every guest leaves feeling like part of
              the Pukot family.
            </p>
          </div>

          {/* Visual card */}
          <div style={{
            background: "rgba(255,255,255,0.35)",
            border: "1px solid rgba(10,80,95,0.2)",
            borderRadius: 20,
            padding: "40px 28px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 68, marginBottom: 14 }}>🦐</div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 20,
              color: "#0A3D47",
              marginBottom: 8,
            }}>Pukot Seafood Restaurant</div>
            <div style={{
              fontSize: 13,
              color: "#0A5060",
              lineHeight: 1.7,
              marginBottom: 20,
            }}>
              Serving fresh seafood with heart<br />
              and the spirit of the Filipino sea.
            </div>
            <div style={{
              padding: "12px 18px",
              background: "rgba(10,80,95,0.1)",
              borderRadius: 12,
              border: "1px solid rgba(10,80,95,0.2)",
              fontSize: 13,
              color: "#0A5060",
            }}>
              Open Daily · Dine-in · Reservations · Catering
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider flip */}
      <div style={{ lineHeight: 0, transform: "scaleY(-1)" }}>
        <svg viewBox="0 0 1440 50" style={{ display: "block", width: "100%" }}>
          <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,0 1440,25 L1440,50 L0,50 Z"
            fill="rgba(10,60,75,0.08)" />
        </svg>
      </div>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section style={{
        padding: "55px 24px",
        background: "rgba(0,100,120,0.08)",
        borderTop: "1px solid rgba(10,80,95,0.15)",
        borderBottom: "1px solid rgba(10,80,95,0.15)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: 32,
          maxWidth: 860,
          margin: "0 auto",
          textAlign: "center",
        }}>
          {[
            { val: 500, suf: "+", label: "Happy Customers" },
            { val: 3,   suf: "+", label: "Years of Service" },
            { val: 50,  suf: "+", label: "Menu Items" },
            { val: 100, suf: "+", label: "Catering Events" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "clamp(34px,5vw,50px)",
                color: "#0A3D47",
                lineHeight: 1,
                marginBottom: 8,
              }}>
                <Counter target={s.val} suffix={s.suf} />
              </div>
              <div style={{
                fontSize: 12,
                color: "#0A5060",
                letterSpacing: "0.5px",
                fontWeight: 700,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Wave divider */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 50" style={{ display: "block", width: "100%" }}>
          <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,0 1440,25 L1440,50 L0,50 Z"
            fill="rgba(10,60,75,0.08)" />
        </svg>
      </div>

      {/* ── CORE VALUES ──────────────────────────────────────────── */}
      <section style={{ padding: "55px 24px", maxWidth: 920, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 12,
            color: "#0A6575",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>What We Stand For</div>
          <h2 style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: "clamp(22px,4vw,34px)",
            color: "#0A3D47",
            margin: 0,
          }}>Our Core Values</h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 14,
        }}>
          <ValueCard icon="🦞" title="Freshness First"
            text="We source only the freshest seafood from trusted local fishermen every single day. No shortcuts — just fresh, quality ingredients." />
          <ValueCard icon="🤝" title="Genuine Hospitality"
            text="Every guest is welcomed like family. From the moment you book to the last bite of your meal, we make you feel at home." />
          <ValueCard icon="⭐" title="Quality in Every Dish"
            text="Our kitchen team takes pride in every plate. We believe great seafood deserves great preparation, every single time." />
          <ValueCard icon="🌊" title="Community Roots"
            text="We support local fishermen and the community around us. When you dine at Pukot, you support local livelihoods too." />
          <ValueCard icon="🎉" title="Memorable Celebrations"
            text="From birthdays to weddings, our catering team ensures every event is handled with care, precision, and delicious food." />
          <ValueCard icon="💡" title="Always Improving"
            text="We embrace technology to serve you better — from online reservations to smart forecasting — so your experience is seamless." />
        </div>
      </section>

      {/* Wave divider flip */}
      <div style={{ lineHeight: 0, transform: "scaleY(-1)" }}>
        <svg viewBox="0 0 1440 50" style={{ display: "block", width: "100%" }}>
          <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,0 1440,25 L1440,50 L0,50 Z"
            fill="rgba(10,60,75,0.08)" />
        </svg>
      </div>

      {/* ── MEET THE TEAM ─────────────────────────────────────────── */}
      <section style={{
        padding: "55px 24px",
        background: "rgba(0,100,120,0.06)",
        borderTop: "1px solid rgba(10,80,95,0.15)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 12,
            color: "#0A6575",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>The Crew</div>
          <h2 style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: "clamp(22px,4vw,34px)",
            color: "#0A3D47",
            margin: 0,
          }}>Meet the Team</h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(195px,1fr))",
          gap: 18,
          maxWidth: 920,
          margin: "0 auto",
        }}>
          <TeamCard emoji="👨‍🍳" name="Head Chef" role="Kitchen Captain"
            desc="Leading the kitchen with years of seafood expertise and a passion for bringing out the best flavors from every catch." />
          <TeamCard emoji="🧑‍💼" name="Restaurant Manager" role="Operations Lead"
            desc="Overseeing daily operations, reservations, and catering events to make sure every experience at Pukot runs smoothly." />
          <TeamCard emoji="🧑‍🤝‍🧑" name="Service Team" role="Front of House"
            desc="Our friendly and dedicated servers who make sure every guest feels welcomed, comfortable, and well taken care of." />
          <TeamCard emoji="🚤" name="Catering Team" role="Events Specialists"
            desc="Bringing Pukot's signature seafood experience to your special events — from intimate gatherings to large celebrations." />
        </div>
      </section>

      {/* ── CTA STRIP ────────────────────────────────────────────── */}
      <section style={{
        padding: "44px 24px",
        textAlign: "center",
        borderTop: "1px solid rgba(10,80,95,0.15)",
      }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 22,
          color: "#0A3D47",
          marginBottom: 12,
        }}>Ready to Join Us?</div>
        <p style={{
          fontSize: 13,
          color: "#0A5060",
          marginBottom: 24,
        }}>
          Book a table, request catering, or just say hello.
        </p>
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          <a href="/login" style={{
            padding: "12px 28px",
            background: "linear-gradient(135deg,#0A6575,#0A4D5C)",
            color: "#0A2A30",
            borderRadius: 50,
            textDecoration: "none",
            fontFamily: "'Fredoka One', cursive",
            fontSize: 14,
            boxShadow: "0 4px 18px rgba(0,150,136,0.4)",
          }}>
            Make a Reservation
          </a>
          <a href="/login" style={{
            padding: "12px 28px",
            background: "rgba(10,80,95,0.1)",
            color: "#0A3D47",
            borderRadius: 50,
            textDecoration: "none",
            fontFamily: "'Fredoka One', cursive",
            fontSize: 14,
            border: "1px solid rgba(255,143,0,0.4)",
          }}>
            Request Catering
          </a>
        </div>
      </section>

      {/* Bottom accent bar */}
      <div style={{
        height: 4,
        background: "#0A6575",
      }} />
    </div>
  );
}
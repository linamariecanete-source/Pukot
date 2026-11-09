// src/customer/CustomerChatbot.js
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const SUGGESTED_QUESTIONS = [
  "How do I make a reservation?",
  "What are your catering packages?",
  "What are your operating hours?",
  "Where are you located?",
  "How do I cancel my reservation?",
  "What kind of food do you serve?",
];

// ── Match user query against FAQ keywords + question ──────────────────
function findBestMatch(query, faqs) {
  if (!query.trim() || faqs.length === 0) return null;
  const q = query.toLowerCase();

  const scored = faqs.map(faq => {
    let score = 0;

    if (faq.keywords) {
      // keywords is stored as comma-separated text e.g. "reserve,reservation,table"
      const kwList = typeof faq.keywords === "string"
        ? faq.keywords.split(",").map(k => k.trim())
        : faq.keywords;
      kwList.forEach(kw => {
        if (q.includes(kw.toLowerCase())) score += 3;
      });
    }

    const qWords = faq.question.toLowerCase().split(" ");
    qWords.forEach(w => {
      if (w.length > 3 && q.includes(w)) score += 1;
    });

    const aWords = faq.answer.toLowerCase().split(" ");
    aWords.forEach(w => {
      if (w.length > 4 && q.includes(w)) score += 0.5;
    });

    return { ...faq, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best.score >= 2 ? best : null;
}

// ── Message bubble ─────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isBot = msg.from === "bot";
  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 0,
      alignItems: "flex-end",
      gap: 8,
    }}>
      {isBot && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
        }}>🦐</div>
      )}
      <div style={{
        maxWidth: "75%",
        padding: "10px 14px",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isBot ? "#f5f5f5" : "#000",
        color: isBot ? "#000" : "#fff",
        fontSize: 14,
        lineHeight: 1.4,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 400,
      }}>
        {msg.text}
        {msg.category && (
          <div style={{
            marginTop: 6,
            fontSize: 11,
            color: isBot ? "#666" : "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 500,
          }}>📂 {msg.category}</div>
        )}
        <div style={{
          marginTop: 4,
          fontSize: 11,
          color: isBot ? "#999" : "rgba(255,255,255,0.6)",
          textAlign: isBot ? "left" : "right",
        }}>
          {new Date(msg.time).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function CustomerChatbot() {
  const user = getStoredUser();

  const [faqs, setFaqs]         = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      time: Date.now(),
      text: `Hi ${user.full_name?.split(" ")[0] || "there"}! 👋 I'm Pukot's FAQ Assistant. I can answer your questions about reservations, catering, our menu, operating hours, and more. What would you like to know?`,
    }
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [faqLoading, setFaqLoading] = useState(true);
  const [showSuggest, setShowSuggest] = useState(true);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Load FAQs ────────────────────────────────────────────────────
  useEffect(() => {
    const loadFaqs = async () => {
      const { data } = await supabase
        .from("faq")
        .select("*");
      setFaqs(data || []);
      setFaqLoading(false);
    };
    loadFaqs();
  }, []);

  // ── Auto scroll ──────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Send message ─────────────────────────────────────────────────
  const sendMessage = (text) => {
    const userText = (text || input).trim();
    if (!userText) return;

    setShowSuggest(false);
    setMessages(prev => [...prev, { id: Date.now(), from: "user", time: Date.now(), text: userText }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const match = findBestMatch(userText, faqs);
      const botMsg = match
        ? { id: Date.now() + 1, from: "bot", time: Date.now(), text: match.answer, category: match.category }
        : { id: Date.now() + 1, from: "bot", time: Date.now(), text: "I'm sorry, I don't have an answer for that yet. 😔 For more specific inquiries, please visit our Contact page or message us on Facebook @PukotSeafood. Our team will be happy to assist you!" };

      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      from: "bot",
      time: Date.now(),
      text: `Hi again! 👋 How can I help you today?`,
    }]);
    setShowSuggest(true);
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .chat-input::placeholder { color: #999; }
        .chat-input:focus { border-color: #000 !important; background: #fff !important; outline: none; }
        .suggest-chip:hover { background: #f0f0f0 !important; border-color: #ccc !important; color: #000 !important; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.botAvatar}>🦐</div>
          <div>
            <h1 style={S.title}>FAQ Assistant</h1>
            <div style={S.statusRow}>
              <div style={S.statusDot} />
              <span style={S.statusText}>
                {faqLoading ? "Loading..." : `Online · ${faqs.length} answers available`}
              </span>
            </div>
          </div>
        </div>
        <button style={S.clearBtn} onClick={clearChat}>🔄 New Chat</button>
      </div>

      {/* ── CHAT BOX ──────────────────────────────────────────── */}
      <div style={S.chatBox}>

        {/* Messages area */}
        <div style={S.messagesArea}>
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 0, animation: "fadeUp 0.2s ease" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#000",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>🦐</div>
              <div style={{
                padding: "10px 14px",
                background: "#f5f5f5",
                borderRadius: "4px 16px 16px 16px",
                display: "flex", gap: 4, alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#000",
                    animation: `bounce 0.9s ease ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {showSuggest && !faqLoading && (
          <div style={S.suggestArea}>
            <div style={S.suggestLabel}>💡 Suggested questions — tap to ask:</div>
            <div style={S.suggestRow}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="suggest-chip"
                  style={S.suggestChip}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSubmit} style={S.inputArea}>
          <input
            ref={inputRef}
            className="chat-input"
            style={S.input}
            placeholder="Type your question here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || faqLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            style={{
              ...S.sendBtn,
              opacity: (!input.trim() || loading || faqLoading) ? 0.4 : 1,
            }}
            disabled={!input.trim() || loading || faqLoading}
          >
            ➤
          </button>
        </form>

        {/* Bottom note */}
        <div style={S.bottomNote}>
          🦐 Pukot FAQ Assistant · Answers are based on our FAQ database
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { 
    padding: "20px", 
    maxWidth: 900, 
    minHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Poppins', sans-serif" 
  },

  // Header
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "16px 20px", borderBottom: "1px solid #e0e0e0" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  botAvatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18,
  },
  title: { margin: "0 0 2px", fontSize: 18, fontWeight: 600, color: "#000", fontFamily: "'Poppins', sans-serif" },
  statusRow: { display: "flex", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: "50%", background: "#4ade80" },
  statusText: { fontSize: 12, color: "#666", fontWeight: 500 },
  clearBtn: {
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: 6, color: "#666",
    fontSize: 12, fontWeight: 500, cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },

  // Chat box
  chatBox: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  // Messages
  messagesArea: {
    padding: "20px",
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  // Suggestions
  suggestArea: { padding: "16px 20px", borderTop: "1px solid #e0e0e0", background: "#fafafa" },
  suggestLabel: { fontSize: 12, color: "#666", fontWeight: 500, marginBottom: 12, textTransform: "none", letterSpacing: "normal" },
  suggestRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  suggestChip: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 20,
    color: "#333",
    fontSize: 13, fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    transition: "all 0.2s",
  },

  // Input
  inputArea: { display: "flex", gap: 12, padding: "16px 20px", borderTop: "1px solid #e0e0e0", background: "#fafafa" },
  input: {
    flex: 1, padding: "12px 16px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 24,
    color: "#000", fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    transition: "all 0.2s",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    background: "#000",
    border: "none", color: "#fff", fontSize: 16,
    cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity 0.2s",
  },

  // Bottom note
  bottomNote: { fontSize: 11, color: "#999", textAlign: "center", padding: "8px 20px", fontWeight: 400, background: "#fafafa", borderTop: "1px solid #e0e0e0" },
};
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import "./Chatbot.css";
import pukotLogo from "../images/puk.jpg";

export default function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat]       = useState([
    { sender: "bot", text: "Hi! I am your Pukot Assistant. How can I help you today?" }
  ]);
  const [faqs, setFaqs]       = useState([]);
  const [typing, setTyping]   = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => { fetchFAQs(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, typing]);

  async function fetchFAQs() {
    const { data, error } = await supabase.from("faq").select("*");
    if (!error) setFaqs(data);
  }

  function getBotReply(userMessage) {
    const msg = userMessage.toLowerCase();
    for (let faq of faqs) {
      const keywords = faq.keywords.split(",");
      if (keywords.some((k) => msg.includes(k.trim()))) {
        return faq.answer;
      }
    }
    return "Sorry, I could not find an answer for that. Please contact us directly at info@pukotseafood.com or visit our Contact page.";
  }

  function handleSend() {
    if (!message.trim()) return;
    const userMessage = message;
    setChat(prev => [...prev, { sender: "user", text: userMessage }]);
    setMessage("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setChat(prev => [...prev, { sender: "bot", text: getBotReply(userMessage) }]);
    }, 700);
  }

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>
          <span className="chatbot-toggle-icon">💬</span>
        </button>
      )}

      {/* Chat box */}
      {open && (
        <div className="chatbot-box">

          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar"><img src={pukotLogo} alt="Pukot" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /></div>
              <div>
                <div className="chat-header-name">Pukot Assistant</div>
                <div className="chat-header-status">
                  <span className="chat-status-dot" /> Online
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chat-body">
            {chat.map((c, i) => (
              <div key={i} className={`chat-bubble-wrap ${c.sender}`}>
                {c.sender === "bot" && <div className="chat-bot-icon"><img src={pukotLogo} alt="Pukot" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /></div>}
                <div className={`chat-bubble ${c.sender}`}>{c.text}</div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-bubble-wrap bot">
                <div className="chat-bot-icon"><img src={pukotLogo} alt="Pukot" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /></div>
                <div className="chat-bubble bot typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
              placeholder="Ask a question..."
            />
            <button onClick={handleSend} disabled={!message.trim()}>Send</button>
          </div>

        </div>
      )}
    </>
  );
}
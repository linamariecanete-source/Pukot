// src/customer/FloatingChatbot.js
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const Icon = {
  Chat: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Close: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Send: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi! I'm the Pukot AI Assistant. How can I help you today?" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // 👇 SECURELY PULLING FROM .env
      const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY; 

      // 1. Fetch live menu from Supabase (Increased limit to 150)
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("name, category, price, description")
        .limit(150);

      let menuContext = "Here are all the menu items:\n";
      if (menuItems) {
        menuItems.forEach(item => {
          menuContext += `- ${item.name} (${item.category}): ₱${item.price}\n`;
        });
      }

      // 2. Build the system prompt
      const systemPrompt = `You are the AI assistant for Pukot Seafood Restaurant.
Answer the user's question using ONLY the facts provided below.
If the answer is not in the facts, politely say: "I'm sorry, I don't have that information. Please contact the restaurant."

<restaurant_facts>
- Opening Hours: 10:00 AM to 9:00 PM daily.
- Downpayment Policy: Dine-in is free unless 5+ pax or peak hour (11AM-1PM, 6PM-8PM), which requires 20%. Catering requires 50%.
- Catering Packages: Boodle sa Bangka (15-20 pax) and Pukot Cruise Ship (20-30 pax).
${menuContext}
</restaurant_facts>`;

      const history = messages
        .filter(m => m.text && m.text.trim() !== "" && m.text !== "Hi! I'm the Pukot AI Assistant. How can I help you today?")
        .map(m => ({ role: m.role, content: m.text }));

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage }
      ];

      // 3. Send to Groq using the free model
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b", 
          messages: apiMessages,
          temperature: 0.1,
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const botReply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", text: botReply }]);

    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: "assistant", text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        .chat-window { position: fixed; bottom: 90px; right: 24px; width: 360px; height: 500px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 12px 40px rgba(10, 61, 71, 0.15); display: flex; flex-direction: column; overflow: hidden; z-index: 9999; border: 1px solid #e0f2f1; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-family: 'Nunito', sans-serif; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .chat-header { background: #0A3D47; color: white; padding: 16px; display: flex; align-items: center; gap: 12px; }
        .chat-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #FAFAF9; }
        .msg-bubble { max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; font-weight: 600; white-space: pre-wrap; }
        .msg-user { align-self: flex-end; background: #00b4d8; color: white; border-bottom-right-radius: 4px; }
        .msg-bot { align-self: flex-start; background: white; color: #0A3D47; border: 1px solid #e0f2f1; border-bottom-left-radius: 4px; }
        .chat-input-area { padding: 12px; background: white; border-top: 1px solid #e0f2f1; display: flex; gap: 8px; }
        .chat-input { flex: 1; padding: 10px 14px; border: 1px solid #e0f2f1; border-radius: 24px; outline: none; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #0A3D47; }
        .chat-input:focus { border-color: #00b4d8; }
        .chat-send { width: 40px; height: 40px; border-radius: 50%; background: #0A3D47; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .chat-send:hover { background: #00b4d8; }
        .chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .typing { display: flex; gap: 4px; padding: 12px 16px; background: white; border: 1px solid #e0f2f1; border-radius: 14px; border-bottom-left-radius: 4px; align-self: flex-start; width: fit-content; }
        .dot { width: 6px; height: 6px; background: #90e0ef; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .dot:nth-child(1) { animation-delay: -0.32s; } .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        .chat-toggle { position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; border-radius: 50%; background: #0A3D47; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 24px rgba(10, 61, 71, 0.3); z-index: 9998; transition: all 0.3s ease; }
        .chat-toggle:hover { transform: scale(1.05); background: #00b4d8; }
      `}</style>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#00b4d8", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon.Chat /></div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Pukot Assistant</div>
              <div style={{ fontSize: 11, color: "#90e0ef", fontWeight: 600 }}>Powered by Groq AI</div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg-bubble ${msg.role === "user" ? "msg-user" : "msg-bot"}`}>{msg.text}</div>
            ))}
            {isLoading && <div className="typing"><div className="dot" /><div className="dot" /><div className="dot" /></div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input className="chat-input" placeholder="Ask about our menu..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
            <button type="submit" className="chat-send" disabled={!input.trim() || isLoading}><Icon.Send /></button>
          </form>
        </div>
      )}

      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <Icon.Close /> : <Icon.Chat />}
      </button>
    </>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Send, User, Bot } from "lucide-react";

export default function CopilotView() {
  const [copilotInput, setCopilotInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 'init', role: 'assistant', content: 'Hello! I am your Alpha-Copilot. How can I assist your arbitrage operations?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (!copilotInput.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: copilotInput };
    setMessages(prev => [...prev, userMsg]);
    const query = copilotInput;
    setCopilotInput('');

    setTimeout(() => {
      let reply = 'System nominal. GES target optimal.';
      if (query.toLowerCase().includes('start')) reply = 'Engine started, scanning mempool.';
      else if (query.toLowerCase().includes('audit')) reply = 'Audit: 36 gates passed. Profit momentum positive.';
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-[75vh] card-ash rounded-xl overflow-hidden fade-in-up">
      <div className="px-6 py-4 border-b border-ash bg-ash flex justify-between">
        <div>
          <BrainCircuit size={18} className="text-cyan-400 inline mr-2" />
          <span className="font-bold uppercase text-white">Alpha-Copilot</span>
        </div>
        <span className="text-[9px] text-secondary">allbright DeFi</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-data-black/20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-ash flex items-center justify-center shrink-0">
              {msg.role === 'user' ? <User size={14} className="text-secondary" /> : <Bot size={14} className="text-secondary" />}
            </div>
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-ash text-white rounded-tr-none' 
                : 'bg-black border border-ash rounded-tl-none text-secondary'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-5 border-t border-ash bg-ash">
        <div className="flex gap-3">
          <input 
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-data-black border border-ash rounded-xl px-4 py-3 text-sm text-white" 
            placeholder="Ask about arbitrage..."
          />
          <button 
            onClick={sendMessage}
            className="bg-cyan-600 px-5 rounded-xl text-black font-bold hover:bg-cyan-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Bot, User, Send, Sparkles, Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * BSS-28: Alpha-Copilot Interactive Panel
 * Simplified professional assistant interface for allbright orchestration.
 */
export default function Copilot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'assistant', content: 'Hello! I am your allbright Alpha-Copilot. How can I assist you with your arbitrage operations today?', timestamp: Date.now() }
  ]);
  const [suggestedCommand, setSuggestedCommand] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage, timestamp: Date.now() }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let response = 'I understand your request. For optimal arbitrage operations, ensure your engine is running and RPC endpoints are healthy.';
      
      if (userMessage.toLowerCase().includes('start')) {
        response = 'Starting engine... Engine is now LIVE and monitoring for opportunities.';
      } else if (userMessage.toLowerCase().includes('stop')) {
        response = 'Engine stopped. All positions closed safely.';
      } else if (userMessage.toLowerCase().includes('audit')) {
        response = 'Running system audit... GES: 94.2%. 36-KPI Gates: PASS. All systems nominal.';
      }
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-[#111217] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
            <Zap className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tighter uppercase text-white leading-none flex items-center">
              BRIGHT<span className="text-cyan-500">SKY</span>
              <span className="text-zinc-500 ml-2">Alpha-Copilot</span>
            </h2>
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter mt-0.5">
              allbright DeFi Software Developer Ltd.
            </span>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-3 h-9 rounded border bg-zinc-800/50 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed">
          <Lock size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Lockdown</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              msg.role === 'user' ? 'bg-zinc-800 border-zinc-700' : 'bg-[#1a1c20] border-cyan-500/30'
            }`}>
              {msg.role === 'user' ? <User size={16} className="text-zinc-400" /> : <Bot size={16} className="text-cyan-400" />}
            </div>
            <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm ${
                msg.role === 'user' ? 'bg-zinc-800 text-zinc-200 rounded-tr-none' : 'bg-black/30 border border-zinc-800 text-zinc-300 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-[#1a1c20] border-cyan-500/30">
              <Bot size={16} className="text-cyan-400 animate-pulse" />
            </div>
            <div className="text-zinc-500 text-sm">Processing...</div>
          </div>
        )}
      </div>

      {/* Suggested Command */}
      {suggestedCommand && (
        <div className="mx-8 mb-4 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Copilot Refinement</span>
          </div>
          <p className="font-mono text-[12px] text-zinc-300 italic mb-5 leading-relaxed bg-black/20 p-3 rounded-lg border border-zinc-800/50 italic">"{suggestedCommand}"</p>
          <div className="flex gap-3">
            <button onClick={() => { setInput(suggestedCommand); setSuggestedCommand(null); }} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-black uppercase rounded-lg transition-all shadow-lg">
              Proceed
            </button>
            <button onClick={() => setSuggestedCommand(null)} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-black uppercase rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-8 bg-black/40 border-t border-zinc-800/50 backdrop-blur-sm">
        <div className="relative">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Enter command for Alpha-Copilot..." 
            disabled={isTyping || !!suggestedCommand} 
            className="font-mono w-full bg-[#1a1c20] border border-zinc-800 rounded-xl pl-4 pr-12 py-4 text-[13px] font-medium text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" 
          />
          <button 
            type="submit" 
            disabled={isTyping || !input.trim() || !!suggestedCommand} 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

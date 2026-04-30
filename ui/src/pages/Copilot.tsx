import { useState } from "react";
import { Send, Bot, User, Zap, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function Copilot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your BrightSky Copilot. How can I assist you with your arbitrage operations today?" }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: input }]);
    setInput("");
    
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "I've analyzed your request. BrightSky engine is running optimally." }]);
    }, 1000);
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Bot className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-100">Copilot Assistant</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="border-b border-zinc-800 p-4 flex justify-between items-center bg-[#1a1a1c]">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-zinc-400" />
              <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">Mission Control Chat</span>
            </div>
          </div>
          
          {/* Messages Area - 100% Black inner box */}
          <div className="flex-1 bg-black p-6 overflow-y-auto space-y-6">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-primary/20 text-primary'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-zinc-300" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-lg max-w-[80%] font-mono text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#1a1a1c] border border-zinc-800 text-zinc-200' 
                    : 'bg-transparent border border-zinc-800 text-primary'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1a1a1c] border-t border-zinc-800">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot for assistance..."
                className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 font-mono text-sm focus:outline-none focus:border-primary/50"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                SEND
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="border-b border-zinc-800 p-4">
            <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">System Capabilities</span>
          </div>
          <div className="flex-1 bg-black p-6 space-y-4">
            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Zap className="w-4 h-4" />
                <span className="font-bold font-mono text-sm">Strategy Analysis</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Ask about optimal arbitrage routes and mempool conditions.</p>
            </div>
            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Terminal className="w-4 h-4" />
                <span className="font-bold font-mono text-sm">Engine Control</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Request start, stop, or configuration changes directly via chat.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

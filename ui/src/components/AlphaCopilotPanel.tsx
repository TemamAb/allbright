import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../App';
import { Bot, User, Send, Sparkles, Terminal, Brain, ChevronRight, Loader2, History, Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Be } from '@/lib/utils';
import { useGetEngineStatus } from "@workspace/api-client-react";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  meta?: any;
}

/**
 * BSS-28: Alpha-Copilot Interactive Panel
 * Professional assistant-grade interface for allbright orchestration.
 */
export default function AlphaCopilotPanel() {
  const { socket } = useSocket();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { data: engineStatus, refetch: refetchStatus } = useGetEngineStatus({ query: { refetchInterval: 5000, queryKey: ["engineStatus"] } });
  const [suggestedCommand, setSuggestedCommand] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('copilot_command_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && engineStatus) {
      const systemName = engineStatus.ghostMode ? "Elite Protocol" : "allbright";
      setMessages([
        { 
          id: 'init-' + Date.now(),
          role: "assistant", 
          content: `Hello! I am your ${systemName} Alpha-Copilot. How can I assist you with your arbitrage operations today?`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [engineStatus, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addToHistory = (command: string) => {
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== command);
      const updated = [command, ...filtered].slice(0, 10);
      localStorage.setItem('copilot_command_history', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!socket) return;

    const handleCopilotEvent = (payload: { type: string; data: any; timestamp: number }) => {
      const { type, data, timestamp } = payload;
      if (type === 'user-message') {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: 'user',
          content: data.content,
          timestamp: timestamp || Date.now()
        }]);
      } else if (type === 'ai-message') {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: data.content,
          timestamp: timestamp || Date.now(),
          meta: data.meta
        }]);
      } else if (type === 'ai-status') {
        setIsTyping(true);
      } else if (type === 'engine-update') {
        refetchStatus();
      }
    };

    socket.on('copilot_event', handleCopilotEvent);
    return () => { socket.off('copilot_event', handleCopilotEvent); };
  }, [socket]);

  const executeCommand = async (command: string) => {
    try {
      const res = await fetch('/api/copilot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.success) {
        addToHistory(command);
      }
    } catch (err) {
      toast.error('Execution Failed');
    }
  };

  const handleArticulate = async (command: string) => {
    setIsTyping(true);
    try {
      const res = await fetch('/api/copilot/articulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.success) {
        setSuggestedCommand(data.articulated);
        setInput('');
      }
    } catch (err) {
      toast.error('Bridge Connection Failure');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userCommand = input.trim();
    const lowerCommand = userCommand.toLowerCase();
    const isDirectCommand = lowerCommand.includes('start engine') || lowerCommand.includes('stop engine') || lowerCommand.includes('tune kpi');

    if (isDirectCommand) {
      await executeCommand(userCommand);
      setInput('');
    } else {
      await handleArticulate(userCommand);
    }
  };

  const handleLockdown = async () => {
    if (!engineStatus?.running) return;
    
    try {
      const res = await fetch('/api/engine/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.error("SYSTEM LOCKDOWN INITIATED", { 
          description: "All engine operations halted immediately.",
          icon: <Lock className="text-red-500" />
        });
      }
    } catch (e) {
      toast.error("Lockdown Dispatch Failed");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-[#111217] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="px-6 py-4 border-b border-zinc-800 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center mr-1">
            <Zap className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tighter uppercase text-white leading-none flex items-center">
              {engineStatus?.ghostMode ? (
                "ELITE PROTOCOL"
              ) : (
                <>BRIGHT<span className="text-cyan-500">SKY</span></>
              )}
              <span className="text-zinc-500 ml-2">Alpha-Copilot</span>
            </h2>
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter mt-0.5">
              {engineStatus?.ghostMode ? 'Elite Protocol Operations' : 'allbright DeFi Software Developer Ltd.'}
            </span>
          </div>
        </div>

        {/* Emergency System Lockdown */}
        <button 
          onClick={handleLockdown}
          disabled={!engineStatus?.running}
          className={`flex items-center gap-2 px-3 h-9 rounded border transition-all ${
            engineStatus?.running 
              ? 'bg-red-500/10 border-red-500/40 text-red-500 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
              : 'bg-zinc-800/50 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
          }`}
        >
          <Lock size={12} className={engineStatus?.running ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Lockdown</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.02),transparent)]">
        {messages.map((msg) => (
          <div key={msg.id} className={Be("flex gap-5", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={Be("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", msg.role === 'user' ? "bg-zinc-800 border-zinc-700" : "bg-[#1a1c20] border-cyan-500/30")}>
              {msg.role === 'user' ? <User size={16} className="text-zinc-400" /> : <Bot size={16} className="text-cyan-400" />}
            </div>
            <div className={Be("flex flex-col space-y-2 max-w-[75%]", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={Be("px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm", msg.role === 'user' ? "bg-zinc-800 text-zinc-200 rounded-tr-none" : "bg-black/30 border border-zinc-800 text-zinc-300 rounded-tl-none")}>
                {msg.content}
              </div>
              {msg.meta && (
                <div className="w-full mt-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <Terminal size={12} className="text-zinc-600" />
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono">Cognition Trace</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.isArray(msg.meta) && msg.meta.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col p-2 bg-black/40 rounded-lg border border-zinc-800/50">
                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter mb-1 font-mono">{item.category}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-mono">Status:</span>
                          <span className={Be("text-[10px] font-black font-mono", item.tuned ? "text-emerald-400" : "text-amber-400")}>{item.tuned ? 'SYNCED' : 'PENDING'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <span className="font-mono text-[9px] text-zinc-600 font-bold uppercase tracking-widest tabular-nums">
                {format(msg.timestamp, "HH:mm:ss")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {suggestedCommand && (
        <div className="mx-8 mb-4 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Copilot Refinement</span>
          </div>
          <p className="font-mono text-[12px] text-zinc-300 italic mb-5 leading-relaxed bg-black/20 p-3 rounded-lg border border-zinc-800/50 italic">"{suggestedCommand}"</p>
          <div className="flex gap-3">
            <button onClick={() => { executeCommand(suggestedCommand); setSuggestedCommand(null); }} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-black uppercase rounded-lg transition-all shadow-lg">Proceed with Optimized Command</button>
            <button onClick={() => setSuggestedCommand(null)} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-black uppercase rounded-lg transition-all">Cancel</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8 bg-black/40 border-t border-zinc-800/50 backdrop-blur-sm relative">
        {!engineStatus?.running && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all">
            <div className="flex items-center gap-3 px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-300">
              <div className="p-1 rounded-full bg-red-500/20">
                <Lock size={14} className="text-red-500 animate-pulse" />
              </div>
              <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em]">Operational Lockdown Active</span>
            </div>
          </div>
        )}
        <div className="relative">
          <button type="button" onClick={() => setShowHistory(!showHistory)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-cyan-400 transition-colors"><History size={16} /></button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={suggestedCommand ? "Awaiting confirmation above..." : "Enter command for Alpha-Copilot..."} disabled={isTyping || !!suggestedCommand} className="font-mono w-full bg-[#1a1c20] border border-zinc-800 rounded-xl pl-12 pr-12 py-4 text-[13px] font-medium text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 shadow-inner" />
          {showHistory && commandHistory.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1c20] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-4 py-2 border-b border-zinc-800 bg-black/20 flex items-center justify-between"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Successes</span></div>
              <div className="max-h-48 overflow-y-auto">
                {commandHistory.map((cmd, i) => (
                  <button key={i} onClick={() => { setInput(cmd); setShowHistory(false); }} className="w-full px-4 py-2.5 text-left text-[12px] text-zinc-400 hover:bg-cyan-500/5 hover:text-cyan-400 border-b border-zinc-800/50 last:border-0 transition-colors flex items-center gap-3"><ChevronRight size={10} className="text-zinc-600" />{cmd}</button>
                ))}
              </div>
            </div>
          )}
          <button type="submit" disabled={isTyping || !input.trim() || !!suggestedCommand || !engineStatus?.running} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all active:scale-95"><Send size={16} /></button>
        </div>
      </form>
    </div>
  );
}
